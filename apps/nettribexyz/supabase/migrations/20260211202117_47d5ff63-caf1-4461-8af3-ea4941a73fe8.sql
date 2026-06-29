
-- Drop the conflicting new trigger since handle_new_user already handles role insertion
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_role();

-- Update handle_new_user to respect the role from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _full_name TEXT;
  _role app_role;
  _requested_role TEXT;
BEGIN
  -- Validate and sanitize full_name
  _full_name := TRIM(NEW.raw_user_meta_data ->> 'full_name');
  
  IF _full_name IS NULL OR LENGTH(_full_name) < 2 THEN
    _full_name := 'User';
  END IF;
  
  IF LENGTH(_full_name) > 100 THEN
    _full_name := LEFT(_full_name, 100);
  END IF;
  
  -- Read requested role from metadata, validate against allowed signup roles
  _requested_role := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data ->> 'role', 'rider')));
  
  IF _requested_role IN ('rider', 'investor', 'offsetter') THEN
    _role := _requested_role::app_role;
  ELSE
    _role := 'rider';
  END IF;
  
  -- Insert profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, _full_name);
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  
  -- Create rider entry only for riders
  IF _role = 'rider' THEN
    INSERT INTO public.riders (user_id)
    VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$function$;
