# Formulario de entregas — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un formulario propio en jangos-store.com que reemplaza los dos Google Forms: el cliente escribe su celular, la página lo reconoce, y sus entregas caen en el panel de administración.

**Architecture:** Página pública nueva (`/entregas`) contra dos endpoints: uno que busca por celular y devuelve **solo datos enmascarados**, y otro que guarda la entrega. Dos tablas nuevas en Supabase (contacto reusable + entrega por evento) más una de intentos para el límite de consultas. El panel de administración gana una sección, y el exportador de Estafeta que ya existe aprende a leer también estas entregas.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase (`createAdminClient`, service_role), Supabase Storage para fotos. Vitest para la lógica pura de `src/lib`.

**Spec:** `docs/superpowers/specs/2026-10-19-formulario-entregas-design.md`

## Global Constraints

- Todo el texto de cara al cliente y los comentarios del código **en español**, como el resto del proyecto.
- **Sin dependencias nuevas de runtime.** El CSV se arma a mano, como ya lo hace `src/app/api/admin/estafeta/route.ts`. **Excepción, decisión del constructor:** se agrega `vitest` como devDependency y un script `"test": "vitest run"`, porque la normalización del teléfono es la llave de identidad y si se rompe el cliente recurrente deja de reconocerse en silencio. El proyecto hoy no tiene ningún test.
- Endpoints de administración: validan `isAdmin(user.id)` con el patrón exacto de `src/app/api/admin/sell-requests/route.ts`.
- Tablas nuevas: `enable row level security` **sin políticas públicas** — solo el backend con service_role. Molde: `supabase/migrations/sell_requests.sql`.
- Estilos en línea con las variables del sitio (`--cream`, `--paper`, `--line`, `--ink`, `--ink-2`, `--ink-3`, `--accent`) y las clases `input` / `btn btn-primary`. Molde: `src/app/login/page.tsx`.
- La dirección completa **nunca** sale del servidor hacia el navegador del cliente. Solo hacia el panel de administración.
- Precios de paquetería: Correos de México $75, Estafeta $160, FedEx **a cotizar**. No modificar `src/lib/shipping.ts`.
- `npm run build` debe pasar antes de dar por terminada cualquier tarea que toque `src/`.

## Review Focus

Entradas que la spec implica pero que ninguna tarea probaría por sí sola. Cada una tiene su test asignado abajo.

1. **El celular escrito de cualquier forma** (`+52 55 1234 5678`, `044 5512345678`, `55-1234-5678`) tiene que reconocer al mismo cliente. Si no, el recurrente vuelve a teclear todo y el proyecto falló en su único objetivo. → Task 1.
2. **El mismo celular manda una segunda entrega.** No debe duplicar el contacto ni perder la entrega nueva. → Task 4.
3. **Las piezas pegadas de WhatsApp con 25 renglones** tienen que llegar completas. Un límite que trunque en silencio pierde figuras que el dueño debe entregar. → Task 4.
4. **"Me falta pagar" con basura** (vacío, negativo, `"como $100"`). Debe rechazarse en el servidor, no guardarse como `NaN`. → Task 4.
5. **El límite de intentos detrás de Vercel.** `request.ip` no sirve; hay que leer `x-forwarded-for`. Mal leído, el límite cuenta a todo el mundo como una sola IP o como ninguna. → Task 3.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `supabase/migrations/entregas.sql` | Las tres tablas nuevas |
| `src/lib/entregas.ts` | Lógica pura: normalizar teléfono, enmascarar, tipos compartidos |
| `src/lib/entregas.test.ts` | Tests de lo anterior |
| `src/app/api/entregas/buscar/route.ts` | POST celular → contacto enmascarado o nada, con límite de intentos |
| `src/app/api/entregas/route.ts` | POST de la entrega (multipart, con foto opcional) |
| `src/app/entregas/page.tsx` | El formulario, tres pasos |
| `src/app/api/admin/entregas/route.ts` | GET lista para el panel, PATCH para marcar atendida |
| `src/app/(account)/admin/page.tsx` | Sección nueva "Formulario" |
| `src/app/api/admin/estafeta/route.ts` | Extender para incluir estas entregas |

---

### Task 1: Lógica de teléfono y enmascarado

