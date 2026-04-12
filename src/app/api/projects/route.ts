import { NextResponse } from "next/server";

type ProjectRequestBody = {
  projectId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProjectRequestBody;
    const projectId = body?.projectId || `PRJ-${Date.now()}`;

    return NextResponse.json({ projectId }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Invalid request body" },
      { status: 400 },
    );
  }
}
