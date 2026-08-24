import LegalPage, { H2 } from '@/components/legal/LegalPage'

export const metadata = { title: 'Aviso de Privacidad — Jango\'s Store' }

export default function AvisoPrivacidadPage() {
  return (
    <LegalPage title="Aviso de Privacidad" updated="agosto 2026">
      <p>En cumplimiento de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), Jango&apos;s Store (&ldquo;nosotros&rdquo;) pone a tu disposición el presente Aviso de Privacidad.</p>

      <H2>1. Responsable</H2>
      <p>Jango&apos;s Store, con domicilio en la Ciudad de México, es responsable del tratamiento de tus datos personales. Puedes contactarnos por WhatsApp o correo desde nuestra página de <a href="/contacto" style={{ color: 'var(--accent)', fontWeight: 600 }}>Contacto</a>.</p>

      <H2>2. Datos que recabamos</H2>
      <p>Para procesar tus compras, apartados y envíos recabamos: nombre, teléfono/WhatsApp, correo electrónico y dirección de envío. Para pagos, los datos financieros son procesados directamente por las plataformas de pago (MercadoPago, PayPal, Shopify); <strong>nosotros no almacenamos números de tarjeta</strong>.</p>

      <H2>3. Finalidades</H2>
      <p>Usamos tus datos para: procesar y entregar tus pedidos; gestionar apartados, saldo y puntos; contactarte sobre tu compra o cotización; y, si lo autorizas, enviarte avisos de novedades, restocks y promociones.</p>

      <H2>4. Transferencias</H2>
      <p>Compartimos tus datos únicamente con proveedores necesarios para operar: plataformas de pago y paqueterías (Estafeta, Correos de México, DHL, Mercado Libre). No vendemos ni rentamos tus datos a terceros.</p>

      <H2>5. Derechos ARCO</H2>
      <p>Tienes derecho a Acceder, Rectificar, Cancelar tus datos u Oponerte a su tratamiento, así como a revocar tu consentimiento. Para ejercerlos, escríbenos desde la página de <a href="/contacto" style={{ color: 'var(--accent)', fontWeight: 600 }}>Contacto</a> indicando tu solicitud.</p>

      <H2>6. Cambios al aviso</H2>
      <p>Podemos actualizar este Aviso de Privacidad. La versión vigente estará siempre disponible en esta página.</p>
    </LegalPage>
  )
}
