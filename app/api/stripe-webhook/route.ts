import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_email!;
    const { data: pending } = await supabase
      .from("pending_coaches")
      .select("*")
      .eq("email", email)
      .single();

    if (pending) {
      const { data: user } = await supabase.auth.admin.createUser({
        email: pending.email,
        password: pending.password,
        email_confirm: true,
      });

      await supabase.from("coaches").insert([
        {
          id: user.user?.id,
          email: pending.email,
          display_name: pending.display_name,
          organization_name: pending.organization_name,
          website: pending.website,
          facebook: pending.facebook,
          instagram: pending.instagram,
          twitter: pending.twitter,
          role: "coach",
          stripe_subscription_status: "active",
        },
      ]);
      await supabase.from("pending_coaches").delete().eq("email", email);
    }
  }

  return NextResponse.json({ received: true });
}
