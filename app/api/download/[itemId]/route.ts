import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { signedFile } from "@/lib/files";
import { uuid } from "@/lib/security";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const user = await currentUser();
  const id = uuid.safeParse((await params).itemId);
  if (!user || !id.success)
    return new NextResponse("Not found", { status: 404 });
  const item = await db.orderItem.findFirst({
    where: { id: id.data, order: { customerId: user.id, status: "approved" } },
  });
  if (!item) return new NextResponse("Not found", { status: 404 });
  return NextResponse.redirect(await signedFile(item.filePath), {
    headers: {
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
