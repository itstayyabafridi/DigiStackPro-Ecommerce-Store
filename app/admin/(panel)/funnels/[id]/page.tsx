import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage, adminPath } from "@/lib/auth";
import { db } from "@/lib/db";
import { uuid } from "@/lib/security";
import { editorSteps } from "@/lib/funnels";
import { FunnelEditor } from "@/components/funnel-editor";
export default async function Editor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  if (id !== "new" && !uuid.safeParse(id).success) notFound();
  const f =
    id === "new"
      ? null
      : await db.funnel.findUnique({
          where: { id },
          include: {
            steps: { where: { archived: false }, orderBy: { position: "asc" } },
          },
        });
  if (id !== "new" && !f) notFound();
  const products = await db.product.findMany({
    where: { archived: false },
    select: { id: true, title: true },
  });
  return (
    <>
      <div className="mb-8 flex justify-between gap-5">
        <h1 className="page-title">{f?.name ?? "New funnel"}</h1>
        {f && (
          <Link
            className="underline"
            href={await adminPath(`/funnels/${f.id}/preview`)}
          >
            Preview saved funnel
          </Link>
        )}
      </div>
      <FunnelEditor
        key={f?.revision ?? "new"}
        base={await adminPath("/funnels")}
        products={products}
        initial={
          f
            ? { ...f, steps: editorSteps(f.steps) }
            : { name: "", slug: "", steps: [], status: "draft" }
        }
      />
    </>
  );
}
