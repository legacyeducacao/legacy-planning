import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Parse the URL from the request body
    const body = await request.json()
    const { url } = body

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { error: "Invalid or missing Firebase Storage URL" },
        { status: 400 },
      )
    }

    if (parsedUrl.hostname !== "firebasestorage.googleapis.com") {
      return NextResponse.json(
        { error: "Invalid or missing Firebase Storage URL" },
        { status: 400 },
      )
    }

    console.log("Proxying request to Firebase Storage")

    // Fetch the content from Firebase Storage with a 10s timeout
    const response = await fetch(parsedUrl.toString(), {
      method: "GET",
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Firebase Storage error: ${response.status}`,
          message: await response.text(),
        },
        { status: response.status },
      )
    }

    // Get the file content as buffer
    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get("content-type")

    // Return the file content — no wildcard CORS; this is a same-origin route
    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType || "application/octet-stream",
      },
    })
  } catch (error: unknown) {
    console.error("Error proxying Firebase Storage request:", error)
    return NextResponse.json(
      { error: "Failed to proxy Firebase Storage request" },
      { status: 500 },
    )
  }
}
