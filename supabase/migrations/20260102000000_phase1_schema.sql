-- ===========================================
-- Mavericks Phase 1 Schema Migration
-- ===========================================
-- Run after starter-schema.sql:
--   supabase migration new phase1_schema
--   (paste this content into the generated file)
--   supabase db push

-- ===========================================
-- 1. EXTEND PROFILES TABLE
-- ===========================================
-- Add role and Gem user mapping to existing profiles table

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'recruiter'
  CHECK (role IN ('recruiter', 'admin'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gem_user_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_outbound_goal INTEGER NOT NULL DEFAULT 200;

-- All authenticated users can view all profiles
-- (needed for team page, leaderboard, recruiter names on candidate cards)
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Drop the starter "own profile only" policy since we're replacing it
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ===========================================
-- 2. APP SETTINGS TABLE
-- ===========================================
-- Key-value store for admin toggles and config

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "All authenticated users can read settings"
  ON app_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can update settings
CREATE POLICY "Admins can update settings"
  ON app_settings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Default settings
INSERT INTO app_settings (key, value) VALUES
  ('leaderboard_public', '"false"'::jsonb),
  ('outbound_tracking_start_date', '"2025-12-10"'::jsonb)
ON CONFLICT (key) DO NOTHING;


-- ===========================================
-- 3. PROJECTS TABLE
-- ===========================================
-- Recruiting projects with hiring goals

CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  hire_goal INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Admins have full access to projects
CREATE POLICY "Admins have full access to projects"
  ON projects FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_dates ON projects(start_date, end_date);


-- ===========================================
-- 4. PROJECT ASSIGNMENTS TABLE
-- ===========================================
-- Many-to-many: recruiters assigned to projects

CREATE TABLE IF NOT EXISTS project_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  individual_hire_goal INTEGER, -- optional per-recruiter goal within project
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, recruiter_id)
);

ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;

-- Admins have full access
CREATE POLICY "Admins have full access to assignments"
  ON project_assignments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Recruiters can view their own assignments
CREATE POLICY "Recruiters can view own assignments"
  ON project_assignments FOR SELECT
  USING (recruiter_id = auth.uid());

CREATE INDEX idx_project_assignments_recruiter ON project_assignments(recruiter_id);
CREATE INDEX idx_project_assignments_project ON project_assignments(project_id);

-- Deferred policy: recruiters can view projects they are assigned to
-- (must come after project_assignments table exists)
CREATE POLICY "Recruiters can view assigned projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_assignments
      WHERE project_assignments.project_id = projects.id
        AND project_assignments.recruiter_id = auth.uid()
    )
  );


-- ===========================================
-- 5. CANDIDATES TABLE
-- ===========================================
-- Full candidate tracker - replaces Excel/Google Sheets
-- All 25+ required fields from the requirements doc

