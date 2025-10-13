import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const { email, coach_id } = await req.json();

    if (!email || !coach_id) {
      return NextResponse.json(
        { error: "Missing fields (email, coach_id)" },
        { status: 400 }
      );
    }

    // ✅ Invite the user through Supabase Auth
    const { data, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email);

    if (inviteError) {
      console.error("❌ Auth Invite Error:", inviteError);
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    // ✅ Create athlete record in your table
    const insertPayload = {
      id: data?.user?.id || uuidv4(), // use Auth id if available
      email,
      coach_id,
      status: "invited",
      sessions_7d: 0,
      adherence_pct: 100,
      weekly_volume: 0,
      last_session: "Never",
      program_id: null,
      program_start_date: null,
      program_end_date: null,
    };

    console.log("📥 Insert athlete payload:", insertPayload);

    const { error: dbError } = await supabaseAdmin
      .from("athletes")
      .insert([insertPayload]);

    if (dbError) {
      console.error("❌ DB Error full:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ API crashed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
