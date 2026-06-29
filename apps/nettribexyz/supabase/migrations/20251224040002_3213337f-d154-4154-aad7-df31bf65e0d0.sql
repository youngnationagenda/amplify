-- Create carbon_credits table to track available credits
CREATE TABLE public.carbon_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric NOT NULL DEFAULT 0,
  price_per_credit numeric NOT NULL DEFAULT 25.00,
  source_type text NOT NULL DEFAULT 'ride',
  source_id uuid,
  status text NOT NULL DEFAULT 'available',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create carbon_purchases table for offsetter purchases
CREATE TABLE public.carbon_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  credit_id uuid REFERENCES public.carbon_credits(id),
  amount numeric NOT NULL,
  price_paid numeric NOT NULL,
  status text NOT NULL DEFAULT 'active',
  burned_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create initial_carbon_offerings table for future carbon credits
CREATE TABLE public.initial_carbon_offerings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  total_credits numeric NOT NULL,
  credits_sold numeric NOT NULL DEFAULT 0,
  price_per_credit numeric NOT NULL,
  market_price numeric NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  delivery_date timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create ico_purchases table for ICO participation
CREATE TABLE public.ico_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ico_id uuid REFERENCES public.initial_carbon_offerings(id) ON DELETE CASCADE,
  credits_purchased numeric NOT NULL,
  price_paid numeric NOT NULL,
  credits_delivered numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create burned_credits table for audit trail
CREATE TABLE public.burned_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  purchase_id uuid REFERENCES public.carbon_purchases(id),
  ico_purchase_id uuid REFERENCES public.ico_purchases(id),
  amount numeric NOT NULL,
  certificate_number text NOT NULL,
  burned_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.carbon_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carbon_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initial_carbon_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ico_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.burned_credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for carbon_credits (public read)
CREATE POLICY "Anyone can view available carbon credits"
ON public.carbon_credits FOR SELECT
USING (status = 'available');

-- RLS Policies for carbon_purchases
CREATE POLICY "Users can view their own purchases"
ON public.carbon_purchases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Offsetters can create purchases"
ON public.carbon_purchases FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'offsetter'));

CREATE POLICY "Offsetters can update their own purchases"
ON public.carbon_purchases FOR UPDATE
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'offsetter'));

-- RLS Policies for initial_carbon_offerings (public read)
CREATE POLICY "Anyone can view active ICOs"
ON public.initial_carbon_offerings FOR SELECT
USING (status IN ('upcoming', 'active'));

-- RLS Policies for ico_purchases
CREATE POLICY "Users can view their own ICO purchases"
ON public.ico_purchases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Offsetters can create ICO purchases"
ON public.ico_purchases FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'offsetter'));

-- RLS Policies for burned_credits
CREATE POLICY "Users can view their own burned credits"
ON public.burned_credits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Offsetters can create burn records"
ON public.burned_credits FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'offsetter'));

-- Add triggers for updated_at
CREATE TRIGGER update_carbon_credits_updated_at
BEFORE UPDATE ON public.carbon_credits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generate certificate number function
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'EOT-BURN-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || SUBSTRING(gen_random_uuid()::text, 1, 8);
END;
$$;

-- Insert sample ICO data
INSERT INTO public.initial_carbon_offerings (name, description, total_credits, price_per_credit, market_price, start_date, end_date, delivery_date, status)
VALUES 
  ('Q1 2025 Carbon Forward', 'Early access to Q1 2025 carbon credits at 30% discount', 10000, 17.50, 25.00, now(), now() + interval '30 days', now() + interval '90 days', 'active'),
  ('Green Fleet Initiative', 'Support fleet expansion and earn credits at 25% discount', 25000, 18.75, 25.00, now() + interval '15 days', now() + interval '45 days', now() + interval '120 days', 'upcoming');

-- Insert sample available carbon credits
INSERT INTO public.carbon_credits (amount, price_per_credit, source_type, status)
VALUES 
  (500, 25.00, 'ride', 'available'),
  (750, 25.00, 'ride', 'available'),
  (300, 25.00, 'ride', 'available');