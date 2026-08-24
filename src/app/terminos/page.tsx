import LegalPage, { H2 } from '@/components/legal/LegalPage'

export const metadata = { title: 'Términos y Condiciones — Jango\'s Store' }

export default function TerminosPage() {
  return (
    <LegalPage title="Términos y Condiciones" updated="agosto 2026">
      <p>Al comprar o apartar productos en Jango&apos;s Store aceptas los siguientes términos. Somos una tienda de minifiguras y sets LEGO® originales con sede en la Ciudad de México.</p>

      <H2>1. Productos</H2>
      <p>Todos nuestros productos son <strong>LEGO® 100% original</strong>. No vendemos copias ni clones (Lepin, Lele, etc.). El estado de cada figura (nuevo, perfecto, con crack leve) se indica en su ficha; las fotos son reales de la pieza.</p>

      <H2>2. Precios y disponibilidad</H2>
      <p>Cada artículo tiene su precio publicado en MXN. La mayoría de las piezas son únicas (stock 1), por lo que la disponibilidad es por orden de compra: se le da prioridad a quien realiza el pago o el apartado primero. Los artículos nuevos se publican primero para nuestra comunidad.</p>

      <H2>3. Apartados</H2>
      <p>Puedes apartar una pieza con un anticipo del <strong>40%</strong> del costo. Los clientes nuevos cuentan con <strong>2 días hábiles</strong> para realizar el depósito del apartado; de lo contrario la pieza se libera.</p>
      <p>El plazo para liquidar depende del monto total. <strong>Los anticipos no son reembolsables</strong>, salvo que el problema sea de nuestra parte (por ejemplo, que la figura llegue dañada o no esté en óptimas condiciones al momento de verificarla).</p>
      <p>Después de la <strong>segunda semana</strong> de incumplimiento en una liquidación, el monto ya no podrá transferirse a otro pedido.</p>

      <H2>4. Pagos a plazos</H2>
      <p>En ciertas piezas, sets o lotes aceptamos pagos a plazos. Consúltanos por la pieza que te interese para saber si aplica.</p>

      <H2>5. Métodos de pago</H2>
      <p>Aceptamos pago con tarjeta (MercadoPago / Shopify), transferencia y efectivo en entregas personales. También puedes usar tu saldo y puntos acumulados dentro de la tienda.</p>

      <H2>6. Entregas y envíos</H2>
      <p>Realizamos entregas personales en la Ciudad de México (punto medio a convenir, o los sábados en el Rock Show). Hacemos envíos a toda la República Mexicana y al extranjero (previa cotización y con cargo al cliente) a través de Estafeta, Correos de México, DHL y Mercado Libre (sujeto a publicación).</p>

      <H2>7. Programa de lealtad</H2>
      <p>Los puntos y el saldo acumulados no tienen valor en efectivo, no son transferibles y solo pueden usarse como descuento dentro de Jango&apos;s Store. Nos reservamos el derecho de ajustar las tasas y recompensas del programa.</p>

      <H2>8. Contacto</H2>
      <p>Para cualquier duda escríbenos por WhatsApp o a nuestro correo desde la página de <a href="/contacto" style={{ color: 'var(--accent)', fontWeight: 600 }}>Contacto</a>.</p>
    </LegalPage>
  )
}
