"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  stepTypes,
  configSchemas,
  defaultConfig,
  type EditorStep,
  type StepType,
} from "@/lib/funnel-schema";
function SortableStep({
  step,
  selected,
  onSelect,
}: {
  step: EditorStep;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: step.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-lg border p-3 ${selected ? "border-primary bg-blue-50" : "bg-white"}`}
    >
      <button
        type="button"
        aria-label={`Reorder ${step.type}`}
        className="touch-none p-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </button>
      <button
        className="flex-1 text-left text-sm"
        type="button"
        onClick={onSelect}
      >
        {String(step.config.heading || step.type)}
        <span className="block text-xs text-slate-500">
          {step.type.replaceAll("_", " ")}
        </span>
      </button>
    </div>
  );
}
export function FunnelEditor({
  initial,
  products,
  base,
}: {
  initial: {
    id?: string;
    name: string;
    slug: string;
    steps: EditorStep[];
    status: string;
  };
  products: { id: string; title: string }[];
  base: string;
}) {
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [steps, setSteps] = useState(initial.steps);
  const [selected, setSelected] = useState(initial.steps[0]?.id ?? "");
  const [type, setType] = useState<StepType>("landing");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const step = steps.find((s) => s.id === selected);
  const update = (data: Partial<EditorStep>) =>
    setSteps((values) =>
      values.map((s) => (s.id === selected ? { ...s, ...data } : s)),
    );
  if (initial.status === "published")
    return (
      <div className="space-y-5">
        <p>
          Unpublish this funnel to edit its steps. Unfinished sessions will need
          to restart.
        </p>
        <FunnelToggle id={initial.id!} status="published" />
      </div>
    );
  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        try {
          const res = await fetch("/api/admin/funnels", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "save",
              data: { id: initial.id, name, slug, steps },
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          setMessage("Saved.");
          router.push(`${base}/${data.id}`);
          router.refresh();
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "Could not save.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="field">
          Name
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="field">
          URL slug
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </label>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="space-y-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={({ active, over }) => {
              if (over && active.id !== over.id)
                setSteps((items) =>
                  arrayMove(
                    items,
                    items.findIndex((s) => s.id === active.id),
                    items.findIndex((s) => s.id === over.id),
                  ),
                );
            }}
          >
            <SortableContext
              items={steps.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {steps.map((s) => (
                <SortableStep
                  key={s.id}
                  step={s}
                  selected={s.id === selected}
                  onSelect={() => setSelected(s.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
          <div className="flex gap-2">
            <select
              aria-label="New step type"
              className="select"
              value={type}
              onChange={(e) => setType(e.target.value as StepType)}
            >
              {stepTypes.map((t) => (
                <option key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const id = crypto.randomUUID();
                setSteps((s) => [
                  ...s,
                  {
                    id,
                    type,
                    config: defaultConfig(type),
                    productId: null,
                    nextOnAccept: null,
                    nextOnDecline: null,
                  },
                ]);
                setSelected(id);
              }}
            >
              Add step
            </Button>
          </div>
        </div>
        <div className="space-y-5 rounded-xl border bg-white p-6">
          {step ? (
            <>
              <h2 className="section-title">Step settings</h2>
              <label className="field">
                Step type
                <select
                  className="select"
                  value={step.type}
                  onChange={(e) => {
                    const t = e.target.value as StepType;
                    update({
                      type: t,
                      config: defaultConfig(t),
                      nextOnAccept: null,
                      nextOnDecline: null,
                    });
                  }}
                >
                  {stepTypes.map((t) => (
                    <option key={t} value={t}>
                      {t.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              {Object.keys(configSchemas[step.type].shape).map((key) => (
                <label className="field" key={key}>
                  {
                    (
                      {
                        heading: "Heading",
                        body: "Body",
                        acceptLabel: "Accept button",
                        declineLabel: "Decline button",
                      } as Record<string, string>
                    )[key]
                  }
                  {key === "body" ? (
                    <Textarea
                      value={String(step.config[key] ?? "")}
                      onChange={(e) =>
                        update({
                          config: { ...step.config, [key]: e.target.value },
                        })
                      }
                    />
                  ) : (
                    <Input
                      value={String(step.config[key] ?? "")}
                      onChange={(e) =>
                        update({
                          config: { ...step.config, [key]: e.target.value },
                        })
                      }
                      required
                    />
                  )}
                </label>
              ))}
              <label className="field">
                Product
                <select
                  className="select"
                  value={step.productId ?? ""}
                  onChange={(e) =>
                    update({ productId: e.target.value || null })
                  }
                >
                  <option value="">No product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </label>
              {step.type !== "thank_you" &&
                (
                  [
                    "nextOnAccept",
                    ...(["upsell", "downsell", "order_bump"].includes(step.type)
                      ? ["nextOnDecline"]
                      : []),
                  ] as ("nextOnAccept" | "nextOnDecline")[]
                ).map((key) => (
                  <label key={key} className="field">
                    {key === "nextOnAccept" ? "On accept" : "On decline"}
                    <select
                      className="select"
                      value={step[key] ?? ""}
                      onChange={(e) =>
                        update({ [key]: e.target.value || null })
                      }
                    >
                      <option value="">
                        Next position (or payment at end)
                      </option>
                      {steps
                        .filter((s) => s.id !== step.id)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {String(s.config.heading)}
                          </option>
                        ))}
                    </select>
                  </label>
                ))}
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setSteps((s) =>
                    s
                      .filter((x) => x.id !== step.id)
                      .map((x) => ({
                        ...x,
                        nextOnAccept:
                          x.nextOnAccept === step.id ? null : x.nextOnAccept,
                        nextOnDecline:
                          x.nextOnDecline === step.id ? null : x.nextOnDecline,
                      })),
                  );
                  setSelected("");
                }}
              >
                Remove step
              </Button>
            </>
          ) : (
            <p>Select a step to configure its content and paths.</p>
          )}
        </div>
      </div>
      <Button disabled={busy}>{busy ? "Saving…" : "Save funnel"}</Button>
      <p role="status">{message}</p>
    </form>
  );
}
export function FunnelToggle({ id, status }: { id: string; status: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <div>
      <Button
        variant="outline"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const r = await fetch("/api/admin/funnels", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: status === "published" ? "unpublish" : "publish",
                data: { id },
              }),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.error);
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Could not update.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {status === "published" ? "Unpublish" : "Publish"}
      </Button>
      <p role="status" className="mt-2 text-sm text-red-700">
        {error}
      </p>
    </div>
  );
}