CREATE TABLE IF NOT EXISTS candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id UUID NOT NULL REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),

  -- Candidate info
  candidate_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  title TEXT,               -- current title
  company TEXT,             -- current company
  school TEXT,              -- education
  location TEXT,

  -- Role info
  role TEXT NOT NULL,       -- role they're interviewing for
  hiring_manager TEXT,
  team TEXT,

  -- Source tracking
  source TEXT NOT NULL DEFAULT 'LinkedIn'
    CHECK (source IN ('LinkedIn', 'Referral', 'Indeed', 'Agency', 'Applicant', 'Gem', 'Other')),
  source_detail TEXT,       -- e.g. referral name, agency name

  -- Pipeline stage
  stage TEXT NOT NULL DEFAULT 'sourced'
    CHECK (stage IN (
      'sourced', 'contacted', 'phone_screen',
      'submittal', 'first_round', 'second_round',
      'third_round', 'final_round', 'offer', 'accepted',
      'rejected', 'withdrawn'
    )),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'rejected', 'withdrawn', 'hired', 'on_hold')),

  -- Interview dates (nullable - filled as candidate progresses)
  recruiter_screen_date DATE,
  submitted_date DATE,
  hm_interview_date DATE,
  first_round_date DATE,
  second_round_date DATE,
  third_round_date DATE,
  final_round_date DATE,
  offer_date DATE,
  accepted_date DATE,

  -- Notes
  notes TEXT,
  additional_notes TEXT,
  rejection_reason TEXT,

  -- Resume
  resume_url TEXT,          -- Supabase storage URL

  -- Gender tracking (1/0 as per Kyle's system)
  gender_id INTEGER CHECK (gender_id IN (0, 1)),

  -- Metadata
  last_activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Admins see all candidates
CREATE POLICY "Admins have full access to candidates"
  ON candidates FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Recruiters can view and edit their own candidates
CREATE POLICY "Recruiters can manage own candidates"
  ON candidates FOR ALL
  USING (recruiter_id = auth.uid());

-- Recruiters can view rejected candidates (for the shared pool)
CREATE POLICY "Recruiters can view rejected candidates"
  ON candidates FOR SELECT
  USING (
    status = 'rejected'
    AND auth.uid() IS NOT NULL
  );

CREATE INDEX idx_candidates_recruiter ON candidates(recruiter_id);
CREATE INDEX idx_candidates_project ON candidates(project_id);
CREATE INDEX idx_candidates_stage ON candidates(stage);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_name ON candidates(candidate_name);
CREATE INDEX idx_candidates_company ON candidates(company);
CREATE INDEX idx_candidates_last_activity ON candidates(last_activity_date DESC);


-- ===========================================
-- 6. CANDIDATE STAGE HISTORY
-- ===========================================
-- Tracks every stage transition with timestamps for speed monitoring

CREATE TABLE IF NOT EXISTS candidate_stage_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

ALTER TABLE candidate_stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stage history"
  ON candidate_stage_history FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert stage history"
  ON candidate_stage_history FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX idx_stage_history_candidate ON candidate_stage_history(candidate_id);
CREATE INDEX idx_stage_history_date ON candidate_stage_history(changed_at DESC);


-- ===========================================
-- 7. OUTBOUND ENTRIES TABLE
-- ===========================================
-- Weekly outbound message tracking (manual + Gem + CSV)

CREATE TABLE IF NOT EXISTS outbound_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id UUID NOT NULL REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,

  -- Counts
  outbound_count INTEGER NOT NULL DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_replied INTEGER DEFAULT 0,
  interested_count INTEGER DEFAULT 0,

  -- Source of this data
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'gem', 'linkedin_csv')),

  -- Goal tracking (auto-calculated from profile.weekly_outbound_goal)
  outbound_goal INTEGER,

  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate entries per recruiter/week/source
  UNIQUE(recruiter_id, week_start, source)
);

ALTER TABLE outbound_entries ENABLE ROW LEVEL SECURITY;

-- Admins see all entries
CREATE POLICY "Admins have full access to outbound entries"
  ON outbound_entries FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Recruiters can manage their own entries
CREATE POLICY "Recruiters can manage own outbound entries"
  ON outbound_entries FOR ALL
  USING (recruiter_id = auth.uid());

CREATE INDEX idx_outbound_recruiter ON outbound_entries(recruiter_id);
CREATE INDEX idx_outbound_week ON outbound_entries(week_start);
CREATE INDEX idx_outbound_project ON outbound_entries(project_id);


-- ===========================================
-- 8. WEEKLY KPI SNAPSHOTS
-- ===========================================
-- Permanent weekly snapshots for historical trend analysis

CREATE TABLE IF NOT EXISTS weekly_kpi_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id UUID NOT NULL REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),
  week_start DATE NOT NULL,

  -- Pipeline counts at time of snapshot
  sourced_count INTEGER NOT NULL DEFAULT 0,
  contacted_count INTEGER NOT NULL DEFAULT 0,
  phone_screen_count INTEGER NOT NULL DEFAULT 0,
  submittal_count INTEGER NOT NULL DEFAULT 0,
  first_round_count INTEGER NOT NULL DEFAULT 0,
  second_round_count INTEGER NOT NULL DEFAULT 0,
  third_round_count INTEGER NOT NULL DEFAULT 0,
  final_round_count INTEGER NOT NULL DEFAULT 0,
  offer_count INTEGER NOT NULL DEFAULT 0,
  accepted_count INTEGER NOT NULL DEFAULT 0,

  -- Outbound metrics for the week
  outbound_total INTEGER NOT NULL DEFAULT 0,
  interest_rate DECIMAL(5,2),           -- % of outbound that got interest
  reply_rate DECIMAL(5,2),              -- % of outbound that got replies

  -- Conversion rates at snapshot time
  screen_to_submit_rate DECIMAL(5,2),
  submit_to_first_rate DECIMAL(5,2),
  first_to_offer_rate DECIMAL(5,2),
  offer_acceptance_rate DECIMAL(5,2),

  -- Totals
  total_hires INTEGER NOT NULL DEFAULT 0,
  hire_goal_progress DECIMAL(5,2),      -- % of project hire goal achieved

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(recruiter_id, project_id, week_start)
);

