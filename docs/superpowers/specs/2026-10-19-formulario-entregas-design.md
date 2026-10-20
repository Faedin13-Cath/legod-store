# Formulario de entregas — diseño

**Fecha:** 2026-10-19
**Proyecto:** Jango's Store (`C:\legod`) — Next.js 14 App Router, Shopify headless + Supabase.

---

## Intención y el porqué

Jango's Store vende la mayor parte de sus figuras **por WhatsApp**, no por la tienda en línea. Cuando un cliente ya compró y hay que mandarle sus piezas, hoy se le pasa uno de dos Google Forms:

1. **Envíos Legod** — correo, nombre de quien recibe, tipo de envío, teléfono, calle, número, interior, CP, colonia, municipio, estado y referencia.
2. **Entregas en el Rock Show** (el convive) — nombre completo, piezas a recoger, comprobante de pago, restante a pagar y número de celular.

Ese formulario **es el único registro de la venta**: la venta ocurrió en una conversación de WhatsApp y no queda anotada en ningún otro lado. No existe pedido en la tienda contra el cual cotejarla.

El dolor concreto, en palabras del dueño: *"muchos se quejan de que tienen que poner sus datos muchas veces"*. Un cliente recurrente vuelve a teclear nombre, teléfono y dirección completa en cada compra. La meta es que **llene sus datos una sola vez y que en las siguientes solo escriba su número de celular**.

El segundo dolor es del lado del dueño: las respuestas viven en dos hojas de Google separadas de la tienda, y dos columnas llegan sucias:

- **"Piezas a recoger"** es texto libre sin formato. Una respuesta real trae 25 renglones escritos a mano.
- **"Restante a pagar"** cada quien lo contesta distinto: *"Todo pagado"*, *"Ninguna"*, *"0.00"*, *"$100"*, *"350"*, *"Está liquidado"*, *"total de ambas figuras pagadas"*.

## Metas

- Un cliente recurrente completa el formulario escribiendo **su celular y sus piezas**, nada más.
- Un cliente nuevo queda registrado al llenarlo la primera vez, **sin crear cuenta de LEGOD** (sin contraseña, sin confirmar correo).
- Los dos Google Forms se reemplazan por **uno solo** en el sitio.
- El dueño ve todas las respuestas en el panel de administración que ya existe, filtrables, y se las lleva a Excel o al portapapeles.
- "Restante a pagar" llega siempre como número, no como frase.

## No-metas

- **No** cobrar ni procesar pagos en este formulario. El pago se acuerda por WhatsApp. El campo "Comprobante de pago" del formulario actual **se elimina**: el dueño dijo textualmente que "no se ocupa".
- **No** crear cuentas de Supabase Auth para quien llene el formulario.
- **No** tocar el checkout de la tienda, ni apartados, ni preventas, ni el casillero.
- **No** notificar por correo cada respuesta. El dueño prefiere entrar al panel a verlas. (`notifyOwner` existe y se usa en `/api/sell`; aquí **no** se usa.)
- **No** conectar Google Sheets.

## Anti-metas

Cosas que harían fracasar esto aunque funcione técnicamente:

- **Que el cliente abandone el formulario a la mitad.** Es la razón por la que las piezas van en una sola caja de texto y no en renglones de "+ agregar pieza": el pedido más grande en la hoja real son 25 figuras, y serían 25 toques en un celular.
- **Filtrar la dirección de un cliente a quien escriba su número.** No hay contraseña: el número de celular es toda la llave. Ver "Privacidad" abajo.
- **Obligar a registrarse en LEGOD.** El dueño fue explícito: *"no tienen que hacer una cuenta en legod forzosamente, solo registrarse en sí, en este formulario"*.

---

## El flujo del cliente

Un solo formulario, tres pasos. Decidido con maquetas, opción **B** de tres que se le mostraron: el número decide el camino, el cliente nunca tiene que clasificarse a sí mismo como nuevo o recurrente.

### Paso 1 — El celular

Una sola caja grande: **"Tu celular"**. Al continuar, el servidor busca ese número **en dos lados**: en los contactos del formulario y en los perfiles de LEGOD (`profiles.whatsapp` y `profiles.ship_phone`). Decisión del dueño, tomada sabiendo lo que cuesta — ver "Privacidad".

