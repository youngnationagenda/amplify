
-- Fix motorcycles RLS: replace public read, add write policies
DROP POLICY IF EXISTS "Anyone can view motorcycles" ON public.motorcycles;

CREATE POLICY "Authenticated users can view motorcycles"
  ON public.motorcycles FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can insert motorcycles"
  ON public.motorcycles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update motorcycles"
  ON public.motorcycles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Prevent motorcycle deletion"
  ON public.motorcycles FOR DELETE
  TO authenticated
  USING (false);

REVOKE SELECT ON public.motorcycles FROM anon;

-- Fix profiles UPDATE: add WITH CHECK to prevent ownership change
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Lock down SECURITY DEFINER functions from anon/authenticated execution
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_certificate_number() FROM PUBLIC, anon, authenticated;
-- has_role is referenced inside RLS policies; those run as definer of the policy, but the function
-- itself only needs to be callable by the postgres/service roles. Re-grant for RLS evaluation safety:
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_certificate_number() TO service_role;
