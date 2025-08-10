import { type NextRequest, NextResponse } from "next/server"
import { verifyInitData } from "@/lib/telegram"

export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json()
    if (typeof initData !== "string" || initData.length < 10) {
      return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 })
    }
    const verified = verifyInitData(initData)
    if (!verified) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ ok: true, user: verified.user, auth_date: verified.auth_date })
  } catch (e) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}
