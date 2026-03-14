-- ===========================================
-- Gem Sync Enhancements
-- 1. gem_candidate_id on candidates (for dedup)
-- 2. gem_project_id on projects (for project mapping)
-- 3. Widen outbound_entries unique constraint to include project_id
-- 4. INSERT trigger on candidates for activity timeline
-- ===========================================

-- 1. Add gem_candidate_id to candidates for idempotent imports
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS gem_candidate_id TEXT;
CREATE INDEX IF NOT EXISTS idx_candidates_gem_id ON candidates(gem_candidate_id) WHERE gem_candidate_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_candidates_linkedin ON candidates(linkedin_url) WHERE linkedin_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email) WHERE email IS NOT NULL;

-- 2. Add gem_project_id to projects for Gem-to-Mavericks project mapping
ALTER TABLE projects ADD COLUMN IF NOT EXISTS gem_project_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_gem_id ON projects(gem_project_id) WHERE gem_project_id IS NOT NULL;

-- 3. Update outbound_entries unique constraint to support per-project gem rows
-- Drop old constraint and create new one that includes project_id
ALTER TABLE outbound_entries DROP CONSTRAINT IF EXISTS outbound_entries_recruiter_id_week_start_source_key;

-- Use a unique index with COALESCE so NULL project_id values are treated as equal
CREATE UNIQUE INDEX IF NOT EXISTS idx_outbound_unique_with_project
  ON outbound_entries(recruiter_id, week_start, source, COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- 4. Trigger to log initial 'sourced' event when a candidate is created
CREATE OR REPLACE FUNCTION log_candidate_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO candidate_stage_history (candidate_id, from_stage, to_stage, changed_by, notes)
  VALUES (
    NEW.id,
    NULL,
    NEW.stage,
    NEW.recruiter_id,
    'Sourced from ' || COALESCE(NEW.source, 'unknown')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_candidate_created ON candidates;
CREATE TRIGGER on_candidate_created
  AFTER INSERT ON candidates
  FOR EACH ROW EXECUTE FUNCTION log_candidate_created();

-- 5. Add FK from candidate_stage_history.changed_by to profiles for joins (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'candidate_stage_history_changed_by_fkey'
      AND table_name = 'candidate_stage_history'
  ) THEN
    ALTER TABLE candidate_stage_history
      ADD CONSTRAINT candidate_stage_history_changed_by_fkey
      FOREIGN KEY (changed_by) REFERENCES profiles(id);
  END IF;
END $$;
