import type { Metadata } from 'next'

const MARCA = "Jango's Store"

/** Metadatos de una página indexable: título, descripción, canonical y cómo
 *  se ve al compartirla. El `openGraph` de una página reemplaza completo al del
 *  layout, por eso se arma entero aquí y no se deja a medias. */
export function seo({ titulo, descripcion, ruta, imagen, absoluto = false }: {
  titulo: string
  descripcion: string
  /** Ruta que Google debe tomar como la buena, p. ej. "/tienda". */
  ruta: string
  imagen?: { url: string; alt: string }
  /** El título ya trae la marca y no pasa por la plantilla "%s | Jango's Store". */
  absoluto?: boolean
}): Metadata {
  const completo = absoluto ? titulo : `${titulo} | ${MARCA}`
  return {
    // Siempre completo: la plantilla del layout raíz deja de aplicarse en
    // cuanto un layout intermedio (como /tienda) define su propio título.
    title: { absolute: completo },
    description: descripcion,
    alternates: { canonical: ruta },
    openGraph: {
      title: completo,
      description: descripcion,
      url: ruta,
      siteName: MARCA,
      locale: 'es_MX',
      type: 'website',
      ...(imagen ? { images: [imagen] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: completo,
      description: descripcion,
      ...(imagen ? { images: [imagen.url] } : {}),
    },
  }
}
