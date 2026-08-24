import LegalPage, { H2 } from '@/components/legal/LegalPage'

export const metadata = { title: 'Envíos y Devoluciones — Jango\'s Store' }

export default function EnviosPage() {
  return (
    <LegalPage title="Envíos y Devoluciones" updated="agosto 2026">
      <H2>Entregas personales</H2>
      <p>Somos de la Ciudad de México. Hacemos entregas personales en un punto medio a convenir, o los sábados en el Rock Show. Sin costo.</p>

      <H2>Envíos nacionales e internacionales</H2>
      <p>Enviamos a toda la República Mexicana y al extranjero. El costo del envío corre por cuenta del cliente y se cotiza según destino y paquetería. Enviamos por:</p>
      <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
        <li>Estafeta</li>
        <li>Correos de México</li>
        <li>DHL</li>
        <li>Mercado Libre (sujeto a publicación)</li>
      </ul>
      <p>Todas las piezas se empacan protegidas (burbuja + caja rígida) para llegar en óptimas condiciones.</p>

      <H2>Tiempos</H2>
      <p>Preparamos tu pedido una vez confirmado el pago. El tiempo de entrega depende de la paquetería y el destino; te compartimos el número de guía para dar seguimiento.</p>

      <H2>Devoluciones y garantía</H2>
      <p>Verificamos cada pieza antes de enviarla. Si un producto llega dañado o no está en las condiciones descritas, contáctanos dentro de las <strong>48 horas</strong> siguientes a recibirlo, con fotos, y lo resolvemos (reembolso o reemplazo según disponibilidad).</p>
      <p>Los <strong>anticipos de apartado no son reembolsables</strong>, salvo que el problema sea de nuestra parte. Después de la segunda semana de incumplimiento en una liquidación, el monto ya no podrá transferirse a otro pedido.</p>

      <H2>Contacto</H2>
      <p>Para cualquier tema de envío o devolución, escríbenos desde la página de <a href="/contacto" style={{ color: 'var(--accent)', fontWeight: 600 }}>Contacto</a>.</p>
    </LegalPage>
  )
}
