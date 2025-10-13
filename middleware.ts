import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function middleware(req) {
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

  const token = req.cookies.get("sb-access-token")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const { data: coach } = await supabase
    .from("coaches")
    .select("is_free, stripe_subscription_status")
    .eq("id", user.id)
    .single();

  if (!coach) return NextResponse.redirect(new URL("/signup", req.url));

  const paid = coach.stripe_subscription_status === "active";
  const free = coach.is_free === true;

  if (!paid && !free)
    return NextResponse.redirect(new URL("/billing", req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
