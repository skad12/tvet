import { NextRequest, NextResponse } from "next/server";

type TypingEntry = {
  userId: string;
  userName: string;
  role: string;
  at: number;
};

const TYPING_TTL_MS = 4000;
const ticketTyping = new Map<string, Map<string, TypingEntry>>();

function pruneTicket(ticketId: string) {
  const bucket = ticketTyping.get(ticketId);
  if (!bucket) return;

  const now = Date.now();
  for (const [userId, entry] of bucket.entries()) {
    if (now - entry.at > TYPING_TTL_MS) {
      bucket.delete(userId);
    }
  }

  if (bucket.size === 0) {
    ticketTyping.delete(ticketId);
  }
}

export async function GET(request: NextRequest) {
  const ticketId = request.nextUrl.searchParams.get("ticketId");
  const excludeUserId = request.nextUrl.searchParams.get("excludeUserId") ?? "";

  if (!ticketId) {
    return NextResponse.json({ typing: [] }, { status: 400 });
  }

  pruneTicket(ticketId);
  const bucket = ticketTyping.get(ticketId);
  const typing = bucket
    ? Array.from(bucket.values()).filter(
        (entry) => String(entry.userId) !== String(excludeUserId)
      )
    : [];

  return NextResponse.json({ typing });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ticketId = String(body?.ticketId ?? "");
    const userId = String(body?.userId ?? "");
    const userName = String(body?.userName ?? "Someone");
    const role = String(body?.role ?? "user");
    const isTyping = Boolean(body?.isTyping);

    if (!ticketId || !userId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    if (!ticketTyping.has(ticketId)) {
      ticketTyping.set(ticketId, new Map());
    }

    const bucket = ticketTyping.get(ticketId)!;

    if (isTyping) {
      bucket.set(userId, {
        userId,
        userName,
        role,
        at: Date.now(),
      });
    } else {
      bucket.delete(userId);
      if (bucket.size === 0) {
        ticketTyping.delete(ticketId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
