import type { NextRequest } from "next/server";

import { dynamic, proxyBackendRequest } from "../_proxy";

export { dynamic };

async function handle(request: NextRequest) {
  return proxyBackendRequest(request);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
export const OPTIONS = handle;
