import "server-only";
import { authClient } from "./supabase";
import { db, transaction } from "./db";
import { headers } from "next/headers";
import { isAdminHost } from "./routing";
import { redirect } from "next/navigation";
import { authConfigured } from "./config";
import { adminSecurity, adminGrant } from "./admin-security";
export class AccessDeniedError extends Error {
  constructor() {
    super("Administrator access required.");
  }
}
export async function currentUser() {
  if (!authConfigured()) return null;
  const {
    data: { user },
  } = await (await authClient()).auth.getUser();
  return user?.email_confirmed_at ? user : null;
}
export async function requireAdminIdentity() {
  const user = await currentUser();
  if (
    !user ||
    (await db.customer.findUnique({ where: { id: user.id } }))?.role !== "admin"
  )
    throw new AccessDeniedError();
  return user;
}
export async function requireAdmin() {
  const user = await requireAdminIdentity();
  const security = await adminSecurity();
  const grant = await adminGrant(user.id, security.version);
  if (!grant || (security.emailVerificationEnabled && !grant.emailVerified))
    throw new AccessDeniedError();
  return user;
}
export async function requireAdminPage() {
  try {
    return await requireAdmin();
  } catch (error) {
    if (error instanceof AccessDeniedError) redirect(await adminPath("/login"));
    throw error;
  }
}
export async function claimOrders() {
  const user = await currentUser();
  if (!user?.email) throw new Error("Verify your email to view orders.");
  const email = user.email.toLowerCase();
  return transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { id: user.id },
      create: { id: user.id, email },
      update: { email },
    });
    await tx.order.updateMany({
      where: { email, customerId: null },
      data: { customerId: customer.id },
    });
    return customer;
  });
}
export async function adminPath(path = "") {
  return `${isAdminHost((await headers()).get("host") ?? "") ? "" : "/admin"}${path || "/"}`;
}
