import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE! // service role key
);

export async function POST(req: Request) {
  const body = await req.json();
  const { userId, email } = body;

  // Insert into coaches table
  const { error } = await supabaseAdmin
    .from("coaches")
    .insert([{ id: userId, email }]);

  if (error) {
    console.error("❌ Error registering coach:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
