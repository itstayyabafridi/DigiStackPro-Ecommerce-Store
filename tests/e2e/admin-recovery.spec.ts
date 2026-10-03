import { test, expect } from "@playwright/test";

test("forgot password keeps the current origin and admin reset destination", async ({
  page,
}) => {
  let requestBody: Record<string, unknown> | undefined;
  let redirect: string | null = null;
  await page.route("**/auth/v1/recover?*", async (route) => {
    requestBody = route.request().postDataJSON();
    redirect = new URL(route.request().url()).searchParams.get("redirect_to");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    });
  });
  await page.goto("http://admin.localhost:3000/login");
  await page.getByRole("link", { name: "Forgot Password?" }).click();
  await page.getByLabel("Admin email").fill("owner@example.com");
  await page.getByRole("button", { name: "Send recovery link" }).click();
  await expect(page.getByRole("status")).toContainText(
    "password recovery link has been sent",
  );
  expect(requestBody?.email).toBe("owner@example.com");
  expect(redirect).toBe("http://admin.localhost:3000/reset-password");
});

test("missing or expired links cannot update passwords", async ({ page }) => {
  for (const suffix of ["", "#error=access_denied&error_code=otp_expired"]) {
    await page.goto("/admin/reset-password" + suffix);
    await expect(page.locator("form").getByRole("alert")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Update Password" }),
    ).toBeDisabled();
    await expect(
      page.getByRole("link", { name: "Request a new recovery link" }),
    ).toBeVisible();
  }
});

test("recovery updates only its isolated session and returns to admin login", async ({
  page,
  context,
}) => {
  const origin = "http://admin.localhost:3000";
  const user = {
    id: "11111111-1111-4111-8111-111111111111",
    email: "owner@example.com",
    aud: "authenticated",
    role: "authenticated",
    email_confirmed_at: "2026-01-01",
    created_at: "2026-01-01",
    app_metadata: {},
    user_metadata: {},
  };
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const access = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 })}.test-signature`;
  let updated = false;
  let signedOut = false;
  await context.addCookies([
    {
      name: "store-test-session",
      value: "preserved",
      domain: "admin.localhost",
      path: "/",
    },
  ]);
  await page.route("**/auth/v1/user", async (route) => {
    if (route.request().method() === "PUT") {
      expect(route.request().postDataJSON()).toMatchObject({
        password: "A-new-test-password-123!",
      });
      updated = true;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(user),
    });
  });
  await page.route("**/api/admin-recovery", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ authorized: true }),
    }),
  );
  await page.route("**/auth/v1/logout?*", async (route) => {
    signedOut = true;
    await route.fulfill({ status: 204 });
  });
  await page.goto(
    `${origin}/reset-password#type=recovery&access_token=${access}&refresh_token=test-refresh`,
  );
  await expect(
    page.getByRole("button", { name: "Update Password" }),
  ).toBeEnabled();
  expect(page.url()).toBe(`${origin}/reset-password`);
  await page
    .getByLabel("New Password", { exact: true })
    .fill("A-new-test-password-123!");
  await page.getByLabel("Confirm New Password").fill("different-password");
  await page.getByRole("button", { name: "Update Password" }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText(
    "Passwords do not match.",
  );
  expect(updated).toBe(false);
  await page
    .getByLabel("Confirm New Password")
    .fill("A-new-test-password-123!");
  await page.getByRole("button", { name: "Update Password" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Password updated successfully",
  );
  await expect(page).toHaveURL(`${origin}/login`);
  expect(updated && signedOut).toBe(true);
  expect(
    (await context.cookies()).some(
      (c) => c.name === "store-test-session" && c.value === "preserved",
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).some((k) => k.includes("admin-recovery")),
    ),
  ).toBe(false);
});
