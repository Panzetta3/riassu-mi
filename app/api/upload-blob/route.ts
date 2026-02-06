import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const dynamic = 'force-dynamic'

// Vercel Hobby plan: 4.5MB request limit
// This endpoint uploads to Blob storage which supports larger files
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'File richiesto' },
        { status: 400 }
      )
    }

    // Upload to Vercel Blob with a unique name
    const blob = await put(file.name, file, {
      access: 'public',
      addRandomSuffix: true,
    })

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      downloadUrl: blob.downloadUrl,
    })
  } catch (error) {
    console.error('Blob upload error:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'upload del file' },
      { status: 500 }
    )
  }
}
