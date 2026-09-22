import LegalPage, { H2, H3 } from '@/components/legal/LegalPage'
import { seo } from '@/lib/seo'

export const metadata = seo({
  titulo: 'Envíos y Devoluciones',
  descripcion: 'Paqueterías, costos y tiempos de envío a todo México, y cómo funcionan las devoluciones en Jango\'s Store.',
  ruta: '/envios-devoluciones',
})

export default function EnviosPage() {
  return (
    <LegalPage title="Envíos y Devoluciones" updated="septiembre 2026">
      <H2>Entregas personales</H2>
      <p>Somos de la Ciudad de México. Hacemos entregas personales en un punto medio a convenir, o los sábados en el Rock Show. Sin costo.</p>

      <H2>Envíos nacionales e internacionales</H2>
      <p>Enviamos a toda la República Mexicana y al extranjero. El costo del envío corre por cuenta del cliente y se cotiza según destino y paquetería. Enviamos por:</p>
      <ul style={lista}>
        <li>Estafeta</li>
        <li>Correos de México</li>
        <li>DHL</li>
        <li>Mercado Libre (sujeto a publicación)</li>
      </ul>
      <p>Todas las piezas se empacan protegidas (burbuja + caja rígida) para llegar en óptimas condiciones.</p>

      <H2>Tiempos</H2>
      <p>Preparamos tu pedido una vez confirmado el pago. El tiempo de entrega depende de la paquetería y el destino; te compartimos el número de guía para dar seguimiento.</p>

      <H2 id="devoluciones">Política de devoluciones</H2>
      <p>Revisamos cada pieza antes de enviarla. Aun así, si algo no te convence, así funcionan las devoluciones:</p>
      <ul style={lista}>
        <li><strong>Cambiaste de opinión:</strong> tienes 5 días hábiles desde que recibes tu pedido.</li>
        <li><strong>Llegó dañada o distinta a lo descrito:</strong> avísanos en 48 horas y nosotros cubrimos el envío de regreso.</li>
        <li><strong>Reembolso:</strong> por el mismo medio con el que pagaste, o al momento como saldo en tu cuenta.</li>
      </ul>

      <H3>Si cambiaste de opinión</H3>
      <p>Puedes devolver tu pedido dentro de los <strong>5 días hábiles</strong> siguientes a recibirlo, sin tener que darnos una razón. Para aceptarlo, la pieza tiene que regresar como te la enviamos:</p>
      <ul style={lista}>
        <li>En el mismo estado en que la recibiste, con todas sus piezas y accesorios.</li>
        <li>Los sets sellados, sin abrir.</li>
        <li>Bien protegida para el envío, de preferencia en su empaque original.</li>
      </ul>
      <p>El envío de regreso corre por tu cuenta y te reembolsamos el precio de la pieza; el costo del envío original no se reembolsa. Si la recibiste en persona, la devolución también se hace en persona.</p>

      <H3>Si llegó dañada o no es lo que describimos</H3>
      <p>Escríbenos dentro de las <strong>48 horas</strong> siguientes a recibirla, con fotos o video de la pieza y del empaque. Te recomendamos grabar al abrir el paquete: es la forma más rápida de resolverlo.</p>
      <p>En estos casos nosotros cubrimos el envío de regreso y tú eliges entre <strong>reembolso completo</strong>, incluido el envío, o <strong>reemplazo</strong> si tenemos otra pieza igual.</p>

      <H3>Lo que no aplica para devolución</H3>
      <ul style={lista}>
        <li>En figuras marcadas <strong>«Con detalle»</strong>, el detalle que ya estaba descrito en la publicación (por ejemplo, un brazo cambiado o pintura gastada).</li>
        <li>El desgaste normal de una figura <strong>usada</strong>, cuando así se indicó.</li>
        <li>Sets sellados que ya se abrieron, salvo que vengan incompletos o dañados de fábrica.</li>
        <li>Daños o piezas perdidas después de recibir el pedido.</li>
        <li>Tarjetas de regalo y saldo de la tienda, que no se cambian por efectivo.</li>
      </ul>

      <H3>Apartados y preventas</H3>
      <p>Los <strong>anticipos de apartado no son reembolsables</strong>, salvo que el problema sea de nuestra parte. Después de la segunda semana de incumplimiento en una liquidación, el monto ya no podrá transferirse a otro pedido.</p>
      <p>Si una figura en <strong>preventa</strong> no llega o no podemos entregarla, te devolvemos el <strong>100%</strong> de lo que pagaste. Si tú decides cancelarla, lo que hayas pagado se trata igual que el anticipo de un apartado.</p>

      <H3>Cómo pedir una devolución</H3>
      <ol style={pasos}>
        <li>Escríbenos desde <a href="/contacto" style={enlace}>Contacto</a> con tu número de pedido y el motivo (y las fotos, si llegó dañada).</li>
        <li>Te confirmamos la devolución y, si hace falta, a dónde mandar la pieza.</li>
        <li>Revisamos la pieza en cuanto la recibimos.</li>
        <li>Te hacemos el reembolso.</li>
      </ol>

      <H3>Reembolsos</H3>
      <p>Una vez revisada la pieza, te devolvemos el dinero por el mismo medio con el que pagaste. Según tu banco o la plataforma de pago, puede tardar hasta <strong>10 días hábiles</strong> en verse reflejado. Si lo prefieres, te lo abonamos al momento como <strong>saldo en tu cuenta</strong> de Jango&apos;s Store para tu siguiente compra.</p>

      <H2>Contacto</H2>
      <p>Para cualquier tema de envío o devolución, escríbenos desde la página de <a href="/contacto" style={{ color: 'var(--accent)', fontWeight: 600 }}>Contacto</a>.</p>
    </LegalPage>
  )
}

// El reset de Tailwind quita viñetas y números; aquí sí se necesitan.
const lista: React.CSSProperties = { margin: '8px 0', paddingLeft: 20, listStyle: 'disc' }
const pasos: React.CSSProperties = { margin: '8px 0', paddingLeft: 20, listStyle: 'decimal' }
const enlace: React.CSSProperties = { color: 'var(--accent)', fontWeight: 600 }
