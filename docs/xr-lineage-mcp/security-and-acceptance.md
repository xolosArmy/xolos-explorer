# Amenazas, controles y aceptación

## Activos, actores y fronteras

Proteger la integridad de las respuestas, la procedencia, los recursos de los
servicios existentes y la privacidad de los registros. Un agente autorizado puede
equivocarse o aportar entrada hostil. También se consideran comprometidos un
gateway, un documento IPFS, una dependencia, una ficha editorial o una cuenta de
publicación. Confianza en GitHub/Chronik y en el host autorizado es explícita y
limitada; un commit o hash no certifica la veracidad biológica del registro.

Fronteras: host → proceso MCP; MCP → repositorios públicos; MCP → Chronik público;
MCP → gateways IPFS; bytes externos → parser/proyección; caché → respuesta. El
publicador del Oráculo y su red interna quedan fuera de esas fronteras accesibles.

## Modelo de amenazas y mitigación

| ID | Amenaza / consecuencia | Control exigido y prueba |
| --- | --- | --- |
| T01 | URL/CID malicioso, redirects o DNS rebinding alcanzan red interna o metadata cloud | Endpoints de configuración cerrados, HTTPS/443, sin redirects, resolver y fijar IP pública para conexión; bloquear todo destino no global IPv4/IPv6, mapeados, loopback, link-local, privados, multicast y reservados; test SSRF |
| T02 | JS editorial o metadata IPFS ejecuta código o inyecta instrucciones al agente | Parser AST de literales, nunca eval/import remoto; JSON estricto; proyección permitida; tratar textos como datos, nunca prompts; no ejecutar enlaces ni contenido |
| T03 | Presentación editorial sobreescribe una prueba o convierte un nombre en parentesco | Evidencia por campo, ejes separados, detectar identidad ambigua; etiquetas editoriales no cambian estados |
| T04 | Gateway devuelve bytes distintos, 200 engañoso o JSON reformateado | Hash de bytes exactos contra ancla SLP corroborada antes de parsear; reportar discrepancia como temporal, no genealogía inválida |
| T05 | Chronik equivocado, atrasado, inconsistente o reorg durante consulta | Ancla mainnet y reglas compartidas, altura/hash y seis confirmaciones, coherencia de tx/token/bloque/punta; conflicto si cambia bloque; evidencia de dependencia de indexador |
| T06 | JSON de distintos commits produce censo híbrido o métricas falsas | Obtener un SHA y todos los blobs del mismo snapshot, validar invariantes; no sustituir métricas con recálculo propio |
| T07 | Datos antiguos se presentan como verificación actual | TTL, fecha de lectura y contenido separadas, basis y checked_at por eje, publisher_health desconocida; no renovar fecha de observación al servir caché |
| T08 | Entrada genera escaneo masivo, tormenta de IPFS o agotamiento de memoria | Sin fetch libre/escaneo; cuotas por sesión y globales, bytes descomprimidos, deadlines, cancelación y límites de grafo/caché |
| T09 | Ciclos, duplicados, slugs repetidos o IDs provisionales crean genealogía falsa | Identidad por TXID, control de visitados, límites, rechazo de placeholders como ID, ambiguos explícitos, no fuzzy matching |
| T10 | Fuga de microchip, criador, dirección, expediente sanitario o claves en respuesta/logs | Proyección cerrada, no documentos crudos, no logs de argumentos/contenido/credenciales, sin wallet ni llaves del publicador |
| T11 | Uso de servidor como publicador, wallet o confused deputy | Grafo de imports sin `run/cli/publish`, sin child_process o shell; wrappers exponen solo GET de lectura; no aceptar tokens upstream del cliente |
| T12 | Dependencia o actualización cambia interpretación censal | Una implementación compartida, versiones e integridad fijadas, revisión de cambios, fixtures sintéticas, CI de lectura y auditoría del grafo |
| T13 | Cliente no autorizado o sesión mezclada accede a caché/cursor ajeno | MVP stdio bajo host autorizado, cursor aleatorio ligado a sesión y filtros; ningún listener; HTTP requiere revisión aparte y scopes verificados |
| T14 | Fallo upstream se interpreta como inexistencia, cero o verificación negativa | Errores/partial explícitos, null preservado, diferenciar not_found del endpoint de ausencia universal; no crear censo vacío |
| T15 | Publicación comprometida conserva autor/labels y parece legítima | Commit/blob y evidencia explícitos; identidad Git no es firma; datos se cotejan bajo demanda; conflicto no corrige fuentes; alertar al responsable mediante proceso existente |

