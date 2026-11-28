import { NextRequest, NextResponse } from 'next/server';

async function proxyHandler(
  req: NextRequest,
  // In Next.js 15, params is a Promise
  context: { params: Promise<{ path: string[] }> } 
) {
  try {
    // 1. You MUST await params first
    const params = await context.params;
    
    // 2. Safely extract the path array (fallback to empty array if undefined)
    const pathArray = params?.path || [];
    const pathString = pathArray.join('/');
    
    const searchParams = req.nextUrl.search;
    const backendUrl = process.env.BACKEND_URL || 'https://api.hestiiarestaurant.com';
    
    // Construct the target URL (e.g., https://api.hestiiarestaurant.com/api/auth/login)
    const targetUrl = `${backendUrl}/api/${pathString}${searchParams}`;

    // 3. Set up headers
    const headers = new Headers();
    const contentType = req.headers.get('content-type');
    const authorization = req.headers.get('authorization');
    if (contentType) headers.set('content-type', contentType);
    if (authorization) headers.set('authorization', authorization);

    // 4. Pass the body stream
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = req.body;
    }

    // 5. Fetch from the production backend
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
      // @ts-ignore (Required for Node.js stream body)
      duplex: 'half' 
    });

    const data = await response.arrayBuffer();
    const responseHeaders = new Headers(response.headers);

    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('API Proxy Error:', error); 
    return NextResponse.json(
      { message: 'Internal Server Error in Proxy' },
      { status: 500 }
    );
  }
}

export { 
  proxyHandler as GET, 
  proxyHandler as POST, 
  proxyHandler as PUT, 
  proxyHandler as PATCH, 
  proxyHandler as DELETE 
};