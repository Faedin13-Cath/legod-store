import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM ?? 'LEGOD Jango\'s Store <onboarding@resend.dev>'
const STORE = process.env.NEXT_PUBLIC_STORE_URL ?? 'https://legod-store-2.vercel.app'

export async function sendRestockEmail(to: string, name: string, product: {
  name: string; handle: string; price: number; imageUrl?: string
}) {
  const url = `${STORE}/tienda/${product.handle}`
  return resend.emails.send({
    from: FROM,
    to,
    subject: `¡${product.name} está de vuelta! 🔔`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
        <img src="${STORE}/assets/logo/legod-logo-violet.png" width="40" style="border-radius:50%;margin-bottom:16px" />
        <h2 style="margin:0 0 8px;color:#1a1a2e">¡Hola ${name}! 👋</h2>
        <p style="color:#555;margin:0 0 20px">
          Una figura de tu wishlist volvió a estar disponible:
        </p>
        <div style="background:#f5f3ef;border-radius:12px;padding:20px;margin-bottom:24px">
          ${product.imageUrl ? `<img src="${product.imageUrl}" width="80" style="border-radius:8px;margin-bottom:12px" />` : ''}
          <div style="font-size:18px;font-weight:700;color:#1a1a2e">${product.name}</div>
          <div style="font-size:22px;font-weight:800;color:#6B3FA0;margin-top:4px">
            $${product.price.toLocaleString('es-MX')} MXN
          </div>
        </div>
        <a href="${url}" style="display:inline-block;background:#6B3FA0;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">
          Ver figura →
        </a>
        <p style="margin-top:24px;font-size:12px;color:#aaa">
          Recibiste esto porque tienes alertas de restock activas en LEGOD Jango's Store.
          <a href="${STORE}/alertas" style="color:#6B3FA0">Gestionar alertas</a>
        </p>
      </div>
    `,
  })
}

export async function sendNewArrivalEmail(to: string, name: string, products: {
  name: string; handle: string; price: number
}[]) {
  const STORE_URL = STORE
  const items = products.map(p =>
    `<a href="${STORE_URL}/tienda/${p.handle}" style="display:block;padding:12px;background:#f5f3ef;border-radius:10px;text-decoration:none;margin-bottom:8px">
      <span style="font-weight:600;color:#1a1a2e">${p.name}</span>
      <span style="color:#6B3FA0;margin-left:8px;font-weight:700">$${p.price.toLocaleString('es-MX')} MXN</span>
    </a>`
  ).join('')

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Nuevas figuras en LEGOD 🧱`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
        <img src="${STORE}/assets/logo/legod-logo-violet.png" width="40" style="border-radius:50%;margin-bottom:16px" />
        <h2 style="margin:0 0 8px;color:#1a1a2e">¡Hola ${name}! Llegaron novedades 🎉</h2>
        <p style="color:#555;margin:0 0 20px">Estas figuras acaban de llegar a la tienda:</p>
        ${items}
        <a href="${STORE}/tienda" style="display:inline-block;margin-top:16px;background:#6B3FA0;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">
          Ver toda la tienda →
        </a>
        <p style="margin-top:24px;font-size:12px;color:#aaa">
          <a href="${STORE}/alertas" style="color:#6B3FA0">Gestionar alertas</a>
        </p>
      </div>
    `,
  })
}
