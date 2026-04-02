import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(request: NextRequest) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'File is too large (max 10MB)' },
      { status: 413 }
    )
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    let text: string

    if (ext === 'pdf') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>
      const result = await pdfParse(buffer)
      text = result.text
    } else if (ext === 'docx' || ext === 'doc') {
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    return NextResponse.json({ text })
  } catch {
    return NextResponse.json(
      { error: 'Could not extract text from this file' },
      { status: 422 }
    )
  }
}
