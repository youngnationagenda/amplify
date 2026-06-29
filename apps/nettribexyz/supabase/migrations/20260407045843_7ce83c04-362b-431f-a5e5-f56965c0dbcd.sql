
-- Drop restrictive offsetter-only INSERT policies
DROP POLICY IF EXISTS "Offsetters can create purchases" ON public.carbon_purchases;
DROP POLICY IF EXISTS "Offsetters can create ICO purchases" ON public.ico_purchases;
DROP POLICY IF EXISTS "Offsetters can create burn records" ON public.burned_credits;
DROP POLICY IF EXISTS "Offsetters can update their own purchases" ON public.carbon_purchases;

-- Allow any authenticated user to create carbon purchases
CREATE POLICY "Authenticated users can create purchases"
ON public.carbon_purchases FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow any authenticated user to update their own purchases
CREATE POLICY "Authenticated users can update own purchases"
ON public.carbon_purchases FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Allow any authenticated user to create ICO purchases
CREATE POLICY "Authenticated users can create ICO purchases"
ON public.ico_purchases FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow any authenticated user to burn credits
CREATE POLICY "Authenticated users can burn credits"
ON public.burned_credits FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