- **Lo encuentra** → lo saluda por su nombre y le muestra sus datos guardados **parcialmente tapados** para que confirme. Puede seguir, cambiar la dirección, o decir "no soy yo".
- **No lo encuentra** → le pide nombre y sus datos. Queda guardado para la próxima.

**"No soy yo" nunca sobreescribe el contacto que ya existe** (decisión del constructor). Lo más probable es que se haya equivocado de dígito, no que sea otra persona: primero se le pide revisar el número. Si insiste, su entrega se guarda con los datos que él escriba y queda marcada en el panel como *número en conflicto*, para que el dueño lo resuelva. Borrar de golpe el nombre y la dirección de un cliente real desde un formulario sin contraseña no es una opción.

**El correo es opcional.** El formulario del Rock Show hoy no lo pide, y es un campo más entre el cliente y el botón de enviar.

### Paso 2 — Cómo quiere sus figuras

Dos opciones:

- **Envío a domicilio** → paquetería (Correos de México $75, Estafeta $160, FedEx a cotizar), nombre de quien recibe, calle, número exterior, número interior (opcional), CP, colonia, municipio/ciudad, estado y referencia. Son los mismos campos del Google Form actual.
- **Entrega en el Rock Show** → no se le pide dirección en absoluto.

**La dirección se pide aquí, no en el paso 1** (decisión del constructor). Quien solo va al Rock Show no da dirección nunca: las columnas de dirección del contacto son nulables, y la primera vez que ese cliente pida envío se le piden ahí mismo y se le guardan.

**Si el cliente eligió "cambiar la dirección"**, los campos salen **en blanco**, con los valores tapados visibles arriba como referencia (decisión del constructor). Prellenarlos con los valores reales anularía el enmascarado para cualquiera que adivine un número — que es justo lo que el enmascarado evita.

### Paso 3 — Qué piezas y cuánto resta

- **Piezas:** una sola caja de texto, con la instrucción **"una por renglón"** a la vista, más una foto opcional. Decidido con maqueta, opción A de dos. Se acepta que esto no captura cantidades por pieza — hoy tampoco se capturan.
  - **Si el celular corresponde a un cliente con compras en la tienda**, antes de la caja se le muestran sus figuras con casilla de palomita para marcar las que va a recoger; lo escrito a mano queda para lo vendido por WhatsApp. Ver "Alcance opcional".
- **Restante a pagar:** dos opciones excluyentes — *"Ya está todo pagado"* o *"Me falta pagar $\_\_\_"* con una caja numérica. Nunca texto libre. **Esta decisión la tomó el diseñador, no el dueño** (se le preguntó tres veces y no la contestó directamente; se le comunicó la decisión y no la objetó).

---

## Privacidad: el punto delicado

No hay contraseña ni código. **Cualquiera que escriba un número de celular ajeno llega a la pantalla de "ya te reconocí".** Esto es inherente al diseño que el dueño pidió y se le explicó de frente.

**El dueño decidió además que la búsqueda alcance a los perfiles de LEGOD**, no solo a quienes ya llenaron este formulario. Se le planteó con el costo enfrente y lo aceptó: quien se sepa el WhatsApp de un cliente registrado llega a su dirección enmascarada **aunque esa persona nunca haya usado este formulario**. A cambio, el cliente de LEGOD no vuelve a teclear sus datos ni una sola vez. Dos consecuencias para el constructor: el límite de intentos deja de ser opcional, y el enmascarado aplica igual venga el dato de donde venga.

Decisión tomada (opción B de tres, elegida por el dueño sobre maquetas): **enmascarar los datos en pantalla**.

- Se muestra: nombre de pila completo (*"¡Hola, Santiago!"*).
- Se muestra parcialmente: calle con el número tapado (`Morelos 1••`), colonia tapada (`C•••••••`), CP parcial (`06••0`), correo parcial (`san•••@gmail.com`).
- **No se muestra nunca en pantalla:** la dirección completa. Viaja del servidor al registro de administración sin pasar por el navegador del cliente.

El cliente reconoce su propia dirección; un curioso saca un nombre de pila y una calle sin número.

Se le ofreció al dueño una cuarta salida —código de 4 dígitos por SMS antes de mostrar nada— y la dejó pasar. **Si en algún momento quiere cerrarlo del todo, ése es el camino, y el diseño no debe estorbarlo:** el paso de verificación cabe entre el paso 1 y el paso 2 sin tocar lo demás.

