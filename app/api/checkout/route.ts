import Stripe from "stripe";
import { NextResponse } from "next/server";

export async function POST() {
  const secret = process.env.STRIPE_SECRET_KEY;
  const price = process.env.STRIPE_PREMIUM_PRICE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!secret || !price) {
    return NextResponse.json({ demo: true, message: "Stripe is not configured. Premium demo mode is enabled." });
  }

  const stripe = new Stripe(secret);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    success_url: `${appUrl}/?premium=success`,
    cancel_url: `${appUrl}/?premium=cancelled`,
    allow_promotion_codes: true
  });

  return NextResponse.json({ url: session.url });
}
