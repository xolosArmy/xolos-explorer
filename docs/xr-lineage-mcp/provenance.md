# Auditoría y matriz de procedencia

## Alcance reproducible

La revisión fija commits y blobs en [source-lock.json](source-lock.json). Los
enlaces de código siguientes son inmutables; `main` se utilizó solo para resolver
el commit inicial. Congelar significa registrar esa referencia de auditoría, sin
crear tags, bloquear ramas ni detener al publicador.

- **Explorer E:**
  [`6cc1b4ec2ed582c689c83352b0ffb8cdcd04c60f`](https://github.com/xolosArmy/xolos-explorer/tree/6cc1b4ec2ed582c689c83352b0ffb8cdcd04c60f).
  Frontend React/Vite con consultas Chronik en `src/App.jsx`, índice y metadata
  editorial en `src/data/`, utilidades IPFS y rutas de presentación. No expone
  una API MCP ni un backend de catálogo. El checkout local era
  `9f927eee879057da36825a7482df5c8f6e5f4b1f`; no se actualizó ni se confundió con E.
- **Publicación B:**
  [`a533cabbcb9a28149be75393c84e6cf68807611b`](https://github.com/xolosArmy/Business_network/tree/a533cabbcb9a28149be75393c84e6cf68807611b).
  Portal estático, `data/`, consumidor `js/census.mjs`, scripts de arte comunitario
  y workflow de arte independiente. Su árbol no contiene el generador del censo.
- **Oráculo O:**
  [`455aff43bd0e41cfa8a304c1b1e2045192c923ad`](https://github.com/xolosArmy/xolo-oracle-indexer/tree/455aff43bd0e41cfa8a304c1b1e2045192c923ad).
  Localizado también como checkout limpio en `../xolo-oracle-indexer`, cuyo HEAD
  coincide con el remoto consultado. `src/` separa protocolo, Chronik, IPFS,
  genealogía, censo, ejecución y publicación; `fixtures/` fija fuentes históricas
  y editoriales; `deploy/` contiene unidades systemd; `test/` contiene pruebas.

La inspección estructural de E y B usó árboles recursivos completos sin truncar.
Se leyeron los cuatro archivos solicitados completos y los módulos de producción
de O que los explican. Se revisaron las fixtures editoriales y la configuración
de publicación; no se leyó material secreto ni se ejecutó el indexador/publicador.

## Pipeline del Oráculo: qué está demostrado

La fuente está identificada en O, no en un nuevo servicio MCP. El flujo de
[`run.mjs`](https://github.com/xolosArmy/xolo-oracle-indexer/blob/455aff43bd0e41cfa8a304c1b1e2045192c923ad/src/run.mjs)
es: leer fixtures y estado existente → reconciliar génesis confirmadas vía Chronik
→ comprobar IPFS → construir/validar snapshot → generar los tres JSON → comparar
huellas → publicar únicamente si cambia el contenido.

[`publish.mjs`](https://github.com/xolosArmy/xolo-oracle-indexer/blob/455aff43bd0e41cfa8a304c1b1e2045192c923ad/src/publish.mjs)
obtiene `Business_network/main`, calcula la huella de sus tres archivos y construye
un commit con ese HEAD como padre. Modifica solo `data/metrics.json`,
`data/lineages.json` y `data/recent-registrations.json`. El push no usa force y
rechaza bases inesperadas. El estado registra publicaciones pendientes para
recuperarse de interrupciones; un chequeo sin novedades no cambia la fecha del
contenido. La credencial del publicador es ajena al MCP.

La unidad `deploy/xolo-oracle.service` propone ejecución bajo un usuario de servicio
y `flock`; `xolo-oracle.timer` programa cada 15 minutos. El watchdog propuesto
consulta cada cinco minutos `lastSuccessfulPublicationCheckAt` y alerta al superar
30 minutos. Esto demuestra la configuración versionada, no que esté activa.

El commit B modifica `lineages.json` y `metrics.json`, tiene identidad Git de
Oráculo XOLO y consta como **unsigned** en la respuesta de GitHub. La ejecución
[`43551955997`](https://github.com/xolosArmy/Business_network/actions/runs/43551955997)
de `pages build and deployment` reportó éxito para B. Junto al `CNAME`
`xolosarmy.xyz` y los fetch del portal a `/data/`, prueba el mecanismo de
publicación observado en GitHub. No prueba la exactitud de cada registro ni
autentica criptográficamente al proceso emisor. No se verificaron DNS, contenido
servido por el dominio o byte a byte la publicación HTTP de Pages.

El artículo histórico `blog/oraculo-xolo.html` describe `publish-metrics.sh`, cron
y firmas Git. El código actual O usa módulos Node y unidades systemd. No se
encontró ese script en los dos árboles de referencia o en O; no debe asumirse que
el artículo describe la instalación vigente. El SHA instalado, topología activa,
timer efectivo, checkpoint y último chequeo exitoso quedan **pendientes de evidencia
operativa saneada**. El MCP no necesita acceso interno para consumir B.

## Fuentes y reglas de admisión existentes

[`protocol.mjs`](https://github.com/xolosArmy/xolo-oracle-indexer/blob/455aff43bd0e41cfa8a304c1b1e2045192c923ad/src/protocol.mjs)
reconoce SLP NFT1 child (`0x41`), `GENESIS`, ticker `XOLOSNFT`, cantidad una,
cero decimales, sin baton, CID decodificable, consumo de una unidad de un grupo
permitido y script de emisor observado. Los tres grupos y tres scripts permitidos
están en O; el MCP los importa desde el componente compartido, no los mantiene
como otra lista editable. El script de entrada observado no es una certificación
de identidad del criador, propietario o animal.

[`chronik.mjs`](https://github.com/xolosArmy/xolo-oracle-indexer/blob/455aff43bd0e41cfa8a304c1b1e2045192c923ad/src/chronik.mjs)
fija ancla mainnet, seis confirmaciones, límites de páginas y control de reorg.
El histórico de 125 TXID se conserva con sus slugs y evidencia esencial. Nuevas
admisiones se limitan a grupos `RMZState` y necesitan corroboración por TXID de
Explorer, título explícito de linaje o metadata Tonalli anclada válida. El snapshot
B tiene 125 inclusiones `historical_census`, cinco `explorer_txid` y una
`ipfs_anchored_lineage`. No equivale a 131 animales únicos: incluye registros
comunitarios históricos y el MCP no cambia esa población.

## Matriz de `data/lineages.json`

Productores: O `protocol.mjs`, `chronik.mjs`, `census.mjs`, `ipfs.mjs` y
`genealogy.mjs`. Consumir el archivo de B con su commit; distinguir siempre
**dato publicado por el Oráculo** de **observación propia actual**.
Los campos opcionales ausentes no se convierten en cadenas vacías o falsos.

| Campo / ruta | Origen y significado | Límite de confianza |
| --- | --- | --- |
| `txid` | Chronik, hash de la transacción génesis admitida | Identidad técnica; validar 64 hex y red |
| `tokenId` | O asigna el TXID de esa génesis NFT1 | La igualdad aquí es específica de génesis, no regla universal para toda transacción |
| `blockHeight` | `tx.block.height` en Chronik | Altura observada; vulnerable a reorganización |
| `timestamp` | `tx.block.timestamp`, segundos Unix | Fecha del bloque, no nacimiento ni fecha de registro editorial |
| `protocol` | Constante O `XOLO` | Clasificación del indexador; no bytes literales del protocolo SLP |
| `version` | Constante O `v1` | Versión de la representación censal, no prueba de nota `XOLODNA` |
| `eventType` | Constante O `reg` | Evento admitido por O; no operación que el MCP pueda ejecutar |
| `cid` | URL de génesis SLP interpretada por `parseCid` | Referencia al contenido; no demuestra disponibilidad ni JSON correcto |
| `rawOpReturnHex` | `tx.outputs[0].outputScript` | Bytes para evidencia y comparación; no ejecutarlos |
| `decodedText` | O sintetiza `SLP NFT1 \| XOLOSNFT \| <title>` | Texto de presentación; no transcripción íntegra del script |
| `onchain.groupTokenId` | `tokenEntries[].groupTokenId`, corroborado con input | Grupo SLP admitido; no relación biológica |
| `onchain.blockHash` | `tx.block.hash` | Comparar contra bloque de la cadena observada |
| `onchain.title` | Nombre SLP decodificado como UTF-8 estricto y recortado | Afirmación del emisor; no identidad biológica verificada |
| `onchain.issuerScript` | Script del input que consume una unidad del grupo permitido | Evidencia técnica de admisión; no propietario actual |
| `onchain.documentHash` | Campo hash del documento en SLP, hex o null | Ancla de SHA-256 de bytes, independiente del CID |
| `slug` | Histórico preservado o corroboración editorial; puede ser null | Alias no único ni identificador de blockchain |
| `provenance.inclusion` | `historical_census`, `explorer_txid`, `onchain_lineage_title` o `ipfs_anchored_lineage` | Motivo de inclusión; no grado global de verificación |
| `provenance.editorialCommit` | Commit de `fixtures/explorer.json`, solo cuando hay corroboración editorial de admisión | No confundir con commit de genealogía documentada |
| `provenance.metadata` | `ipfs_sha256_matches_slp` cuando O proyectó metadata validada | Afirmación de O; no observación nueva del MCP |
| `editorial.source` | Constante `xolos-explorer` cuando clasifica por TXID editorial | Etiqueta de origen, no identidad criptográfica |
| `editorial.slug` | Alias corroborado en fixture de Explorer | Puede diferir del slug histórico; conservar procedencia |
| `ipfs.cid` | Copia del CID del registro | Debe coincidir con `cid` |
| `ipfs.documentHash` | Hash de documento usado por `probe`, opcional | Campo de comparación; no es hash calculado del JSON serializado |
| `ipfs.url` | Gateway intentado o conservado de observación anterior | No tomar como URL libre a seguir; reconstruir desde gateway permitido + CID |
| `ipfs.status` | HTTP observado, opcional | HTTP 200 no implica integridad; un temporal puede conservar 200 por hash discordante |
| `ipfs.state` | `validated`, `failed`, `temporary`, `unchecked` | Estados de O definidos debajo; no verifican parentesco |
| `ipfs.ok` | `state === validated` | Integridad y estructura mínima, no verdad del contenido |
| `ipfs.reason` | Motivo opcional: `missing_document_hash`, `gateway_cooldown`, `gateway_http`, `document_hash_mismatch`, `body_too_large`, `gateway_unreachable`, `invalid_json`, `invalid_metadata`, `historical_rate_limit` | Mantener motivo y estado independientes; no inventar último instante de comprobación |
| `hasParents` | O calcula dos IDs distintos, no autorreferentes, presentes en censo, extraídos de metadata validada | Alias legado de verificación referencial, no mera presencia de nombres |
| `genealogy.documented` | Objeto reconciliado por TXID desde fixture editorial o null | No se infiere desde IPFS ni por nombres; no afirma veracidad biológica |
| `genealogy.documented.padre` | Valor textual original `padre` de ficha admitida | Puede ser nombre, alias o ID; conservarlo sin resolver por similitud |
| `genealogy.documented.madre` | Valor textual original `madre` de ficha admitida | Mismo límite; no convertir en `motherTokenId` |
| `genealogy.documented.source.repository` | Repositorio editorial fijado | En O exige `xolosArmy/xolos-explorer` |
| `genealogy.documented.source.commit` | Commit de la ficha reconciliada | En B es E; no necesariamente HEAD futuro |
| `genealogy.documented.source.path` | Ruta de la ficha | En O exige `src/data/linajeMeta.js` |
| `genealogy.documented.source.blob` | Blob Git de esa metadata | Fija contenido, no certifica los parentescos |
| `genealogy.documented.source.entry` | Clave editorial original de la ficha | Alias para localizar evidencia |
| `genealogy.documented.source.txid` | TXID de la cría utilizado en la unión | Debe coincidir con fila; no reconciliar por nombre |
| `genealogy.verified` | Copia de la regla `hasParents` | Verificación referencial del Oráculo, nunca prueba genética o certificación FCM |
| `parentTokenId` | `json.lineage.parentTokenId ?? json.parentTokenId`, solo de JSON anclado validado; normalización hex | null si ausente/inválido; nombres `padre` no satisfacen el campo |
| `motherTokenId` | Análogo desde `lineage.motherTokenId` o raíz | Ambas referencias son necesarias para `hasParents` |
| `name` | `json.name.trim()` de metadata anclada validada o null | Distinto del título on-chain y del `title` editorial |

Objetos `onchain`, `provenance`, `editorial`, `ipfs`, `genealogy`, `documented` y
`source` son contenedores de esos campos, sin autoridad adicional. El publicador
elimina `ipfs.fields`, `checkedAt`, `retryAt` y `attempts`. Por tanto B no permite
afirmar cuándo se validó individualmente un CID; tampoco permite leer salud del
timer desde `ultima_actualizacion`. O puede conservar la observación temporal
publicada previa para evitar cambios sin contenido nuevo.

`ipfs.validated` exige SHA-256 coincidente, UTF-8/JSON válido, objeto y `name` no
vacío. `failed` se reserva a bytes anclados cuyo JSON o estructura es inválida.
`temporary` incluye fallos de gateway, 404, timeout, 429, tamaño excesivo y hash
discordante. `unchecked` cubre contenido no comprobado, por ejemplo sin ancla.
Las validaciones propias del MCP conservarán esta semántica y añadirán evidencia,
sin reinterpretar `temporary` como invalidez definitiva del NFT.

## Matriz de `data/metrics.json`

Fuente de todas las fórmulas: O
[`census.mjs`](https://github.com/xolosArmy/xolo-oracle-indexer/blob/455aff43bd0e41cfa8a304c1b1e2045192c923ad/src/census.mjs).
`N` es el número de filas admitidas, `S` el número con `ipfs.ok` y `F` el número
con `ipfs.state=failed`. La consulta devuelve los valores publicados; las fórmulas
sirven para validar coherencia, no para publicar métricas alternativas.

| Campo | Fórmula / semántica | Valor B |
| --- | --- | --- |
| `linajes_registrados` | `N`; registros del censo, no animales únicos | 131 |
| `linajes_validados_ipfs` | `S`, o cero si `F=N`, o null si no hubo éxito y quedan pendientes | 123 |
| `registros_con_padre_y_madre` | Filas con `genealogy.documented != null` en el esquema actual | 30 |
| `registros_con_padre_y_madre_verificados` | Filas con `genealogy.verified=true` | 0 |
| `txs_xolo_detectadas` | `N`; no todo el tráfico XOLO ni intentos rechazados | 131 |
| `ipfs_disponibles` | Misma fórmula que `linajes_validados_ipfs`; éxito de integridad, no ping actual | 123 |
| `ipfs_fallidos` | `F`, solo fallo definitivo de contenido anclado | 0 |
| `ipfs_temporales` | Filas con estado `temporary` | 8 |
| `ipfs_no_comprobados` | Filas con estado `unchecked` | 0 |
| `nfts_con_slug_resuelto` | Filas con slug no vacío; no slugs únicos | 130 |
| `ult_registro_txid` | TXID de primera fila, orden altura descendente y TXID ascendente | Xochitl: `a58412e0…d891fa` |
| `ult_registro_slug` | Slug de esa primera fila o null | `xochitl-ramirez` |
| `ultima_actualizacion` | Fecha ISO de la versión del contenido; no avanza en chequeo sin cambios | `2026-11-14T03:30:09.319Z` |

`recent-registrations.json` es la proyección de las primeras 12 filas: `txid`,
`slug`, `tokenId`, `cid`, `nombre=name`, `timestamp`, `blockHeight`, `hasParents`,
`ipfsOk=ipfs.ok` y `genealogy`. No es un censo adicional ni una fuente independiente.

## Matriz de `src/data/linajeIndex.js`

Fuente: archivo editorial versionado en E, mantenido mediante commits de Explorer.
Su comentario `slug -> txid` no garantiza que todos los valores sean transacciones.

| Campo / exportación | Significado y origen | Tratamiento MCP |
| --- | --- | --- |
| `LINAGE_INDEX_VERSION` | Literal `2026-03-27`, etiqueta manual | No usar como fecha de frescura ni reemplazo de SHA |
| `LINAJE_SLUG_INDEX.<clave>` | Clave slug editorial y valor de referencia | 55 claves; tres valores `Draft_Token`; no todos son hex64 |
| `findLinajeTxidBySlug` | Lookup tras trim y minúsculas; retorna `''` si no encuentra | Reutilizar intención; distinguir ausencia de referencia provisional |

`bolero-ramirez`, `aztlan-ramirez` y `copal-ramirez` tienen referencias provisionales.
Nunca consultar Chronik con ellas ni marcarlas como NFTs emitidos. `Object.freeze`
es una propiedad del objeto JS, no una prueba de origen o blockchain.

## Matriz de `src/data/linajeMeta.js`

Todos los campos de esta sección son **afirmaciones editoriales locales de E**.
La fuente primaria demostrada es el commit y blob; no se acreditó el documento
primario biológico, registral o sanitario que sustenta cada afirmación. El comentario
de que OP_RETURN prevalece no convierte la ficha en evidencia on-chain.

| Campo | Semántica observada | Proyección MVP |
| --- | --- | --- |
| `LINAJE_META_VERSION` | Etiqueta manual `2026-03-27` | Solo diagnóstico de fuente, no frescura |
| Clave de `LINAJE_EDITORIAL_META`, `slug` | Alias de ficha | Exponer con origen, sin inferir unicidad global |
| `txid`, `tokenId` | Referencias editoriales de transacción/token | Validar formato y contrastar evidencia; no suponer que coinciden con censo |
| `title`, `nombreCompleto` | Nombre de presentación y nombre declarado del ejemplar | Exponer por separado del nombre IPFS/on-chain |
| `subtitle`, `narrative`, `nota`, `backgroundNote` | Narración y afirmaciones curatoriales | Omitir texto libre en MVP para minimizar datos e instrucciones incrustadas |
| `afijo` | Afijo declarado del nombre | Editorial; fuera de proyección mínima |
| `sexo`, `color`, `variedad`, `talla`, `etapa` | Atributos declarados del animal y etapa editorial | Exponer solo los solicitados en la proyección permitida; no derivar edad actual |
| `displayColor`, `displayVariedad` | Etiquetas legibles para valores normalizados | Presentación; no duplicar como hechos nuevos |
| `fechaNacimiento`, `lugarNacimiento` | Fecha y lugar declarados | Editorial; lugar fuera de proyección mínima |
| `criador` | Criador declarado; algunas fichas contienen nombres de personas | Omitir en MVP |
| `padre`, `madre` | Referencias mixtas: nombres, slugs, IDs, borradores o placeholders | Solo documental; usar reconciliación existente para genealogía del censo |
| `padreNombre`, `madreNombre` | Nombres de presentación de progenitores | No equivalen a IDs; conservar desacuerdos como conflictos |
| `registroFCM`, `fechaExpedicionPedigree` | Registro y fecha de documento declarados | Omitir en MVP; no afirmar certificación externa |
| `microchip`, `idPerroServicio` | Identificadores persistentes declarados | Omitir completamente; no devolver parcialmente ni en logs |
| `origen` | Etiqueta editorial de origen, p. ej. microchip | No prueba identidad física; omitir |
| `theme`, `accent`, `tags` | Presentación, color y etiquetas libres | Omitir; una etiqueta `on-chain` no eleva confianza |
| `explorerUrl` | Vínculo editorial | Generar enlaces propios desde IDs validados; no seguir la URL |
| `social.blog` | Vínculo a contenido narrativo | Omitir y no descargar |
| `documentosOnChain[]` | Referencias editoriales a documentos, NFT o episodios | Omitir en MVP; no confundir con árbol genealógico |
| `documentosOnChain[].tipo`, `.titulo` | Clase y título declarados | Editorial, sin efecto de confianza |
| `documentosOnChain[].txid`, `.tokenId`, `.memoTxid`, `.transferenciaTxid` | Referencias a transacciones distintas | No implican verificación de contenido, emisión ni parentesco |
| `documentosOnChain[].explorerUrl`, `.videoUrl` | Enlaces de navegación | No seguir desde el servidor |
| `documentosOnChain[].red`, `.sistema`, `.coleccion`, `.fechaRegistro` | Contexto declarado del documento | Editorial, no extraído automáticamente de Chronik |
| `documentosOnChain[].destino` | Dirección de destino declarada | Omitir; no revelar identidad o propiedad actual |
| `documentosOnChain[].estado`, `.incluye[]` | Estado y contenido atribuidos al documento | `verificado`/`transferido` son etiquetas editoriales, sin prueba propia |
| `registroDocumental.estado`, `.institucion`, `.txid` | Estado, institución y referencia de expediente declarados | Omitir; no validar institución por mera mención |
| `registroDocumental.incluyePedigreeInternacional`, `.incluyeMicrochip`, `.incluyeVacunacion`, `.incluyeDesparasitacion` | Flags curatoriales sobre contenido del expediente | Omitir; no confundir con comprobación documental o sanitaria |
| `findLinajeMetaBySlug`, `findLinajeMetaByTxid`, `resolveLinajeMeta` | Helpers de lookup; slug precede búsqueda por txid/tokenId/nftTokenId | Referencia de compatibilidad; MCP detecta conflictos en lugar de escoger primer resultado |

`nftTokenId` es un alias contemplado por el helper, no un campo encontrado en las
58 fichas inspeccionadas. Los contenedores `social`, `documentosOnChain` y
`registroDocumental` no introducen fuentes independientes. La fixture de genealogía
de O contiene 30 fichas admitidas y exclusiones justificadas; se une por TXID.

## Conflictos y límites observados

- Hay slugs repetidos en B, entre ellos `luna` (4), `onix` (3), `marcela` (2) y
  `teyolia` (2). La paginación e identidad deben apoyarse en TXID; `get_lineage`
  no puede seleccionar un registro arbitrario para un slug ambiguo.
- Los padres editoriales mezclan IDs, texto, placeholders y referencias mal
  formadas. `padreNombre`/`madreNombre` pueden discrepar de `padre`/`madre`.
  Esto se conserva como discrepancia; no se corrige ni se resuelve por similitud.
- B declara 123 IPFS validados y ocho temporales; los temporales incluyen seis
  `historical_rate_limit` y dos `gateway_unreachable`. No hubo comprobación nueva
  de esos 131 NFT durante PR-01.
- Las rutas `/linaje/`, `/token/` y `/tx/` de Explorer son vistas de presentación.
  El parser ASCII de notas de `App.jsx` pierde bytes Unicode/pushdata; O ya ofrece
  decodificación por bytes que debe compartirse.
- No existe evidencia de validación biológica o de control de animales a partir
  de estos hashes. Ninguna herramienta puede afirmar ese alcance.
