import type { NextRequest } from "next/server";

import { proxyBackendRequest } from "../../_proxy";
export const dynamic = "force-dynamic";

async function handle(request: NextRequest) {
  return proxyBackendRequest(request);
}

export const POST = handle;
export const OPTIONS = handle;
