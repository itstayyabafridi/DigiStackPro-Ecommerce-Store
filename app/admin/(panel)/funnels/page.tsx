import Link from "next/link";
import { requireAdminPage, adminPath } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FunnelToggle } from "@/components/funnel-editor";
export default async function Funnels() {
  await requireAdminPage();
  const funnels = await db.funnel.findMany({
    include: {
      steps: {
        orderBy: { position: "asc" },
        include: { events: { select: { type: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const base = await adminPath("/funnels");
  return (
    <>
      <div className="mb-8 flex justify-between gap-4">
        <h1 className="page-title">Funnels</h1>
        <Button asChild>
          <Link href={`${base}/new`}>Create funnel</Link>
        </Button>
      </div>
      <div className="space-y-6">
        {funnels.map((f) => (
          <Card className="block px-6" key={f.id}>
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <Link
                  href={`${base}/${f.id}`}
                  className="text-xl font-semibold underline"
                >
                  {f.name}
                </Link>
                <p className="mt-2 text-sm text-slate-500">
                  /f/{f.slug} · {f.status}
                </p>
              </div>
              <FunnelToggle id={f.id} status={f.status} />
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    {["Step", "Views", "Accepts", "Declines", "Purchases"].map(
                      (t) => (
                        <th key={t} className="p-2 font-semibold">
                          {t}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {f.steps.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="p-2">
                        {String(
                          (s.config as { heading?: string }).heading ?? s.type,
                        )}
                        {s.archived && (
                          <span className="ml-2 text-xs text-slate-500">
                            Archived
                          </span>
                        )}
                      </td>
                      {["view", "accept", "decline", "purchase"].map((t) => (
                        <td className="p-2" key={t}>
                          {s.events.filter((e) => e.type === t).length}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
        {!funnels.length && (
          <p>
            Create a funnel to guide customers through a curated collection.
          </p>
        )}
      </div>
    </>
  );
}
