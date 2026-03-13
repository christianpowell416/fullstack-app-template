-- Fix: The handle_new_user trigger needs to explicitly handle all required columns
-- The original function only inserted id and email, which worked with starter schema
-- but phase1 added NOT NULL columns. Even with defaults, let's be explicit.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, is_active, weekly_outbound_goal)
  VALUES (NEW.id, NEW.email, 'recruiter', true, 200);
  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  -- Profile already exists (e.g., manually created)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
