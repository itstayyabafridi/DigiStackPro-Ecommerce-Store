import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { uuid } from "@/lib/security";
import { FunnelStepView } from "@/components/funnel-step";
export default async function Preview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const parsed = uuid.safeParse((await params).id);
  if (!parsed.success) notFound();
  const f = await db.funnel.findUnique({
    where: { id: parsed.data },
    include: {
      steps: {
        where: { archived: false },
        orderBy: { position: "asc" },
        include: {
          product: { select: { title: true, price: true, thumbnailUrl: true } },
        },
      },
    },
  });
  if (!f) notFound();
  return (
    <>
      <h1 className="page-title mb-3">Preview: {f.name}</h1>
      <p className="mb-8 text-slate-500">
        Saved steps in order. Preview does not create orders or analytics
        events.
      </p>
      <div className="space-y-10">
        {f.steps.map((s) => (
          <section
            key={s.id}
            className="max-w-2xl rounded-xl border bg-white p-8"
          >
            <p className="mb-5 text-sm text-slate-500">
              Step {s.position + 1} · {s.type.replaceAll("_", " ")}
            </p>
            <FunnelStepView
              type={s.type}
              config={s.config as Record<string, unknown>}
              slug={f.slug}
              stepId={s.id}
              product={s.product}
              methods={[]}
              preview
            />
          </section>
        ))}
      </div>
    </>
  );
}
