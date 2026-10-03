ALTER TABLE funnel_steps ADD COLUMN archived boolean NOT NULL DEFAULT false;
ALTER TABLE funnel_sessions ADD COLUMN checkout_step_id uuid;
ALTER TABLE funnel_sessions ADD CONSTRAINT funnel_sessions_checkout_step_id_fkey FOREIGN KEY (checkout_step_id) REFERENCES funnel_steps(id) ON DELETE RESTRICT ON UPDATE CASCADE;
