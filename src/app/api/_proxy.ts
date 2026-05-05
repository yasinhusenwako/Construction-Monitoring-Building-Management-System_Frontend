import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_BASE_URL = (
  process.env.BACKEND_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8080"  // Backend runs on port 8080
).replace(/\/+$/, "");

export const dynamic = "force-dynamic";

function buildTargetUrl(request: NextRequest): string {
  return `${BACKEND_API_BASE_URL}${request.nextUrl.pathname}${request.nextUrl.search}`;
}

function cloneRequestHeaders(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  return headers;
}

function cloneResponseHeaders(response: Response): Headers {
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("connection");
  headers.delete("transfer-encoding");
  return headers;
}

export async function proxyBackendRequest(
  request: NextRequest,
): Promise<NextResponse> {
  const method = request.method.toUpperCase();
  const targetUrl = buildTargetUrl(request);
  
  try {
    const body =
      method === "GET" || method === "HEAD"
        ? undefined
        : await request.arrayBuffer();

    console.log(`[Proxy] ${method} ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method,
      headers: cloneRequestHeaders(request),
      body,
      redirect: "manual",
      cache: "no-store",
    });

    const responseBody =
      method === "HEAD" ? null : await response.arrayBuffer();

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: cloneResponseHeaders(response),
    });
  } catch (error: any) {
    console.error(`[Proxy Error] ${method} ${targetUrl}:`, error.message);
    
    return NextResponse.json(
      { 
        message: "Backend service is currently unavailable. Please ensure the backend server is running.",
        error: error.message 
      },
      { status: 503 }
    );
  }
}
