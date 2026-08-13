import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')?.trim().toLowerCase()
  if (!id) return NextResponse.json({ name: null }, { status: 400 })

  try {
    const res = await fetch(
      `https://www.bricklink.com/v2/catalog/catalogitem.page?M=${id}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(6000),
      }
    )

    if (!res.ok) return NextResponse.json({ name: null })

    const html = await res.text()

    // Try <h1 id="item-name-title">Name</h1>
    const h1 = html.match(/id="item-name-title"[^>]*>\s*([^<]+?)\s*</)
    if (h1?.[1]) return NextResponse.json({ name: h1[1].trim() })

    // Fallback: parse <title> — "BrickLink - Minifig sh0367 : Black Panther [Super Heroes] - …"
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/)?.[1] ?? ''
    const fromTitle = title.match(/:\s*(.+?)(?:\s*\[|\s*[-–]\s*BrickLink)/)?.[1]
    if (fromTitle) return NextResponse.json({ name: fromTitle.trim() })

    return NextResponse.json({ name: null })
  } catch {
    return NextResponse.json({ name: null })
  }
}
