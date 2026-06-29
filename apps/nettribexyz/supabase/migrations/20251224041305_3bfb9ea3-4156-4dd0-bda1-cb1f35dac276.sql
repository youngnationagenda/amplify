-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN 'EOT-BURN-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || SUBSTRING(gen_random_uuid()::text, 1, 8);
END;
$$;