**Files:**
- Create: `src/lib/entregas.ts`
- Create: `src/lib/entregas.test.ts`
- Modify: `package.json` (devDependency `vitest`, script `test`)

**Interfaces:**
- Produces:
  - `normalizarTelefono(raw: string): string | null` — 10 dígitos, o `null` si no son 10.
  - `enmascararCalle(calle: string, numExt: string): string`
  - `enmascararColonia(colonia: string): string`
  - `enmascararCP(cp: string): string`
  - `enmascararEmail(email: string): string`
  - `type ContactoEnmascarado = { nombre: string; calle: string; colonia: string; cp: string; email: string; tieneDireccion: boolean }`

- [ ] **Step 1: Instalar vitest y agregar el script**

```bash
npm install -D vitest
```
En `package.json`, `"scripts"`: `"test": "vitest run"`.

- [ ] **Step 2: Escribir los tests que fallan**

```ts
// src/lib/entregas.test.ts
describe('normalizarTelefono', () => {
  it('acepta las formas en que la gente escribe su celular', () => {
    expect(normalizarTelefono('5512345678')).toBe('5512345678')
    expect(normalizarTelefono('55 1234 5678')).toBe('5512345678')
    expect(normalizarTelefono('55-1234-5678')).toBe('5512345678')
    expect(normalizarTelefono('+52 55 1234 5678')).toBe('5512345678')
    expect(normalizarTelefono('5215512345678')).toBe('5512345678')   // 52 + 1 viejo
    expect(normalizarTelefono('044 5512345678')).toBe('5512345678')  // lada vieja
    expect(normalizarTelefono('(55) 1234 5678')).toBe('5512345678')
  })
  it('rechaza lo que no es un celular', () => {
    expect(normalizarTelefono('123')).toBeNull()
    expect(normalizarTelefono('')).toBeNull()
    expect(normalizarTelefono('no tengo')).toBeNull()
  })
})

describe('enmascarar', () => {
  it('deja reconocer sin dejar copiar', () => {
    expect(enmascararCalle('Morelos', '142')).toBe('Morelos 1••')
    expect(enmascararColonia('Centro')).toBe('C•••••')
    expect(enmascararCP('06010')).toBe('06••0')
    expect(enmascararEmail('santiago.r@gmail.com')).toBe('san•••@gmail.com')
  })
  it('no truena con datos faltantes', () => {
    expect(enmascararCalle('', '')).toBe('')
    expect(enmascararEmail('')).toBe('')
  })
})
```

- [ ] **Step 3: Correr los tests y verificar que fallan**

Run: `npm test`
Expected: FAIL — el módulo `src/lib/entregas.ts` no existe.

- [ ] **Step 4: Implementar las funciones en `src/lib/entregas.ts`**

Reglas para `normalizarTelefono`: quitar todo lo que no sea dígito; quitar prefijo `52` si quedan 12, `521` si quedan 13, `044`/`045` si quedan 13; devolver solo si quedan exactamente 10.

- [ ] **Step 5: Correr los tests y verificar que pasan**

Run: `npm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/entregas.ts src/lib/entregas.test.ts
git commit -m "Reconocer el celular aunque cada quien lo escriba distinto"
```

---

### Task 2: Las tablas

**Files:**
- Create: `supabase/migrations/entregas.sql`

**Interfaces:**
- Produces: tablas `entrega_contactos`, `entregas`, `entrega_intentos`.

- [ ] **Step 1: Escribir la migración**

Con cabecera de comentario explicando el porqué, como las migraciones que ya existen.

`entrega_contactos`: `id uuid pk`, `created_at`, `telefono text not null unique` (normalizado, 10 dígitos), `nombre text not null`, `email text`, `user_id uuid` (nulable, hacia `profiles`), y la dirección **toda nulable**: `calle`, `num_ext`, `num_int`, `colonia`, `ciudad`, `estado`, `cp`, `referencia`.

`entregas`: `id uuid pk`, `created_at`, `contacto_id uuid not null`, `tipo text not null` (`envio` | `rock_show`), `paqueteria text`, `recibe text`, `direccion jsonb` (fotografía del momento), `piezas text not null`, `foto text`, `resta numeric not null default 0`, `status text not null default 'nueva'` (`nueva` | `atendida` | `conflicto`).

`entrega_intentos`: `id bigserial pk`, `ip text not null`, `created_at timestamptz not null default now()`.