Riesgos residuales: el endpoint Chronik es un índice confiado, no un nodo ni prueba
SPV del MCP; GitHub controla disponibilidad y referencias de ramas; la observación
IPFS es puntual; no hay demostración biológica o de propiedad. La validación del
hash SLP no equivale a validar todo el DAG del CID. Esos límites forman parte de
la respuesta, no una advertencia opcional fuera del contrato.

## Política de acceso y red

En MVP stdio solo el usuario/host autorizado puede iniciar el proceso. No montar
SSH, `.aws`, llaves de deploy, wallets, estado de Oráculo, socket Docker, RPC,
servicios internos o credenciales de publicación. Configuración de ejecución
propia, sin heredar variables secretas innecesarias. Sin listener HTTP, discovery
de servicios, WireGuard ni acceso directo a la red interna.

Egress propuesto para revisión: `api.github.com` y `raw.githubusercontent.com`
para repositorios/rutas fijos; `chronik.e.cash` para endpoints de lectura puntual;
`gateway.pinata.cloud` e `ipfs.io` exclusivamente `/ipfs/<CID>`. No comodines de
hosts, IPNS, subpaths arbitrarios, URLs en metadata, querystrings de usuario,
puertos alternos, userinfo o redirecciones. Revalidar IP en cada conexión; impedir
que la librería resuelva otra dirección después de comprobar DNS. Aplicar también
ACL de egress en el entorno de ejecución. La excepción de nodo privado del cliente
actual del Oráculo **no se hereda**.

El protocolo MCP puede recibir mensajes `tools/call`; la restricción de lectura
se aplica a sus efectos y a upstreams. El cliente Chronik debe exponer solo GET
para información de cadena, bloque, tx y token. Prohibidos endpoints broadcast,
validación/envío de transacciones y escritura IPFS/GitHub. No basta con omitir
esos métodos de la lista pública si quedan alcanzables por un adaptador genérico.

Los logs contienen request_id, herramienta, código de resultado, duración,
cantidad de bytes, fuente lógica y commit. No registrar argumentos, nombres,
microchips, metadata, direcciones, tokens o scripts crudos. Retención propuesta
de siete días para métricas/logs operativos mínimos, sujeta a aprobación del
operador; caché solo temporal según arquitectura. Evitar correlación entre
sesiones y borrar cursores al cerrar sesión.

## Casos de prueba requeridos para implementación

Estas son pruebas de aceptación **planificadas**, no una afirmación de que el
servidor exista o ya las haya pasado. Cada caso debe tener fixture sintética y
aserciones de red/estado/salida; las pruebas de integración públicas serán opt-in
y no una condición dependiente de gateways para CI determinista.

