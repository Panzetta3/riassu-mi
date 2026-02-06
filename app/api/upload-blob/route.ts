import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'

export const dynamic = 'force-dynamic'

/**
 * Client upload endpoint - generates a token for client-side uploads
 * This allows files larger than 4.5MB to be uploaded directly from the browser to Blob
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        // You can add auth checks here if needed
        return {
          allowedContentTypes: ['application/pdf'],
          tokenPayload: JSON.stringify({}),
        }
      },
      onUploadCompleted: async () => {
        // Optional: do something after upload completes
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('Blob upload error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
}
