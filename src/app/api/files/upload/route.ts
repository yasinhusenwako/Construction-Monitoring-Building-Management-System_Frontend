import type { NextRequest } from "next/server";

import { dynamic, proxyBackendRequest } from "../../_proxy";

export { dynamic };

async function handle(request: NextRequest) {
  return proxyBackendRequest(request);
}

export const POST = handle;
export const OPTIONS = handle;
