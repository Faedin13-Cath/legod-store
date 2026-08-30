import { NextRequest, NextResponse } from 'next/server'

const ADMIN_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN!
const ADMIN_TOKEN  = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get('handle')
  if (!handle) return NextResponse.json({ stock: 0 })

  const res = await fetch(`https://${ADMIN_DOMAIN}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ADMIN_TOKEN,
    },
    body: JSON.stringify({
      query: `{ productByHandle(handle: "${handle}") { totalInventory } }`,
    }),
    cache: 'no-store',
  })

  const json = await res.json()
  const stock = json?.data?.productByHandle?.totalInventory ?? 1
  return NextResponse.json({ stock })
}
