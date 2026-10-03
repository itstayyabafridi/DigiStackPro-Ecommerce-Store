import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
let pg: PGlite;
const owner = "10000000-0000-4000-8000-000000000001";
const other = "10000000-0000-4000-8000-000000000002";
const product = "20000000-0000-4000-8000-000000000001";
const order = "30000000-0000-4000-8000-000000000001";
beforeAll(async () => {
  pg = new PGlite();
  // Minimal Supabase-owned schemas: application migrations run unchanged.
  await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO authenticated;
    CREATE SCHEMA storage;
    CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    CREATE TABLE storage.objects(id text PRIMARY KEY,bucket_id text,name text);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    GRANT USAGE ON SCHEMA storage TO anon,authenticated;
    GRANT ALL ON storage.objects TO anon,authenticated;
    CREATE POLICY broad_policy ON storage.objects FOR ALL TO anon,authenticated USING (true) WITH CHECK (true);`);
  for (const path of [
    "prisma/migrations/202609300001_initial/migration.sql",
    "prisma/migrations/202609300002_security/migration.sql",
    "prisma/migrations/202609300003_funnel_history/migration.sql",
    "supabase/storage.sql",
  ])
    await pg.exec(readFileSync(path, "utf8"));
  await pg.exec(`INSERT INTO auth.users VALUES ('${owner}'),('${other}');
    INSERT INTO customers(id,email,name) VALUES ('${owner}','owner@example.com','Owner'),('${other}','other@example.com','Other');
    INSERT INTO products(id,title,slug,description,price,thumbnail_url,file_path) VALUES ('${product}','Original title','sample','Description',10000,'https://example.com/a.png','assets/original.zip');
    INSERT INTO orders(id,customer_id,name,email,whatsapp,subtotal,total,payment_method,checkout_token_hash,updated_at) VALUES ('${order}','${owner}','Owner','owner@example.com','+923001234567',10000,10000,'bank','secret-hash',now());
    INSERT INTO order_items(id,order_id,product_id,title,price,file_path) VALUES ('40000000-0000-4000-8000-000000000001','${order}','${product}','Original title',10000,'assets/original.zip');
    INSERT INTO storage.objects VALUES ('private-file','product-files','assets/original.zip'),('proof','payment-proofs','proof.png'),('public-image','store-images','image.png');`);
}, 30000);
afterAll(async () => {
  await pg?.close();
});
describe("actual PostgreSQL migrations and RLS", () => {
  it("retains the checkout attribution of an archived funnel step", async () => {
    const funnelId = "50000000-0000-4000-8000-000000000001";
    const stepId = "60000000-0000-4000-8000-000000000001";
    const sessionId = "70000000-0000-4000-8000-000000000001";
    await pg.exec(`INSERT INTO funnels(id,name,slug) VALUES ('${funnelId}','Test funnel','test-funnel');
      INSERT INTO funnel_steps(id,funnel_id,position,type,config) VALUES ('${stepId}','${funnelId}',0,'checkout','{}');
      INSERT INTO funnel_sessions(id,token_hash,funnel_id,revision,checkout_step_id,expires_at) VALUES ('${sessionId}','funnel-token','${funnelId}',1,'${stepId}',now()+interval '1 day');
      UPDATE funnel_steps SET archived=true WHERE id='${stepId}';
      INSERT INTO funnel_events(id,session_id,step_id,type) VALUES ('80000000-0000-4000-8000-000000000001','${sessionId}','${stepId}','purchase');`);
    const result = await pg.query<{ step_id: string }>(
      `SELECT step_id FROM funnel_events WHERE session_id='${sessionId}'`,
    );
    expect(result.rows[0].step_id).toBe(stepId);
    await expect(
      pg.exec(`DELETE FROM funnel_steps WHERE id='${stepId}'`),
    ).rejects.toThrow(/foreign key constraint/);
  });
  it("enables RLS on every application table", async () => {
    const result = await pg.query<{ relname: string }>(
      "SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity",
    );
    expect(result.rows).toEqual([]);
  });
  it("isolates customer records and denies role escalation", async () => {
    await pg.exec(
      `SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${other}',false)`,
    );
    try {
      expect((await pg.query("SELECT * FROM orders")).rows).toHaveLength(0);
      expect((await pg.query("SELECT * FROM order_items")).rows).toHaveLength(
        0,
      );
      expect((await pg.query("SELECT * FROM customers")).rows).toHaveLength(1);
      await expect(
        pg.exec("UPDATE customers SET role='admin'"),
      ).rejects.toThrow(/permission denied/);
      await pg.exec(
        `SELECT set_config('request.jwt.claim.sub','${owner}',false)`,
      );
      expect((await pg.query("SELECT * FROM orders")).rows).toHaveLength(1);
      expect((await pg.query("SELECT * FROM order_items")).rows).toHaveLength(
        1,
      );
    } finally {
      await pg.exec("RESET ROLE");
    }
  });
  it("blocks anonymous mutations and private storage despite broad permissive policies", async () => {
    await pg.exec("SET ROLE anon");
    try {
      await expect(pg.exec("UPDATE products SET price=1")).rejects.toThrow(
        /permission denied/,
      );
      const objects = await pg.query<{ id: string }>(
        "SELECT id FROM storage.objects",
      );
      expect(objects.rows.map((r) => r.id)).toEqual(["public-image"]);
      await expect(
        pg.exec(
          "INSERT INTO storage.objects VALUES ('attack','payment-proofs','attack.png')",
        ),
      ).rejects.toThrow(/row-level security/);
    } finally {
      await pg.exec("RESET ROLE");
    }
  });
  it("requires payment proof and prevents duplicate approval transitions", async () => {
    await expect(
      pg.exec(`UPDATE orders SET status='approved' WHERE id='${order}'`),
    ).rejects.toThrow(/orders_review_requires_proof/);
    await pg.exec(
      `UPDATE orders SET payment_screenshot_url='proof.png',payment_submitted_at=now() WHERE id='${order}'`,
    );
    const first = await pg.query(
      `UPDATE orders SET status='approved' WHERE id='${order}' AND status='pending' RETURNING id`,
    );
    const second = await pg.query(
      `UPDATE orders SET status='approved' WHERE id='${order}' AND status='pending' RETURNING id`,
    );
    expect(first.rows).toHaveLength(1);
    expect(second.rows).toHaveLength(0);
  });
  it("retains purchased snapshots and rejects duplicate product items", async () => {
    await pg.exec(
      `UPDATE products SET title='New title',price=20000,file_path='assets/new.zip' WHERE id='${product}'`,
    );
    const items = await pg.query<{
      title: string;
      price: number;
      file_path: string;
    }>("SELECT title,price,file_path FROM order_items");
    expect(items.rows[0]).toEqual({
      title: "Original title",
      price: 10000,
      file_path: "assets/original.zip",
    });
    await expect(
      pg.exec(
        `INSERT INTO order_items(id,order_id,product_id,title,price,file_path) VALUES ('40000000-0000-4000-8000-000000000002','${order}','${product}','Duplicate',10000,'assets/original.zip')`,
      ),
    ).rejects.toThrow(/unique constraint/);
  });
});
