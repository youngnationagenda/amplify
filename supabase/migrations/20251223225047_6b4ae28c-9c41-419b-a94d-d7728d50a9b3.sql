-- Fix 1: Add DELETE policy for profiles (prevent all deletions - soft delete pattern recommended)
CREATE POLICY "Prevent profile deletion"
  ON public.profiles FOR DELETE
  USING (false);

-- Fix 2: Update handle_new_user() with input validation and force default 'rider' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _full_name TEXT;
  _role app_role;
BEGIN
  -- Validate and sanitize full_name
  _full_name := TRIM(NEW.raw_user_meta_data ->> 'full_name');
  
  IF _full_name IS NULL OR LENGTH(_full_name) < 2 THEN
    _full_name := 'User';
  END IF;
  
  IF LENGTH(_full_name) > 100 THEN
    _full_name := LEFT(_full_name, 100);
  END IF;
  
  -- SECURITY: Always default to 'rider' role, ignore client-supplied role
  -- Investor/admin roles must be granted by admin approval
  _role := 'rider';
  
  -- Insert profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, _full_name);
  
  -- Insert role (always 'rider' for new users)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  
  -- Create rider entry for all new users
  INSERT INTO public.riders (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;