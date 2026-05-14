import type { NextRequest } from "next/server";

import { proxyBackendRequest } from "../_proxy";
export const dynamic = "force-dynamic";

async function handle(request: NextRequest) {
  return proxyBackendRequest(request);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
export const OPTIONS = handle;