### Consecuencias para el constructor

- El endpoint que busca por celular **devuelve solo los campos enmascarados**, nunca el registro completo. El enmascarado ocurre en el servidor.
- Ese endpoint necesita **límite de intentos por IP** (sugerido: unos 10 por minuto). Sin él, cualquiera puede barrer números y cosechar nombres. El proyecto va en Vercel, donde un contador en memoria es por instancia y se borra en frío — serviría de adorno. Se lleva **en una tabla de Supabase** (decisión del constructor): cumple sin agregar dependencias ni cuentas nuevas, al costo de una escritura por consulta. Necesita borrado de registros viejos.
- Como la búsqueda ahora alcanza `profiles`, el endpoint devuelve lo mismo —enmascarado— sin importar de qué tabla salió el dato, y **nunca** indica cuál de las dos fue.
- El `id` interno del contacto no debe viajar al navegador en forma utilizable para leer el registro completo. Si el cliente confirma "sí soy yo", el servidor vuelve a resolver el contacto por el número en el envío final, no por un id que el navegador pudo manipular.

---

## El lado del administrador

**Sección nueva, "Formulario", dentro de `src/app/(account)/admin/page.tsx`** (decisión del constructor). Las maquetas que vio el dueño mostraban pestañas, pero esa página hoy **no tiene pestañas**: son siete tarjetas, una debajo de otra, cada una con su `<h2>`. Convertirla a pestañas obliga a tocar las seis secciones que ya funcionan, y eso nadie lo pidió. Va como una tarjeta más, con sus propios filtros, buscador y botones dentro.

El patrón a seguir es el que ya usa esa página: la sección consume un endpoint bajo `src/app/api/admin/` que valida `isAdmin(user.id)` y lee con `createAdminClient()` — ver `src/app/api/admin/sell-requests/route.ts` como molde exacto.

La tabla muestra, por respuesta: cuándo, cliente (nombre + celular), cómo (Envío / Rock Show), piezas, cuánto resta, entrega (paquetería + dirección completa si es envío), y una acción para marcarla como atendida.

Controles:

- **Filtros:** Todo · Envío · Rock Show · Sin atender.
- **Buscador** por nombre o celular.
- **Botón "Bajar a Excel"** y **botón "Copiar"**. Los dos exportan **lo que esté filtrado en pantalla**, no todo. El de copiar deja el contenido en el portapapeles listo para pegar en una hoja de cálculo (texto separado por tabuladores).

**El Excel sale en formato Estafeta Multiguía**, decisión del dueño: lo usa para generar guías, no para archivar. `src/app/api/admin/estafeta/route.ts` ya produce ese CSV con el encabezado exacto de la carga masiva, pero solo desde la tabla `orders` — es decir, hoy no cubre justamente las entregas que sí necesitan guía. **Conviene extender esa ruta para que también lea las entregas de este formulario, en vez de escribir un segundo exportador.** Solo las de tipo envío con dirección: una entrega del Rock Show no lleva guía.

El botón de **Copiar** sí es la tabla legible —para pegar en su hoja— y no el formato de Estafeta. Ahí las piezas, que son multirenglón, se aplanan con un separador: un salto de línea rompe la celda al pegar.

Aquí la dirección completa sí se muestra: es el panel del dueño.

---

## Datos

Tabla nueva en Supabase, con migración en `supabase/migrations/` siguiendo el estilo de las que ya existen (`sell_requests.sql` es el molde: comentario de cabecera, `create table if not exists`, RLS activado **sin políticas públicas** para que solo el backend con `service_role` lea y escriba, e índice por `created_at desc`).

Hacen falta **dos** tablas, y la separación importa:

1. **El contacto** — lo que se guarda una vez y se reusa: celular (la llave, única), nombre, correo (opcional) y su dirección (nulable: el que solo va al Rock Show no la da). Es lo que hace que la segunda vez solo tenga que poner su número. Conviene que lleve un `user_id` nulable hacia `profiles`: es lo que amarra al cliente que sí tiene cuenta de LEGOD, y es la base que necesitaría después lo de las palomitas sobre sus compras.
2. **La entrega** — una fila por cada vez que llena el formulario: a qué contacto corresponde, si es envío o Rock Show, paquetería, el texto de las piezas, la foto si la subió, cuánto resta, el estado (sin atender / atendida / número en conflicto) y la fecha.

