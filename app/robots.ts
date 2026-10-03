import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isAdminHost } from "@/lib/routing";
import { siteUrl } from "@/lib/site";
export default async function robots(): Promise<MetadataRoute.Robots> {
  return isAdminHost((await headers()).get("host") ?? "")
    ? { rules: { userAgent: "*", disallow: "/" } }
    : {
        rules: {
          userAgent: "*",
          allow: "/",
          disallow: ["/admin", "/api", "/account", "/cart", "/checkout"],
        },
        sitemap: `${await siteUrl()}/sitemap.xml`,
      };
}