ALTER TABLE weekly_kpi_snapshots ENABLE ROW LEVEL SECURITY;

-- Admins see all snapshots
CREATE POLICY "Admins have full access to kpi snapshots"
  ON weekly_kpi_snapshots FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Recruiters see their own snapshots
CREATE POLICY "Recruiters can view own snapshots"
  ON weekly_kpi_snapshots FOR SELECT
  USING (recruiter_id = auth.uid());

CREATE INDEX idx_kpi_recruiter ON weekly_kpi_snapshots(recruiter_id);
CREATE INDEX idx_kpi_week ON weekly_kpi_snapshots(week_start);
CREATE INDEX idx_kpi_project ON weekly_kpi_snapshots(project_id);


-- ===========================================
-- 9. NOTIFICATIONS TABLE
-- ===========================================
-- In-app notifications (Phase 1: rejected candidate alerts only)

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'candidate_rejected'
    CHECK (type IN ('candidate_rejected', 'candidate_claimed', 'system')),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}'::jsonb,   -- e.g. { "candidate_id": "uuid" }
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (recipient_id = auth.uid());

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (recipient_id = auth.uid());

-- System can insert notifications (via service role)
-- No INSERT policy for regular users - insertions happen via server-side functions

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);


-- ===========================================
-- 10. REJECTED CANDIDATE CLAIMS
-- ===========================================
-- Tracks which recruiters have claimed or passed on rejected candidates

CREATE TABLE IF NOT EXISTS candidate_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('claimed', 'passed')),
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(candidate_id, recruiter_id)
);

ALTER TABLE candidate_claims ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view claims
CREATE POLICY "Authenticated users can view claims"
  ON candidate_claims FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can insert their own claims
CREATE POLICY "Users can insert own claims"
  ON candidate_claims FOR INSERT
  WITH CHECK (recruiter_id = auth.uid());

CREATE INDEX idx_claims_candidate ON candidate_claims(candidate_id);
CREATE INDEX idx_claims_recruiter ON candidate_claims(recruiter_id);


-- ===========================================
-- 11. GEM SYNC LOG
-- ===========================================
-- Track Gem API sync status and errors

CREATE TABLE IF NOT EXISTS gem_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL,   -- 'outbound', 'candidates', 'full'
  status TEXT NOT NULL DEFAULT 'started'
    CHECK (status IN ('started', 'completed', 'failed')),
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE gem_sync_log ENABLE ROW LEVEL SECURITY;

-- Admins can view sync logs
CREATE POLICY "Admins can view sync logs"
  ON gem_sync_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ===========================================
-- 12. HELPER FUNCTIONS
-- ===========================================

-- Function to notify all recruiters when a candidate is rejected
CREATE OR REPLACE FUNCTION notify_candidate_rejected()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when status changes to 'rejected'
  IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    INSERT INTO notifications (recipient_id, type, title, body, data)
    SELECT
      p.id,
      'candidate_rejected',
      'Candidate Available: ' || NEW.candidate_name,
      NEW.candidate_name || ' (' || COALESCE(NEW.title, '') || ' at ' || COALESCE(NEW.company, '') || ') was rejected from ' || COALESCE(NEW.role, 'a role') || '. Claim this candidate if interested.',
      jsonb_build_object(
        'candidate_id', NEW.id,
        'candidate_name', NEW.candidate_name,
        'company', NEW.company,
        'role', NEW.role,
        'rejection_reason', NEW.rejection_reason,
        'rejected_by', NEW.recruiter_id
      )
    FROM profiles p
    WHERE p.id != NEW.recruiter_id  -- Don't notify the rejecting recruiter
      AND p.is_active = true
      AND p.role = 'recruiter';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_candidate_rejected
  AFTER UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION notify_candidate_rejected();


