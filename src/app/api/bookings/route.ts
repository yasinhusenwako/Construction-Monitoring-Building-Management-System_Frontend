import { NextResponse } from "next/server";

type BookingRequestBody = {
  bookingId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BookingRequestBody;
    const bookingId = body?.bookingId || `BKG-${Date.now()}`;

    return NextResponse.json({ bookingId }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Invalid request body" },
      { status: 400 },
    );
  }
}
