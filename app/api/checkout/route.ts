import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { checkoutSchema, checkoutOrder } from "@/lib/orders";
import {
  sameOrigin,
  requestLimit,
  cookieOptions,
  errorMessage,
} from "@/lib/security";
export async function POST(request: NextRequest) {
  try {
    await sameOrigin();
    await requestLimit("checkout", 15);
    const raw = await request.json();
    const input = checkoutSchema.parse(raw);
    const jar = await cookies();
    const secret = z.string().uuid().parse(raw.attemptId);
    const order = await checkoutOrder(input, secret);
    jar.set("checkout", secret, cookieOptions);
    return NextResponse.json({ url: `/checkout/${order.id}` });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
