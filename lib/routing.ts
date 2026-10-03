export function hostname(value: string) {
  return value.toLowerCase().split(":")[0].replace(/\.$/, "");
}
export function isAdminHost(host: string) {
  return (
    hostname(host).startsWith("admin.") ||
    (!!process.env.ADMIN_HOST &&
      hostname(host) === hostname(process.env.ADMIN_HOST))
  );
}
export function routeHost(
  host: string,
  path: string,
  root = process.env.ROOT_DOMAIN ?? "",
) {
  if (isAdminHost(host))
    return {
      kind: "admin" as const,
      path:
        path === "/admin" || path.startsWith("/admin/")
          ? path
          : `/admin${path === "/" ? "" : path}`,
    };
  if (
    hostname(host) === hostname(root) &&
    (path === "/admin" || path.startsWith("/admin/"))
  )
    return { kind: "blocked" as const, path };
  return { kind: "store" as const, path };
}
