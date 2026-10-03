import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { routeHost } from "@/lib/routing";
import { authConfigured } from "@/lib/config";
export async function proxy(request: NextRequest) {
  const route = routeHost(
    request.headers.get("host") ?? "",
    request.nextUrl.pathname,
  );
  if (route.kind === "blocked")
    return new NextResponse("Not found", { status: 404 });
  const headers = new Headers(request.headers);
  headers.set("x-admin-host", route.kind === "admin" ? "1" : "0");
  let response =
    route.kind === "admin"
      ? NextResponse.rewrite(
          new URL(route.path + request.nextUrl.search, request.url),
          { request: { headers } },
        )
      : NextResponse.next({ request: { headers } });
  if (authConfigured()) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        },
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (values) => {
            values.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            headers.set("cookie", request.cookies.toString());
            response =
              route.kind === "admin"
                ? NextResponse.rewrite(
                    new URL(route.path + request.nextUrl.search, request.url),
                    { request: { headers } },
                  )
                : NextResponse.next({ request: { headers } });
            values.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, {
                ...options,
                domain: undefined,
              }),
            );
          },
        },
      },
    );
    await supabase.auth.getUser();
  }
  if (route.kind === "admin" || route.path.startsWith("/admin"))
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
export const config = {
  matcher: ["/((?!api(?:/|$)|_next(?:/|$)|.*\\.[^/]+$).*)"],
};
