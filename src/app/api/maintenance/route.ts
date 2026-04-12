import { NextResponse } from "next/server";

type MaintenanceRequestBody = {
  maintenanceId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MaintenanceRequestBody;
    const maintenanceId = body?.maintenanceId || `MNT-${Date.now()}`;

    return NextResponse.json({ maintenanceId }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Invalid request body" },
      { status: 400 },
    );
  }
}