-- Function to auto-log stage changes
CREATE OR REPLACE FUNCTION log_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage != OLD.stage THEN
    INSERT INTO candidate_stage_history (candidate_id, from_stage, to_stage, changed_by)
    VALUES (NEW.id, OLD.stage, NEW.stage, auth.uid());

    -- Update last_activity_date
    NEW.last_activity_date = NOW();

    -- Auto-fill date fields based on stage
    CASE NEW.stage
      WHEN 'phone_screen' THEN
        IF NEW.recruiter_screen_date IS NULL THEN NEW.recruiter_screen_date = CURRENT_DATE; END IF;
      WHEN 'submittal' THEN
        IF NEW.submitted_date IS NULL THEN NEW.submitted_date = CURRENT_DATE; END IF;
      WHEN 'first_round' THEN
        IF NEW.first_round_date IS NULL THEN NEW.first_round_date = CURRENT_DATE; END IF;
      WHEN 'second_round' THEN
        IF NEW.second_round_date IS NULL THEN NEW.second_round_date = CURRENT_DATE; END IF;
      WHEN 'third_round' THEN
        IF NEW.third_round_date IS NULL THEN NEW.third_round_date = CURRENT_DATE; END IF;
      WHEN 'final_round' THEN
        IF NEW.final_round_date IS NULL THEN NEW.final_round_date = CURRENT_DATE; END IF;
      WHEN 'offer' THEN
        IF NEW.offer_date IS NULL THEN NEW.offer_date = CURRENT_DATE; END IF;
      WHEN 'accepted' THEN
        IF NEW.accepted_date IS NULL THEN NEW.accepted_date = CURRENT_DATE; END IF;
        NEW.status = 'hired';
      ELSE NULL;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_candidate_stage_change
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION log_stage_change();


-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_outbound_entries_updated_at
  BEFORE UPDATE ON outbound_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ===========================================
-- 13. VIEWS FOR COMMON QUERIES
-- ===========================================

-- Recruiter performance summary view
CREATE OR REPLACE VIEW recruiter_performance AS
SELECT
  p.id AS recruiter_id,
  p.first_name || ' ' || p.last_name AS recruiter_name,
  p.email,
  p.weekly_outbound_goal,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') AS active_candidates,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'hired') AS total_hires,
  COUNT(DISTINCT c.id) FILTER (WHERE c.stage = 'offer') AS pending_offers,
  COALESCE(SUM(oe.outbound_count), 0) AS total_outbound,
  ROUND(
    CASE
      WHEN COALESCE(SUM(oe.outbound_count), 0) = 0 THEN 0
      ELSE (COALESCE(SUM(oe.interested_count), 0)::DECIMAL / SUM(oe.outbound_count) * 100)
    END, 2
  ) AS interest_rate
FROM profiles p
LEFT JOIN candidates c ON c.recruiter_id = p.id
LEFT JOIN outbound_entries oe ON oe.recruiter_id = p.id
WHERE p.role = 'recruiter' AND p.is_active = true
GROUP BY p.id, p.first_name, p.last_name, p.email, p.weekly_outbound_goal;


-- Pipeline conversion funnel view
CREATE OR REPLACE VIEW pipeline_funnel AS
SELECT
  project_id,
  recruiter_id,
  COUNT(*) FILTER (WHERE stage = 'sourced') AS sourced,
  COUNT(*) FILTER (WHERE stage = 'contacted') AS contacted,
  COUNT(*) FILTER (WHERE stage = 'phone_screen') AS phone_screen,
  COUNT(*) FILTER (WHERE stage = 'submittal') AS submittal,
  COUNT(*) FILTER (WHERE stage = 'first_round') AS first_round,
  COUNT(*) FILTER (WHERE stage = 'second_round') AS second_round,
  COUNT(*) FILTER (WHERE stage = 'third_round') AS third_round,
  COUNT(*) FILTER (WHERE stage = 'final_round') AS final_round,
  COUNT(*) FILTER (WHERE stage = 'offer') AS offer,
  COUNT(*) FILTER (WHERE stage = 'accepted') AS accepted,
  COUNT(*) AS total_candidates
FROM candidates
WHERE status NOT IN ('withdrawn')
GROUP BY project_id, recruiter_id;


-- ===========================================
-- 14. STORAGE BUCKET FOR RESUMES
-- ===========================================
-- Create in Supabase Dashboard -> Storage:
-- Bucket: "resumes" (private, use signed URLs)
-- Max file size: 10MB
-- Allowed types: application/pdf, application/msword,
--   application/vnd.openxmlformats-officedocument.wordprocessingml.document
