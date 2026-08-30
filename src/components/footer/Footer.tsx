import Link from 'next/link'
import Image from 'next/image'
import Icon from '@/components/ui/Icon'

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--paper)',
      borderTop: '1px solid var(--line)',
      color: 'var(--ink-2)',
      marginTop: 80,
    }}>
      <style>{`
        .footer-grid {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 48px;
          padding: 56px 32px 40px;
          border-bottom: 1px solid var(--line);
        }
        .footer-bottom {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 32px;
          font-size: 12px;
          color: var(--ink-3);
          flex-wrap: wrap;
          gap: 8px;
        }
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 32px 24px;
            padding: 40px 20px 32px;
          }
          .footer-brand {
            grid-column: 1 / -1;
          }
          .footer-bottom {
            padding: 16px 20px;
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
      `}</style>

      <div className="footer-grid">
        {/* Brand */}
        <div className="footer-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Image src="/assets/logo/legod-logo-violet.png" alt="LEGOD" width={40} height={40} style={{ borderRadius: '50%' }} />
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>Jango&apos;s Store</div>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--ink-2)', maxWidth: 320, margin: '0 0 16px' }}>
            Minifiguras LEGO, sets sellados, segunda mano y customs. Apartados, gift cards y envíos a todo México e internacionales a cotizar.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="https://chat.whatsapp.com/LklBq0iXRJvIFUiM8eUULH?mode=gi_t" target="_blank" rel="noreferrer" style={socialBtn} aria-label="Grupo de WhatsApp" title="Grupo de WhatsApp"><Icon name="chat" size={15} /></a>
            <a href="https://wa.me/525574777350" target="_blank" rel="noreferrer" style={socialBtn} aria-label="WhatsApp" title="WhatsApp"><Icon name="whatsapp" size={15} /></a>
          </div>
        </div>

        {/* Tienda */}
        <div>
          <h5 style={colHead}>Tienda</h5>
          <ul style={ulStyle}>
            <li><Link href="/tienda" style={linkStyle}>Todas las minifiguras</Link></li>
            <li><Link href="/tienda?tipo=set-sealed" style={linkStyle}>Sets sellados</Link></li>
            <li><Link href="/tienda?tipo=set-used" style={linkStyle}>Sets usados</Link></li>
            <li><Link href="/preventas" style={linkStyle}>Preventas</Link></li>
            <li><Link href="/gift-cards" style={linkStyle}>Gift cards</Link></li>
            <li><Link href="/promos" style={linkStyle}>Promos</Link></li>
          </ul>
        </div>

        {/* Cuenta */}
        <div>
          <h5 style={colHead}>Cuenta</h5>
          <ul style={ulStyle}>
            <li><Link href="/login" style={linkStyle}>Mi perfil</Link></li>
            <li><Link href="/coleccion" style={linkStyle}>Mi colección</Link></li>
            <li><Link href="/wishlist" style={linkStyle}>Wishlist</Link></li>
            <li><Link href="/apartados" style={linkStyle}>Apartados</Link></li>
            <li><Link href="/vendenos" style={linkStyle}>Véndenos tu colección</Link></li>
          </ul>
        </div>

        {/* Ayuda */}
        <div>
          <h5 style={colHead}>Ayuda</h5>
          <ul style={ulStyle}>
            <li><Link href="/faq" style={linkStyle}>Preguntas frecuentes</Link></li>
            <li><Link href="/contacto" style={linkStyle}>Contacto</Link></li>
            <li><Link href="/faq#estado" style={linkStyle}>Estado de figuras</Link></li>
            <li><Link href="/envios-devoluciones" style={linkStyle}>Envíos y devoluciones</Link></li>
            <li><Link href="/terminos" style={linkStyle}>Términos y condiciones</Link></li>
            <li><Link href="/aviso-privacidad" style={linkStyle}>Aviso de privacidad</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div>© 2026 Jango&apos;s Store · CDMX, México</div>
        <div>LEGO® es marca registrada de The LEGO Group. No afiliado.</div>
      </div>
    </footer>
  )
}

const colHead: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: 'var(--ink-3)',
  margin: '0 0 14px',
}
const ulStyle: React.CSSProperties = {
  listStyle: 'none', padding: 0, margin: 0,
  display: 'flex', flexDirection: 'column', gap: 10,
}
const linkStyle: React.CSSProperties = {
  fontSize: 14, fontWeight: 400, color: 'var(--ink-2)', textDecoration: 'none',
}
const socialBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 8,
  background: 'var(--paper)', border: '1px solid var(--line)',
  color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  textDecoration: 'none',
}
