/**
 * Lógica compartida para exportar entregas desde /admin y /bolsas. Aquí vive
 * solo lo que no depende del estado de cada pantalla: cada página decide qué
 * lista exporta (siempre la que se ve filtrada) y dónde muestra los avisos.
 */

export type EntregaExportable = {
  id: string; created_at: string; tipo: string; paqueteria: string | null
  recibe: string | null; piezas: string; resta: number; status: string
  nombre_enviado: string | null; email_enviado: string | null
  direccion: {
    calle?: string; numExt?: string; numInt?: string | null; colonia?: string
    ciudad?: string; estado?: string; cp?: string; referencia?: string
  } | null
  contacto: { nombre: string; telefono: string } | null
}

export function direccionTexto(d: EntregaExportable['direccion']): string {
  if (!d) return ''
  const calle = [d.calle, d.numExt && `#${d.numExt}`, d.numInt && `int. ${d.numInt}`].filter(Boolean).join(' ')
  const resto = [d.colonia, d.ciudad, d.estado, d.cp && `CP ${d.cp}`].filter(Boolean).join(', ')
  return [calle, resto, d.referencia && `Ref: ${d.referencia}`].filter(Boolean).join(', ')
}

// Una celda para pegar en hoja de cálculo: sin saltos de línea ni tabuladores,
// porque las piezas vienen en varias líneas y romperían la fila al pegar.
export function celda(v: unknown): string {
  const t = String(v ?? '').replace(/\s*[\r\n]+\s*/g, ' · ').replace(/\t/g, ' ').trim()
  // Texto que viene del formulario público: una celda que empieza con = + - @ se
  // evalúa como fórmula al pegarla en Excel/Sheets. El apóstrofo la deja como texto.
  const seguro = /^[=+\-@]/.test(t) ? `'${t}` : t
  // Las comillas dobles pueden romper el análisis de la fila al pegar: se igualan a sencillas.
  return seguro.replace(/"/g, "'")
}

// Minúsculas y sin acentos, para que "jose" encuentre "José".
export function sinAcentos(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function fechaEntrega(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/** El texto tabulado (con encabezado) de las entregas dadas, listo para pegar en una hoja. */
export function textoEntregas(entregas: EntregaExportable[]): string {
  const filas = [
    ['Fecha', 'Cliente', 'Celular', 'Tipo', 'Piezas', 'Resta', 'Paquetería', 'Recibe', 'Dirección', 'Estado', 'Nombre enviado', 'Correo enviado'],
    ...entregas.map(e => [
      fechaEntrega(e.created_at),
      e.contacto?.nombre,
      e.contacto?.telefono,
      e.tipo === 'envio' ? 'Envío' : 'Rock Show',
      e.piezas,
      e.resta,
      e.paqueteria,
      e.recibe,
      direccionTexto(e.direccion),
      e.status === 'conflicto' ? 'Conflicto' : e.status === 'atendida' ? 'Atendida' : 'Nueva',
      e.nombre_enviado,
      e.email_enviado,
    ]),
  ]
  return filas.map(f => f.map(celda).join('\t')).join('\n')
}

/**
 * Copia al portapapeles. Si no se puede (permiso negado o página sin https)
 * devuelve el texto en `textoManual` para que la pantalla lo deje a la vista.
 */
export async function copiarEntregas(entregas: EntregaExportable[]): Promise<{ aviso: string; textoManual: string }> {
  const texto = textoEntregas(entregas)
  try {
    await navigator.clipboard.writeText(texto)
    return {
      aviso: `Copiadas ${entregas.length} ${entregas.length === 1 ? 'entrega' : 'entregas'}. Pégalas en tu hoja de cálculo.`,
      textoManual: '',
    }
  } catch {
    return { aviso: 'No se pudo copiar automáticamente. Selecciona el texto de abajo y cópialo a mano.', textoManual: texto }
  }
}

/** Baja el CSV de Estafeta de las entregas dadas. Devuelve un aviso solo si algo falló. */
export async function bajarExcelEstafeta(entregas: EntregaExportable[]): Promise<{ aviso: string }> {
  try {
    const ids = entregas.map(e => e.id).join(',')
    const res = await fetch(`/api/admin/estafeta?scope=all&entregas=${encodeURIComponent(ids)}`)
    if (!res.ok) return { aviso: 'No se pudo generar el archivo de Estafeta.' }
    const url = URL.createObjectURL(await res.blob())
    const a = document.createElement('a')
    a.href = url
    a.download = `estafeta_entregas_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
    return { aviso: '' }
  } catch {
    return { aviso: 'No se pudo conectar.' }
  }
}
