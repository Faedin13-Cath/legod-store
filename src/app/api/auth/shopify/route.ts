import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const shop = req.nextUrl.searchParams.get('shop')

  if (!code || !shop) {
    return NextResponse.json({ error: 'Missing code or shop' }, { status: 400 })
  }

  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id:     process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      code,
    }),
  })

  const data = await res.json()

  // Show the token in a simple HTML page so you can copy it
  const token = data.access_token ?? 'ERROR: ' + JSON.stringify(data)
  const html = `<!DOCTYPE html><html><body style="font-family:monospace;padding:40px">
    <h2>Shopify Admin Access Token</h2>
    <p>Copia este token y pégalo en Vercel como <strong>SHOPIFY_ADMIN_ACCESS_TOKEN</strong>:</p>
    <textarea rows="3" style="width:100%;font-size:14px" onclick="this.select()">${token}</textarea>
  </body></html>`

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
}