| Caso | Entrada / condición | Resultado exigido |
| --- | --- | --- |
| C01 | Listar, paginar y cambiar HEAD entre páginas | Orden estable, sin duplicados; cursor conserva snapshot anterior |
| C02 | Cursor de otra sesión, filtros cambiados o expirado | Error específico; cero acceso a contexto ajeno |
| C03 | Tres JSON válidos del mismo commit | Valores publicados y procedencia exactos; no alteraciones |
| C04 | Métrica null, desconocida, negativa o JSON de commits distintos | Preservar null válido; rechazar esquema/incoherencia, nunca cero inventado |
| C05 | Slug con dos o más TXID; referencias en conflicto | AMBIGUOUS_ID/SOURCE_CONFLICT con candidatos acotados |
| C06 | Ficha con Draft_Token/placeholder | Registro editorial sin ID blockchain; ningún GET a Chronik por ese valor |
| C07 | NFT1 válido, hash de bytes igual, seis confirmaciones | Blockchain confirmed y IPFS validated con evidencia y fecha; genealogía independiente |
| C08 | NFT1 válido con 0..5 confirmaciones | Unconfirmed; no confirmed por edad del snapshot |
| C09 | Tipo de token, ticker, grupo, input o cantidad no admitidos | Conflicto con motivo técnico; no admitir al censo |
| C10 | Ancla incorrecta, bloque cambia, tip atrasado o respuestas incompatibles | Eje blockchain no confirmado; conflicto/unavailable según causa |
| C11 | IPFS HTTP 200 con hash distinto | Temporary y hash_matches=false; no metadata proyectada ni verificación genealógica |
| C12 | 404, 429 con Retry-After, timeout o gateway caído | Temporal, pausa acotada, respuesta dentro del deadline; no falso failed permanente |
| C13 | JSON anclado mal formado, UTF-8 inválido o sin name | Failed del contenido anclado; blockchain conserva su resultado independiente |
| C14 | Sin documentHash, CID inválido o solo URL HTTP | Unchecked/no fetch libre; no equivaler disponibilidad a integridad |
| C15 | Bytes con espacios, BOM/Unicode o saltos distintos | Hash sobre bytes originales; no stringify/normalización para hacer coincidir |
| C16 | Ambos nombres editoriales, sin IDs anclados | Documented; verified_genealogy not_verified, nunca inferir IDs |
| C17 | Dos IDs anclados distintos y presentes en censo | Verified_references con alcance referencial; sin alegar ADN/FCM |
| C18 | Padre=madre, autorreferencia, ID fuera de censo o ciclo multigeneracional | No elevar parentesco; conflicto o incompleto, detener ciclo |
| C19 | Profundidad >3, grafo >31 nodos, JSON enorme o compresión expansiva | Rechazar parámetro o limitar con señal explícita; memoria/bytes acotados |
| C20 | URLs internas, IPv4/IPv6 especiales, DNS rebinding, redirect | Bloquear antes de conectar; verificar con servidor/fetch simulado, sin sondear redes reales |
| C21 | Metadata con instrucciones, JS ejecutable o getters | Ninguna ejecución; proyección de datos únicamente o error de parser |
| C22 | Campos personales/sanitarios y secretos señuelo | Ausentes en respuesta, texto serializado, warnings, caché persistente y logs |
| C23 | Agente intenta firmar, mintear, enviar tx, pinnear o escribir GitHub | Tool/método inexistente y egress bloqueado; cero efecto remoto |
| C24 | NFT inspeccionado fuera del censo | not_in_census, totales y list_lineages intactos |
| C25 | Fuente falla tras cachear, o fecha de contenido antigua con GET actual | Freshness de lectura precisa y salud unknown; observación vieja no se vuelve nueva |
| C26 | Oráculo reports IPFS validado pero comprobación actual falla | Conservar published_claims, observar temporary sin modificar fuente |
| C27 | Cada entrada/salida y error contra schema, incluidos propiedades extra | Contrato estricto, evidence_ids resolubles, sin fallback silencioso |
| C28 | Cuota/concurrencia/cancelación del host | Sin peticiones posteriores al presupuesto o cancelación; retry_after estable |

## Criterios de aceptación de PR-01

- [x] Commits revisados y blobs identificados, con distinción local/remoto y fuentes enlazadas.
- [x] Origen/semántica de campos de los cuatro archivos, incluyendo contenedores y campos opcionales.
- [x] Fuente del Oráculo y mecanismo de publicación identificados; límites de evidencia operativa explícitos.
- [x] Contratos de entrada, salida, errores, límites y paginación para exactamente cinco herramientas.
- [x] Cuatro estados de confianza independientes, evidencia y fecha/base de cada verificación.
- [x] Arquitectura, reutilización segura y árbol propuesto sin crear repositorio ni segunda fuente de verdad.
- [x] Amenazas, controles de acceso, privacidad y casos de prueba descritos.
- [x] Plan de implementación por PR con revisión antes de creación, integración o despliegue.
- [ ] Revisión humana y aprobación de ubicación/estructura y decisiones abiertas.
- [ ] Revisión del PR documental; no fusionar automáticamente.

Los checks marcados describen contenido preparado, no aprobación del diseño.
Los resultados de revisión técnica documental se registran en `review-checks.md`.

## Condiciones posteriores, antes de aceptar el MVP

- Aprobar ubicación/estructura definitiva y licencia/API del componente compartido.
- Recibir evidencia saneada de la versión y mecanismo operativo del Oráculo;
  no afirmar una vinculación código→binario de producción sin ella.
- Tener la matriz C01–C28 implementada y aprobada; incluir evidencia de cero
  escrituras remotas, ausencia de llaves/fondos y bloqueo de red interna.
- Validar que no hay fork de reglas censales, fixtures productivas mantenidas
  como maestro o rutas de escritura alcanzables desde el servidor.
- Revisión humana de seguridad, contratos y responsable del Oráculo/Explorer.
  Cualquier piloto o despliegue requiere mandato separado; PR-01 no lo autoriza.