Las tres con `enable row level security` y sin políticas. Índices: `entrega_contactos (telefono)`, `entregas (created_at desc)`, `entrega_intentos (ip, created_at desc)`.

- [ ] **Step 2: Ejecutarla en Supabase → SQL Editor y verificar**

Correr la migración, luego confirmar que las tres tablas existen y que un `select` anónimo no devuelve filas (RLS sin políticas).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/entregas.sql
git commit -m "Tablas del formulario de entregas"
```

---

### Task 3: Buscar por celular

**Files:**
- Create: `src/app/api/entregas/buscar/route.ts`
- Modify: `src/lib/entregas.test.ts`

**Interfaces:**
- Consumes: `normalizarTelefono`, `enmascarar*`, `ContactoEnmascarado` (Task 1); tablas de Task 2.
- Produces: `POST /api/entregas/buscar` con `{ telefono: string }` → `200 { contacto: ContactoEnmascarado | null }`, `400` si el teléfono no normaliza, `429` si se pasó del límite.

Busca en **dos lados**, en este orden: `entrega_contactos.telefono`, y si no hay, `profiles` por `whatsapp` o `ship_phone` normalizados. La respuesta es idéntica venga de donde venga — **nunca** revela cuál de las dos fue. Devuelve `{ contacto: null }` igual que si no existiera cuando no hay match, sin mensaje distinto.

- [ ] **Step 1: Escribir el test del lector de IP**

```ts
// src/lib/entregas.test.ts — agregar
describe('ipDe', () => {
  it('lee la IP real detrás del proxy de Vercel', () => {
    expect(ipDe(new Headers({ 'x-forwarded-for': '189.1.2.3, 10.0.0.1' }))).toBe('189.1.2.3')
    expect(ipDe(new Headers({ 'x-real-ip': '189.1.2.3' }))).toBe('189.1.2.3')
  })
  it('da algo estable cuando no hay encabezados', () => {
    expect(ipDe(new Headers())).toBe('desconocida')
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test`
Expected: FAIL — `ipDe` no existe.

- [ ] **Step 3: Implementar `ipDe(headers: Headers): string` en `src/lib/entregas.ts`**

Primer valor de `x-forwarded-for` (antes de la coma), si no `x-real-ip`, si no `'desconocida'`.

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Implementar el endpoint**

El límite: insertar el intento en `entrega_intentos`, contar los de esa IP en los últimos 60 segundos, y responder `429` arriba de 10. Borrar oportunistamente los intentos de más de una hora en la misma llamada para que la tabla no crezca sin fin.

- [ ] **Step 6: Probar a mano contra el servidor de desarrollo**

Con `curl` o desde el navegador: un número que no existe → `{ contacto: null }`; un número de un perfil con dirección guardada → datos enmascarados, **sin** calle ni CP completos en la respuesta; once llamadas seguidas → la última da `429`.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/entregas/buscar/route.ts src/lib/entregas.ts src/lib/entregas.test.ts
git commit -m "Buscar al cliente por su celular, enmascarado y con tope de intentos"
```

---

### Task 4: Guardar la entrega

**Files:**
- Create: `src/app/api/entregas/route.ts`
- Modify: `src/lib/entregas.test.ts`

**Interfaces:**
- Consumes: Task 1 y Task 2.
- Produces: `POST /api/entregas`, multipart `FormData` con `telefono`, `nombre`, `tipo` (`envio` | `rock_show`), `piezas`, `resta`, `email?`, `foto?`, `noSoyYo?`, y si `tipo === 'envio'`: `paqueteria`, `recibe`, `calle`, `numExt`, `numInt?`, `colonia`, `ciudad`, `estado`, `cp`, `referencia`. Responde `200 { ok: true }` o `400 { error }`.

Reglas:
- Si el contacto existe y **no** viene `noSoyYo`: se actualiza con los datos nuevos y la entrega va `status: 'nueva'`.
- Si el contacto existe y **sí** viene `noSoyYo`: el contacto **no se toca**; la entrega se guarda con los datos recibidos y `status: 'conflicto'`.
- Si no existe: se crea el contacto. Si el teléfono coincide con un `profiles`, se guarda ese `user_id`.
- La dirección se copia dentro de `entregas.direccion` como fotografía del momento.
- La foto, si viene, sube a Supabase Storage con el patrón de `src/app/api/sell/route.ts` (bucket público idempotente, nombre aleatorio, URL pública guardada).

- [ ] **Step 1: Escribir los tests de validación**

```ts
// src/lib/entregas.test.ts — agregar
describe('validarResta', () => {
  it('acepta un número y el cero', () => {
    expect(validarResta('0')).toBe(0)
    expect(validarResta('350')).toBe(350)
    expect(validarResta('60.50')).toBe(60.5)
  })
  it('rechaza lo que no es un monto', () => {
    expect(validarResta('como $100')).toBeNull()
    expect(validarResta('-50')).toBeNull()
    expect(validarResta('')).toBeNull()
  })
})

describe('validarPiezas', () => {
  it('conserva completas las 25 figuras pegadas de WhatsApp', () => {
    const lista = Array.from({ length: 25 }, (_, i) => `Iron Man Mk ${i + 1}`).join('\n')
    expect(validarPiezas(lista)).toBe(lista)
  })
  it('rechaza vacío y lo absurdamente largo', () => {
    expect(validarPiezas('   ')).toBeNull()
    expect(validarPiezas('x'.repeat(5001))).toBeNull()
  })
})
```

- [ ] **Step 2: Correr y verificar que fallan**

Run: `npm test`
Expected: FAIL — `validarResta` y `validarPiezas` no existen.

- [ ] **Step 3: Implementar `validarResta(raw: string): number | null` y `validarPiezas(raw: string): string | null` en `src/lib/entregas.ts`**

`validarPiezas` recorta espacios de las orillas pero **conserva los saltos de línea internos**; tope 5000 caracteres.

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Implementar el endpoint**

- [ ] **Step 6: Probar a mano los tres caminos**

Contra el servidor de desarrollo: celular nuevo (crea contacto + entrega); el mismo celular otra vez (actualiza el contacto, **segunda** entrega, no duplica contacto — verificar con un `select` en Supabase); el mismo con `noSoyYo` (contacto intacto, entrega en `conflicto`).

- [ ] **Step 7: Commit**

```bash
git add src/app/api/entregas/route.ts src/lib/entregas.ts src/lib/entregas.test.ts
git commit -m "Guardar la entrega y reusar el contacto del cliente"
```

---

### Task 5: El formulario

**Files:**
- Create: `src/app/entregas/page.tsx`

**Interfaces:**
- Consumes: `POST /api/entregas/buscar` (Task 3), `POST /api/entregas` (Task 4).

Tres pasos con barra de progreso, componente de cliente (`'use client'`), **diseñado para celular primero** — es donde va a llegar, desde un link de WhatsApp.

1. **Celular.** Una caja grande. Al continuar llama a `/api/entregas/buscar`.
   - Con contacto: `¡Hola, <nombre>! 👋` y sus datos enmascarados en una tarjeta, con *Continuar*, *Cambiar dirección* y *No soy yo*.
   - Sin contacto: campos de nombre y correo (correo **opcional**).
2. **Envío o Rock Show.** Dos opciones grandes. Si es envío: paquetería (`Correos de México $75`, `Estafeta $160`, `FedEx (a cotizar)`) y los campos de dirección. Si eligió *Cambiar dirección* en el paso 1, los campos salen **en blanco** con los valores enmascarados arriba como referencia. Si es Rock Show: no se pide dirección.
3. **Piezas y resta.** Caja de texto multirenglón con la instrucción "una por renglón" visible, foto opcional, y dos opciones excluyentes: *Ya está todo pagado* / *Me falta pagar $\_\_\_*.

Al enviar, pantalla de gracias.

- [ ] **Step 1: Construir la página**

- [ ] **Step 2: Verificar en el navegador, en tamaño celular**

Levantar el servidor de desarrollo y recorrer los seis casos de la spec: número nuevo, número que ya existe, "no soy yo", envío, Rock Show, 25 renglones de piezas, y "me falta pagar $X". Revisar la consola del navegador y la red: **confirmar que la respuesta de `/api/entregas/buscar` no trae la dirección completa.**

- [ ] **Step 3: Verificar que compila**

Run: `npm run build`
Expected: compila sin errores

- [ ] **Step 4: Commit**

```bash
git add src/app/entregas/page.tsx
git commit -m "Formulario de entregas: tres pasos, pensado para el celular"
```

---

### Task 6: La sección del panel

**Files:**
- Create: `src/app/api/admin/entregas/route.ts`
- Modify: `src/app/(account)/admin/page.tsx`

**Interfaces:**
- Consumes: tablas de Task 2.
- Produces: `GET /api/admin/entregas` → `{ entregas: EntregaAdmin[] }` con el contacto embebido; `PATCH /api/admin/entregas` con `{ id, status }`.

La sección es **una tarjeta más** al final de la lista que ya existe en `admin/page.tsx` — no hay pestañas en esa página y no se van a introducir. Mismo envoltorio visual que las demás (`background: var(--paper)`, borde, `borderRadius: 16`, ícono en cuadro `--accent-soft`, `<h2>` de 16px). Se carga en el mismo `useEffect` que las otras secciones.

Contenido: filtros Todo / Envío / Rock Show / Sin atender, buscador por nombre o celular, tabla con cuándo, cliente + celular, tipo, piezas, resta, entrega (paquetería + dirección completa si es envío), y botón para marcar atendida. Las entregas en `conflicto` se marcan a la vista.

Dos botones arriba, los dos sobre **lo filtrado**, no sobre todo:
- **Copiar** — tabla legible al portapapeles, separada por tabuladores, con los saltos de línea de las piezas aplanados a ` · ` para que no rompan la celda al pegar.
- **Bajar a Excel (Estafeta)** — llama al endpoint de Task 7.

- [ ] **Step 1: Implementar el endpoint de administración**

Patrón exacto de `src/app/api/admin/sell-requests/route.ts` para la validación.

- [ ] **Step 2: Agregar la sección a la página**

- [ ] **Step 3: Verificar en el navegador con una cuenta `is_admin`**

Que la tabla liste las entregas creadas en las tareas anteriores, que los filtros y el buscador funcionen, que *Copiar* pegue bien en una hoja de cálculo, y que marcar atendida persista tras recargar.

- [ ] **Step 4: Verificar que compila**

Run: `npm run build`
Expected: compila sin errores

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/entregas/route.ts "src/app/(account)/admin/page.tsx"
git commit -m "Ver las entregas del formulario en administración"
```

---

### Task 7: Guías de Estafeta

**Files:**
- Modify: `src/app/api/admin/estafeta/route.ts`

**Interfaces:**
- Consumes: tabla `entregas` (Task 2).
- Produces: el mismo CSV Multiguía, ahora con las entregas del formulario incluidas.

Se **extiende la ruta que ya existe**, no se escribe un segundo exportador. Hoy lee `orders`; hay que agregar las filas de `entregas` con `tipo = 'envio'`, dirección no nula y paquetería Estafeta. `HEADER`, `csvCell` y el BOM se reusan tal cual.

Mapeo de columnas desde `entregas.direccion` + su contacto: `nombre_destinatario` ← `recibe`, `telefono_destinatario` ← teléfono del contacto, `email_destinatario` ← correo del contacto (vacío si no dio), `contenido_paquete` ← las piezas con los saltos de línea aplanados a ` | `, `cantidad` ← `1`, `valor_declarado` ← la resta. El resto de los defaults (`CM`, `KG`, medidas, `MX`, `NO`) igual que las órdenes.

Las entregas del Rock Show **no** entran: no llevan guía.

- [ ] **Step 1: Agregar las entregas al exportador**

- [ ] **Step 2: Verificar el CSV**

Descargarlo con una cuenta `is_admin` y abrirlo: que traiga tanto órdenes de la tienda como entregas del formulario, que los acentos se vean bien, que ninguna fila sea de Rock Show, y que el número de columnas de cada fila coincida con `HEADER`.

- [ ] **Step 3: Verificar que compila**

Run: `npm run build`
Expected: compila sin errores

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/estafeta/route.ts
git commit -m "Incluir las entregas del formulario en las guías de Estafeta"
```

---

## Fuera de este plan

De la spec, explícitamente pospuesto:

- **Palomitas sobre las compras reales** del cliente en vez de escribirlas. Antes de construirlo hay que replantearle al dueño el código por SMS: enseñar qué compró alguien pesa más que enseñar su calle tapada.
- **Apagar los dos Google Forms** y dejar en ellos el link nuevo. Es trabajo del dueño en su cuenta de Google; recordárselo al entregar.

---

### Task 8: Código de verificación para "Cambiar dirección"

Agregada durante la construcción, a petición del dueño (2026-10-19). Ver la sección "Código de verificación" de la spec.

**Files:**
- Modify: `supabase/migrations/entregas.sql` (append)
- Create: `src/app/api/entregas/codigo/route.ts`
- Modify: `src/lib/entregas.ts`, `src/lib/entregas.test.ts`
- Modify: `src/app/api/entregas/route.ts`
- Modify: `src/app/entregas/page.tsx`
- Modify: `src/lib/resend.ts`

**Interfaces:**
- Consumes: `entrega_contactos` (T2), `normalizarTelefono` e `ipDe` (T1/T3), el patrón de correo de `src/lib/resend.ts`.
- Produces: `POST /api/entregas/codigo` con `{ telefono }` → manda el código y responde `{ enviado: true, correo: '<enmascarado>' }`, `{ enviado: false, motivo: 'sin_correo' }` si el contacto no tiene correo, `429` sobre el tope. `POST /api/entregas` acepta `codigo` y lo exige cuando viene una dirección nueva para un contacto que ya existe.

Reglas:
- Código de 6 dígitos, vigencia 15 minutos, un solo uso, máximo 5 intentos por código.
- Se guarda **hasheado** (`crypto.createHash('sha256')`), nunca en claro — la tabla la lee cualquiera con la llave de servicio.
- El correo se manda con Resend, en español, con el mismo tono de las plantillas que ya existen.
- Se responde igual exista o no el contacto, salvo el caso `sin_correo`, que el formulario necesita para mandar a WhatsApp.
- El tope por IP reusa `entrega_intentos`.

- [ ] **Step 1: Escribir los tests que fallan**

```ts
// src/lib/entregas.test.ts — agregar
describe('generarCodigo', () => {
  it('da 6 dígitos', () => expect(generarCodigo()).toMatch(/^\d{6}$/))
  it('no repite el mismo código', () => {
    const vistos = new Set(Array.from({ length: 50 }, () => generarCodigo()))
    expect(vistos.size).toBeGreaterThan(40)
  })
})

describe('hashCodigo', () => {
  it('es estable y no reversible a simple vista', () => {
    expect(hashCodigo('123456')).toBe(hashCodigo('123456'))
    expect(hashCodigo('123456')).not.toBe(hashCodigo('123457'))
    expect(hashCodigo('123456')).not.toContain('123456')
  })
})
```

- [ ] **Step 2: Correr y verificar que fallan**

Run: `npm test`
Expected: FAIL — `generarCodigo` y `hashCodigo` no existen.

- [ ] **Step 3: Implementar `generarCodigo(): string` y `hashCodigo(codigo: string): string` en `src/lib/entregas.ts`**

`generarCodigo` usa `crypto.randomInt`, no `Math.random`.

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Agregar la tabla `entrega_codigos`**

Append a `supabase/migrations/entregas.sql`, con `create table if not exists`: `id`, `contacto_id` (FK), `codigo_hash text not null`, `expira_at timestamptz not null`, `intentos int not null default 0`, `usado boolean not null default false`, `created_at`. RLS sin políticas, índice por `contacto_id`.

- [ ] **Step 6: Implementar `POST /api/entregas/codigo`**

- [ ] **Step 7: Exigir el código en `POST /api/entregas`**

Solo cuando el contacto ya existe, no viene `noSoyYo`, y la petición trae una dirección nueva. Código inválido, vencido, usado o con 5 intentos → 400 en español. Al usarse, marcar `usado`.

- [ ] **Step 8: La pantalla del código en el formulario**

"Cambiar dirección" ya no abre los campos directo: manda el código y pide los 6 dígitos, diciendo a qué correo enmascarado llegó. Sin correo en el contacto → pantalla que manda a WhatsApp. Reenviar disponible después de 60 segundos.

- [ ] **Step 9: Correo obligatorio al registrarse**

Un contacto nuevo no se crea sin correo, en el formulario y en el endpoint.

- [ ] **Step 10: Verificar en el navegador y commitear**

Run: `npm test` y `npm run build`

```bash
git add -A
git commit -m "Pedir código por correo para cambiar la dirección guardada"
```
