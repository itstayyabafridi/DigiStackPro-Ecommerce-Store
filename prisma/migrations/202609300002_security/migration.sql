-- Application tables are not a browser mutation API. All writes use authorized server services.
ALTER TABLE customers ADD CONSTRAINT customers_auth_user_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE products ADD CONSTRAINT products_price_positive CHECK (price > 0);
ALTER TABLE orders ADD CONSTRAINT orders_totals_valid CHECK (subtotal >= 0 AND discount >= 0 AND total = subtotal - discount AND total >= 0);
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_valid CHECK (payment_method IN ('easypaisa','jazzcash','bank'));
ALTER TABLE orders ADD CONSTRAINT orders_review_requires_proof CHECK (status = 'pending' OR (payment_submitted_at IS NOT NULL AND payment_screenshot_url IS NOT NULL));
ALTER TABLE order_items ADD CONSTRAINT order_items_price_positive CHECK (price > 0);
ALTER TABLE coupons ADD CONSTRAINT coupons_kind_valid CHECK (kind IN ('percent','fixed'));
ALTER TABLE coupons ADD CONSTRAINT coupons_values_valid CHECK (value > 0 AND minimum >= 0 AND (kind != 'percent' OR value <= 100) AND ("limit" IS NULL OR "limit" > 0));

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['customers','products','categories','orders','order_items','coupons','settings','rate_limits','funnels','funnel_steps','funnel_sessions','funnel_events'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;

-- Customers can read only their own account/orders, even through direct Supabase requests.
GRANT SELECT ON customers, orders, order_items TO authenticated;
CREATE POLICY customer_self_read ON customers FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY order_owner_read ON orders FOR SELECT TO authenticated USING (customer_id = auth.uid());
CREATE POLICY item_owner_read ON order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()));
-- No public table writes or browser admin permissions. Promotion uses trusted SQL only.

-- Defense in depth against direct auth metadata/role spoofing: role lives in customers,
-- never in raw_user_meta_data. The server uses getUser() and checks this role on each call.
