-- ===========================================
-- Mavericks Phase 1 - Seed Data
-- ===========================================
-- Run AFTER phase1-schema.sql
-- Replace the UUID placeholders below with actual auth.users IDs
-- after creating users in Supabase Auth.

-- ===========================================
-- HOW TO USE:
-- 1. Create users in Supabase Auth (Dashboard > Authentication > Users)
-- 2. Copy their UUIDs into the variables below
-- 3. Run this script in the SQL editor
-- ===========================================

-- Step 1: Update the profiles that were auto-created by auth signup.
-- Replace these UUIDs with your actual user IDs.

-- Admin user (Kyle or whoever runs the platform)
-- UPDATE profiles SET
--   role = 'admin',
--   first_name = 'Kyle',
--   last_name = 'Barbato',
--   is_active = true,
--   weekly_outbound_goal = 200
-- WHERE id = 'YOUR-ADMIN-UUID-HERE';

-- Recruiter 1
-- UPDATE profiles SET
--   role = 'recruiter',
--   first_name = 'Sarah',
--   last_name = 'Chen',
--   is_active = true,
--   weekly_outbound_goal = 200
-- WHERE id = 'YOUR-RECRUITER-1-UUID-HERE';

-- Recruiter 2
-- UPDATE profiles SET
--   role = 'recruiter',
--   first_name = 'James',
--   last_name = 'Rodriguez',
--   is_active = true,
--   weekly_outbound_goal = 150
-- WHERE id = 'YOUR-RECRUITER-2-UUID-HERE';


-- ===========================================
-- SAMPLE PROJECTS
-- ===========================================

INSERT INTO projects (name, client_name, description, start_date, end_date, hire_goal, status) VALUES
  ('Vanta PM Recruiting', 'Vanta', 'Product Manager hiring for Vanta compliance platform team', '2026-01-15', '2026-06-30', 5, 'active'),
  ('Stripe SWE Pipeline', 'Stripe', 'Senior Software Engineer roles across payments infrastructure', '2026-02-01', '2026-07-31', 8, 'active'),
  ('Figma Design Lead', 'Figma', 'Design leadership role for the collaboration tools team', '2026-03-01', '2026-05-31', 2, 'active'),
  ('Ramp Finance Ops', 'Ramp', 'Finance operations analyst and manager positions', '2025-11-01', '2026-02-28', 3, 'completed'),
  ('Notion Engineering', 'Notion', 'Full-stack engineers for the workspace platform', '2026-01-01', '2026-04-30', 4, 'active')
ON CONFLICT DO NOTHING;


-- ===========================================
-- SAMPLE CANDIDATES
-- (Uses the first admin user as recruiter - update recruiter_id after creating users)
-- ===========================================
-- NOTE: These will fail if you haven't created auth users yet.
-- Uncomment and update the recruiter_id values after user setup.

-- To insert sample candidates, run something like:
/*
INSERT INTO candidates (recruiter_id, candidate_name, role, email, title, company, school, location, source, stage, status, hiring_manager, team) VALUES
  ('YOUR-RECRUITER-UUID', 'Alex Thompson', 'Product Manager', 'alex.t@email.com', 'Senior PM', 'Datadog', 'Stanford', 'San Francisco, CA', 'LinkedIn', 'first_round', 'active', 'Maria Santos', 'Platform'),
  ('YOUR-RECRUITER-UUID', 'Jordan Lee', 'Product Manager', 'jordan.lee@email.com', 'PM Lead', 'Confluent', 'MIT', 'New York, NY', 'Referral', 'phone_screen', 'active', 'Maria Santos', 'Platform'),
  ('YOUR-RECRUITER-UUID', 'Priya Patel', 'Senior SWE', 'priya.p@email.com', 'Staff Engineer', 'Uber', 'Carnegie Mellon', 'Seattle, WA', 'LinkedIn', 'submittal', 'active', 'David Kim', 'Payments'),
  ('YOUR-RECRUITER-UUID', 'Marcus Chen', 'Senior SWE', 'marcus.c@email.com', 'Senior Engineer', 'Shopify', 'UC Berkeley', 'Remote', 'Gem', 'second_round', 'active', 'David Kim', 'Infrastructure'),
  ('YOUR-RECRUITER-UUID', 'Emily Davis', 'Design Lead', 'emily.d@email.com', 'Principal Designer', 'Airbnb', 'RISD', 'San Francisco, CA', 'LinkedIn', 'final_round', 'active', 'Lisa Park', 'Design'),
  ('YOUR-RECRUITER-UUID', 'Ryan Kim', 'Senior SWE', 'ryan.k@email.com', 'Tech Lead', 'Meta', 'Georgia Tech', 'Austin, TX', 'Indeed', 'offer', 'active', 'David Kim', 'Payments'),
  ('YOUR-RECRUITER-UUID', 'Sofia Martinez', 'Finance Analyst', 'sofia.m@email.com', 'Senior Analyst', 'Goldman Sachs', 'Wharton', 'New York, NY', 'Referral', 'accepted', 'hired', 'Tom Brown', 'Finance Ops'),
  ('YOUR-RECRUITER-UUID', 'Chris Park', 'Product Manager', 'chris.p@email.com', 'Director of Product', 'Twilio', 'Harvard', 'Boston, MA', 'LinkedIn', 'sourced', 'active', 'Maria Santos', 'Platform'),
  ('YOUR-RECRUITER-UUID', 'Taylor Swift', 'Full-Stack Engineer', 'taylor.s@email.com', 'Senior Engineer', 'Netflix', 'Stanford', 'Los Angeles, CA', 'LinkedIn', 'contacted', 'active', 'Ana Rodriguez', 'Workspace'),
  ('YOUR-RECRUITER-UUID', 'Aisha Johnson', 'Full-Stack Engineer', 'aisha.j@email.com', 'Staff Engineer', 'Spotify', 'MIT', 'Remote', 'Gem', 'phone_screen', 'active', 'Ana Rodriguez', 'Workspace');
*/


-- ===========================================
-- SAMPLE OUTBOUND ENTRIES
-- (Uncomment after creating users)
-- ===========================================
/*
INSERT INTO outbound_entries (recruiter_id, week_start, week_end, outbound_count, interested_count, emails_replied, source) VALUES
  ('YOUR-RECRUITER-UUID', '2026-02-02', '2026-02-08', 185, 22, 15, 'manual'),
  ('YOUR-RECRUITER-UUID', '2026-02-09', '2026-02-15', 210, 28, 18, 'manual'),
  ('YOUR-RECRUITER-UUID', '2026-02-16', '2026-02-22', 195, 25, 16, 'manual'),
  ('YOUR-RECRUITER-UUID', '2026-02-23', '2026-03-01', 220, 30, 20, 'manual'),
  ('YOUR-RECRUITER-UUID', '2026-03-02', '2026-03-08', 175, 20, 14, 'manual'),
  ('YOUR-RECRUITER-UUID', '2026-03-09', '2026-03-15', 160, 18, 12, 'manual');
*/


-- ===========================================
-- DEFAULT APP SETTINGS
-- ===========================================
-- (Already inserted by phase1-schema.sql, but safe to run again)
INSERT INTO app_settings (key, value) VALUES
  ('leaderboard_public', '"false"'::jsonb),
  ('outbound_tracking_start_date', '"2026-01-01"'::jsonb)
ON CONFLICT (key) DO NOTHING;