La dirección se guarda **en los dos lados**: en el contacto como "la última que usó" y copiada dentro de la entrega como fotografía del momento. Si el cliente se muda, las entregas viejas deben seguir diciendo a dónde se mandaron. Es el mismo criterio que ya usa `orders.shipping` en este proyecto.

**Normalización del celular:** el número es la llave primaria de identidad, y la gente lo escribe como se le ocurre (`55 1234 5678`, `5512345678`, `+52 55 1234 5678`). Hay que guardar una forma normalizada —solo dígitos, sin lada de país— y buscar siempre contra ella, o el cliente recurrente no se va a reconocer a sí mismo. Esto no existe hoy en el proyecto; hay que escribirlo.

**Fotos:** si se acepta la foto opcional, va a Supabase Storage con el mismo patrón que `/api/sell` (bucket público creado de forma idempotente, nombre de archivo aleatorio, URL pública guardada en la fila).

---

## Decisiones ya tomadas sobre el "cómo"

- **Next.js 14 App Router**, el mismo del proyecto. El formulario es una página nueva del sitio público; los endpoints van bajo `src/app/api/`.
- **Supabase** para datos, con `createAdminClient()` desde el servidor. Sin Supabase Auth para estos contactos.
- **Sin dependencias nuevas.** El Excel se genera con lo que ya hay o como CSV/TSV que Excel abre nativamente; no se instala una librería de xlsx para esto.
- **Estilo visual:** el del sitio (variables `--cream`, `--paper`, `--line`, `--ink`, `--accent`, clases `input`, `btn btn-primary`), estilos en línea como en `src/app/login/page.tsx`.
- **Idioma:** todo en español, como el resto del sitio. Los comentarios del código también.
- **Los precios de paquetería** salen de `src/lib/shipping.ts`, que ya los tiene (`Estafeta` 160, `Correos de México` 75, `FedEx` 250, `Entrega en Rock Show` 0). **Ojo:** el Google Form dice "FedEx (A cotizar)" y el archivo dice 250. Para este formulario manda el Google Form —a cotizar—, porque estas ventas se cotizan por WhatsApp; no cambiar `shipping.ts`, que lo usa el checkout real.

## Lo que queda a criterio del constructor

- La ruta pública del formulario (`/entregas`, `/formulario`, u otra) y si se enlaza desde el menú o solo se comparte el link por WhatsApp.
- La forma exacta del enmascarado (cuántos caracteres se tapan).
- Si los tres pasos son tres pantallas o una sola página que se va revelando. La maqueta aprobada muestra tres pasos con barra de progreso.
- Nombres de tablas, columnas y endpoints.
- Qué pasa después de enviar: pantalla de gracias. Si conviene un botón de "mandar WhatsApp a la tienda", es bienvenido pero no se pidió.
- Si un cliente con sesión iniciada en LEGOD ve su celular ya puesto.

## Alcance opcional (no bloquea la primera versión)

- **Palomitas sobre las compras reales.** Si el celular corresponde a un perfil de LEGOD con pedidos, mostrarle sus figuras para marcarlas en vez de escribirlas. Se le prometió al dueño en las maquetas, pero el propio dueño dijo que *"no tantos pasan por tienda"*, así que sirve a una minoría y puede ir en una segunda pasada. **Ojo con la privacidad:** enseñar qué compró alguien es más delicado que enseñar su calle tapada. Si esto se construye sobre el reconocimiento por número sin verificar, hay que volver a plantearle al dueño el código por SMS.
- **Apagar los Google Forms** y dejar en ellos un aviso con el link nuevo. Es trabajo del dueño en su cuenta de Google, no del constructor, pero conviene recordárselo al entregar.
- **Verificación por SMS**, si algún día quiere cerrar el hueco de privacidad.

---

## Cómo se verificará

- El formulario se prueba en el navegador con el servidor de desarrollo, de principio a fin, en **tamaño celular** — es donde lo va a abrir el cliente, llegando de WhatsApp.
- Casos que tienen que quedar probados: número nuevo, número que ya existe, "no soy yo", envío, Rock Show, piezas pegadas de 25 renglones, y "me falta pagar $X".
- El panel se prueba con una cuenta que tenga `is_admin`, incluyendo que el Excel y el Copiar respeten el filtro.
- `npm run build` tiene que pasar antes de dar por terminado.
