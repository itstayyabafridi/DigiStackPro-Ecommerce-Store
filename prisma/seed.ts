import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
const db = new PrismaClient();
async function main() {
  const category = await db.category.upsert({
    where: { slug: "starter-resources" },
    create: { name: "Starter resources", slug: "starter-resources" },
    update: {},
  });
  const samples = [
    {
      slug: "project-planner",
      title: "Project planner",
      price: 99000,
      description:
        "A simple project planning worksheet. Define the outcome, break down milestones, and keep track of the next action.",
      thumbnailUrl: "/samples/planner.svg",
      content:
        "# Project planner\n\nOutcome:\n\nMilestones:\n1.\n2.\n3.\n\nNext action:\n\nDeadline:\n",
    },
    {
      slug: "launch-checklist",
      title: "Launch checklist",
      price: 69000,
      description:
        "A practical checklist for your next digital launch: content, quality checks, payment testing, and launch-day follow-up.",
      thumbnailUrl: "/samples/launch.svg",
      content:
        "# Launch checklist\n\n[ ] Review content\n[ ] Check mobile layout\n[ ] Test payments\n[ ] Confirm delivery\n[ ] Verify contact details\n[ ] Publish\n",
    },
    {
      slug: "content-calendar",
      title: "Content calendar",
      price: 129000,
      description:
        "An editable CSV calendar to organize topics, formats, dates, and publishing status across your content.",
      thumbnailUrl: "/samples/calendar.svg",
      content:
        "Date,Topic,Format,Channel,Status\n2026-10-01,Introduce your project,Post,Website,Draft\n",
    },
  ];
  const upload = process.env.SEED_UPLOAD_FILES === "true";
  if (
    upload &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY)
  )
    throw new Error("Seed uploads need Supabase credentials.");
  const supabase = upload
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )
    : null;
  for (const [index, s] of samples.entries()) {
    const filePath = `assets/sample-${s.slug}.${s.slug === "content-calendar" ? "csv" : "txt"}`;
    if (supabase) {
      const { error } = await supabase.storage
        .from("product-files")
        .upload(filePath, Buffer.from(s.content), {
          contentType: "text/plain",
          upsert: true,
        });
      if (error) throw error;
    }
    await db.product.upsert({
      where: { slug: s.slug },
      create: {
        title: s.title,
        slug: s.slug,
        description: s.description,
        price: s.price,
        thumbnailUrl: s.thumbnailUrl,
        filePath,
        categoryId: category.id,
        isFeatured: index === 0,
        isPublished: upload,
      },
      update: {},
    });
  }
  await db.setting.upsert({
    where: { key: "site" },
    create: {
      key: "site",
      value: {
        siteName: "DigistackPro",
        heroTitle: "A head start, ready to download.",
        heroDescription:
          "Practical templates, creative assets, and useful tools for your next project. Pay locally. Get your files after payment approval.",
        primaryColor: "#2457e6",
        easypaisa: "",
        jazzcash: "",
        bank: "",
      },
    },
    update: {},
  });
  console.log(
    "Seed complete. Payment instructions are intentionally blank; configure real details in Admin → Settings. Sample products stay drafts unless files were uploaded.",
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
