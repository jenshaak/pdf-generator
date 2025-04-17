import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Try to parse the JSON body
    const body = await request.json();

    // Return a success response including the parsed body
    return NextResponse.json({
      message: "API Test endpoint reached successfully!",
      receivedData: body,
    }, { status: 200 });

  } catch (error) {
    // Handle cases where the body is not valid JSON or other errors occur
    console.error('Error in /api/test:', error);
    return NextResponse.json({
      message: "API Test endpoint reached, but failed to parse request body.",
      error: error.message,
    }, { status: 400 }); // Bad Request status if JSON parsing fails
  }
}


// Optional: Add a simple GET handler for basic browser testing
export async function GET(request) {
  return NextResponse.json({
    message: "API Test endpoint is alive (GET request)!",
  }, { status: 200 });
}
