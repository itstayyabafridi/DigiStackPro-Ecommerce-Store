import { catalog } from "@/lib/catalog";
import { StoreCatalog } from "@/components/store/catalog";
import { siteUrl } from "@/lib/site";
export async function generateMetadata() {
  return {
    title: "Browse digital resources",
    alternates: { canonical: `${await siteUrl()}/browse` },
  };
}
export default async function Browse({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = (await searchParams).q;
  return (
    <StoreCatalog
      key={typeof q === "string" ? q : ""}
      title="All resources"
      products={await catalog()}
      query={typeof q === "string" ? q.slice(0, 120) : ""}
    />
  );
}
