
-- Create or replace the trigger function to assign role from user metadata on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text;
BEGIN
  _role := NEW.raw_user_meta_data->>'role';
  
  -- Default to 'rider' if no role specified or invalid
  IF _role IS NULL OR _role NOT IN ('rider', 'investor', 'offsetter') THEN
    _role := 'rider';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();
