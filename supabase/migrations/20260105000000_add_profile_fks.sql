-- Add explicit foreign key relationships from recruiter_id columns to profiles table
-- This allows PostgREST/Supabase to join these tables directly without going through auth.users

-- candidates.recruiter_id -> profiles.id
ALTER TABLE candidates
  ADD CONSTRAINT candidates_recruiter_profile_fkey
  FOREIGN KEY (recruiter_id) REFERENCES profiles(id);

-- project_assignments.recruiter_id -> profiles.id
ALTER TABLE project_assignments
  ADD CONSTRAINT project_assignments_recruiter_profile_fkey
  FOREIGN KEY (recruiter_id) REFERENCES profiles(id);

-- outbound_entries.recruiter_id -> profiles.id
ALTER TABLE outbound_entries
  ADD CONSTRAINT outbound_entries_recruiter_profile_fkey
  FOREIGN KEY (recruiter_id) REFERENCES profiles(id);
