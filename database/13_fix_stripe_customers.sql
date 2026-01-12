-- Migration: Fix stripe_customers records
-- This migration creates stripe_customers entries for users who have stripe_customer_id
-- in profiles but no corresponding entry in stripe_customers table

-- Insert missing stripe_customers records from profiles
INSERT INTO stripe_customers (user_id, stripe_customer_id, currency)
SELECT id, stripe_customer_id, 'eur'
FROM profiles
WHERE stripe_customer_id IS NOT NULL
AND stripe_customer_id NOT IN (SELECT stripe_customer_id FROM stripe_customers)
ON CONFLICT (stripe_customer_id) DO NOTHING;

-- Also handle user_id conflicts
INSERT INTO stripe_customers (user_id, stripe_customer_id, currency)
SELECT id, stripe_customer_id, 'eur'
FROM profiles
WHERE stripe_customer_id IS NOT NULL
AND id NOT IN (SELECT user_id FROM stripe_customers)
ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = EXCLUDED.stripe_customer_id;
