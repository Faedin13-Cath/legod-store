import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizarTelefono, validarResta, validarPiezas } from '@/lib/entregas'
import { perfilesPorTelefono } from '@/lib/entregas-perfiles'
import { CARRIERS_ENVIO } from '@/lib/shipping'

// Endpoint público: guarda lo que el cliente llenó en el formulario de entregas.
// Casi todas estas ventas se hicieron por WhatsApp, así que este envío es el
// ÚNICO registro de lo que hay que entregar y cobrar: nada se trunca ni se
// descarta en silencio; si algo no se puede guardar se responde error.

const BUCKET = 'entregas-fotos'
const MAX_FOTO = 10 * 1024 * 1024 // 10 MB
const MAX_CAMPO = 200

const bad = (error: string) => NextResponse.json({ error }, { status: 400 })
const fallo = () => NextResponse.json({ error: 'No se pudo guardar, intenta de nuevo' }, { status: 500 })

export async function POST(req: NextRequest) {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return bad('Formato inválido')
  }

  // Texto recortado; null si viene vacío.
  const texto = (k: string): string | null => {
    const v = String(form.get(k) ?? '').trim()
    return v || null
  }

  const telefono = normalizarTelefono(String(form.get('telefono') ?? ''))
  if (!telefono) return bad('Celular inválido')

  const nombre = texto('nombre')
  if (!nombre || nombre.length > MAX_CAMPO) return bad('Falta tu nombre')

  const tipo = String(form.get('tipo') ?? '')
  if (tipo !== 'envio' && tipo !== 'rock_show') return bad('Tipo de entrega inválido')

  const piezas = validarPiezas(String(form.get('piezas') ?? ''))
  if (!piezas) return bad('Escribe las piezas (máximo 5000 caracteres)')

  const resta = validarResta(String(form.get('resta') ?? ''))
  if (resta === null) return bad('Escribe cuánto te resta por pagar, solo el número (0 si nada)')

  const email = texto('email')
  if (email && (email.length > MAX_CAMPO || !/^[^\s@]+@[^\s@]+$/.test(email))) {
    return bad('Correo inválido')
  }

  const noSoyYo = ['true', '1', 'on'].includes(String(form.get('noSoyYo') ?? '').toLowerCase())

  // ── Envío: dirección completa (Rock Show no lleva dirección) ──
  let paqueteria: string | null = null
  let recibe: string | null = null
  let dir: {
    calle: string; numExt: string; numInt: string | null; colonia: string
    ciudad: string; estado: string; cp: string; referencia: string
  } | null = null
  if (tipo === 'envio') {
    paqueteria = texto('paqueteria')
    recibe = texto('recibe')
    const calle = texto('calle'), numExt = texto('numExt'), colonia = texto('colonia')
    const ciudad = texto('ciudad'), estado = texto('estado'), cp = texto('cp')
    const referencia = texto('referencia'), numInt = texto('numInt')
    // Solo las paqueterías reales: el export de Estafeta filtra por este texto, y una
    // variante mal escrita haría que la entrega nunca saliera en la lista. FedEx es
    // "a cotizar" en este formulario, aquí no se le asigna precio.
    if (paqueteria && !(CARRIERS_ENVIO as readonly string[]).includes(paqueteria)) {
      return bad('Paquetería inválida')
    }
    if (!paqueteria || !recibe || !calle || !numExt || !colonia || !ciudad || !estado || !cp || !referencia) {
      return bad('Faltan datos de la dirección')
    }
    if ([paqueteria, recibe, calle, numExt, numInt ?? '', colonia, ciudad, estado, cp, referencia]
      .some(v => v.length > MAX_CAMPO)) {
      return bad('Algún dato de la dirección es demasiado largo')
    }
    dir = { calle, numExt, numInt, colonia, ciudad, estado, cp, referencia }
  }

  const foto = form.get('foto')
  const archivo = foto instanceof File && foto.size > 0 ? foto : null
  if (archivo) {
    if (!archivo.type.startsWith('image/')) return bad('La foto debe ser una imagen')
    if (archivo.size > MAX_FOTO) return bad('La foto pesa más de 10 MB')
  }

  const supabase = createAdminClient()

  // ── Foto (opcional): mismo patrón que /api/sell ──
  let fotoUrl: string | null = null
  let fotoFallo = false
  if (archivo) {
    try {
      await supabase.storage.createBucket(BUCKET, { public: true })
    } catch { /* ya existe */ }
    const ext = (archivo.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const buf = Buffer.from(await archivo.arrayBuffer())
    const { error } = await supabase.storage.from(BUCKET).upload(path, buf, {
      contentType: archivo.type || 'image/jpeg', upsert: false,
    })
    if (error) {
      // La foto es opcional: no se pierde la entrega por ella, pero se avisa al formulario
      // con fotoFallo (Task 5 debe mostrárselo al cliente para que la mande por WhatsApp).
      fotoFallo = true
      console.error('[entregas] no se pudo subir la foto', error.message)
    } else {
      fotoUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
    }
  }

  // Columnas de dirección tal como las espera entrega_contactos.
  const columnasDir = dir && {
    calle: dir.calle, num_ext: dir.numExt, num_int: dir.numInt, colonia: dir.colonia,
    ciudad: dir.ciudad, estado: dir.estado, cp: dir.cp, referencia: dir.referencia,
  }

  // ── Contacto ──
  const buscarContacto = () =>
    supabase.from('entrega_contactos').select('id').eq('telefono', telefono).maybeSingle()

  const { data: existente, error: errBusca } = await buscarContacto()
  if (errBusca) {
    console.error('[entregas] buscar contacto', errBusca.message)
    return fallo()
  }

  let contactoId: string
  let status: 'nueva' | 'conflicto' = 'nueva'

  if (existente && noSoyYo) {
    // "No soy yo": lo más probable es un dígito mal escrito, no otra persona.
    // El contacto guardado NO se toca (esta rama no escribe en entrega_contactos);
    // la entrega queda en 'conflicto' para que el dueño la resuelva a mano.
    contactoId = existente.id
    status = 'conflicto'
  } else if (existente) {
    // Se actualiza con lo nuevo, pero solo lo que vino: un correo vacío o un
    // Rock Show (sin dirección) no deben borrar lo que ya estaba guardado.
    const cambios: Record<string, unknown> = { nombre, ...(columnasDir ?? {}) }
    if (email) cambios.email = email
    const { error } = await supabase.from('entrega_contactos').update(cambios).eq('id', existente.id)
    if (error) {
      console.error('[entregas] actualizar contacto', error.message)
      return fallo()
    }
    contactoId = existente.id
  } else {
    // Contacto nuevo; si el celular es de una cuenta LEGOD se enlaza.
    // Con dos cuentas con el mismo número no se sabe de cuál es: no se enlaza ninguna.
    const perfiles = await perfilesPorTelefono(supabase, telefono, '[entregas]')
    const userId = perfiles && perfiles.length === 1 ? perfiles[0] : null
    const { data, error } = await supabase
      .from('entrega_contactos')
      .insert({ telefono, nombre, email, user_id: userId, ...(columnasDir ?? {}) })
      .select('id')
      .single()
    if (error?.code === '23505') {
      // Otro envío del mismo celular se coló entre la búsqueda y el insert: se usa ese contacto.
      const otra = await buscarContacto()
      if (!otra.data) {
        console.error('[entregas] carrera de contacto', otra.error?.message)
        return fallo()
      }
      contactoId = otra.data.id
      if (noSoyYo) status = 'conflicto' // la bandera no se pierde en la carrera
    } else if (error || !data) {
      console.error('[entregas] crear contacto', error?.message)
      return fallo()
    } else {
      contactoId = data.id
    }
  }

  // ── Entrega ──
  // La dirección se copia aquí como estaba: si el cliente se muda, las entregas
  // viejas siguen diciendo a dónde fueron. Es solo dirección (null en Rock Show).
  // En conflicto, nombre y correo enviados van en sus propias columnas porque el
  // contacto no se actualizó y se perderían.
  const direccion = dir
  const enConflicto = status === 'conflicto'

  const { error: errEntrega } = await supabase.from('entregas').insert({
    contacto_id: contactoId,
    tipo, paqueteria, recibe, direccion, piezas, foto: fotoUrl, resta, status,
    nombre_enviado: enConflicto ? nombre : null,
    email_enviado: enConflicto ? email : null,
  })
  if (errEntrega) {
    console.error('[entregas] guardar entrega', errEntrega.message)
    return fallo()
  }

  return NextResponse.json(fotoFallo ? { ok: true, fotoFallo: true } : { ok: true })
}
