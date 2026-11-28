import { NextRequest, NextResponse } from "next/server";

async function proxyHandler(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const params = await context.params;
    const pathArray = params?.path || [];
    const pathString = pathArray.join("/");
    const searchParams = req.nextUrl.search;
    const backendUrl =
      process.env.BACKEND_URL || "https://api.hestiiarestaurant.com";
    const targetUrl = `${backendUrl}/api/${pathString}${searchParams}`;

    const headers = new Headers();
    const contentType = req.headers.get("content-type");
    const authorization = req.headers.get("authorization");
    if (contentType) headers.set("content-type", contentType);
    if (authorization) headers.set("authorization", authorization);

    let body = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = req.body;
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
      // @ts-ignore
      duplex: "half",
    });

    const data = await response.arrayBuffer();
    const responseHeaders = new Headers(response.headers);

    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("API Proxy Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error in Proxy" },
      { status: 500 },
    );
  }
}

export {
  proxyHandler as GET,
  proxyHandler as POST,
  proxyHandler as PUT,
  proxyHandler as PATCH,
  proxyHandler as DELETE,
};
