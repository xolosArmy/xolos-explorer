# Contratos MCP v1 propuestos

Contrato normativo de diseño para PR-01. No hay herramientas desplegadas ni
resultados de verificación nuevos en esta entrega. PR-02 fijará la versión del
SDK/protocolo compatible con los clientes y materializará estos tipos como JSON
Schema 2020-12 con validación de entrada **y** salida. Los tipos y restricciones
de este documento forman parte conjunta del contrato; no son código ejecutable.

La exposición de `inputSchema`, `outputSchema` y `structuredContent` seguirá la
[especificación de herramientas MCP](https://modelcontextprotocol.io/specification/2025-11-25/server/tools).
Las cinco herramientas declaran `readOnlyHint=true`, `destructiveHint=false`,
`idempotentHint=true`, `openWorldHint=true`. Las anotaciones son descriptivas;
los controles de red y permisos deben imponer realmente la restricción de lectura.
Idempotencia significa ausencia de mutaciones de dominio; una fuente cambiante
puede producir una observación distinta al consultar de nuevo.

## Convenciones y tipos compartidos

Todos los objetos de entrada y salida son cerrados (`additionalProperties=false`)
salvo el mapa expresamente definido de campos permitidos. No se acepta coerción
de tipos ni propiedades duplicadas en JSON. Campos opcionales ausentes y null son
distintos. No hay argumentos de URL, gateway, ruta local, dirección, prompt, scope,
llave, firma, transacción cruda o endpoint. Una entrada rechazada no genera tráfico
de red. Máximo 4 KiB por objeto de argumentos.

```ts
type Hex64 = string;       // /^[0-9a-f]{64}$/, aceptar entrada A-F y normalizar
type GitSha = string;      // /^[0-9a-f]{40}$/
type IsoTime = string;     // UTC, ISO 8601/RFC3339, no fecha futura inventada
type Slug = string;        // 1..128 caracteres, NFC, trim, minúsculas;
                           // letras Unicode, números y guiones, sin /, %, . o espacios
type OpaqueId = string;    // 32 caracteres hex aleatorios, válido solo en sesión
type Selector =
  | { kind: 'txid'; value: Hex64 }
  | { kind: 'token_id'; value: Hex64 }
  | { kind: 'slug'; value: Slug };
type SnapshotInput = { snapshot_id?: OpaqueId };
type Membership = 'oracle_census' | 'editorial_only' | 'not_in_census';
type Basis = 'oracle_report' | 'mcp_observation' | 'none';
type Check<S> = {
  state: S;
  basis: Basis;
  checked_at: IsoTime | null;  // null cuando la fuente no publica ese instante
  evidence_ids: string[];     // IDs presentes en evidence de la misma respuesta
  reason: string | null;      // código estable documentado, no texto remoto crudo
};
type Trust = {
  blockchain: Check<'not_checked' | 'confirmed' | 'unconfirmed' |
                    'not_found' | 'conflict' | 'unavailable'>;
  ipfs: Check<'not_checked' | 'validated' | 'failed' | 'temporary' | 'unchecked'>;
  documented_genealogy: Check<'not_checked' | 'documented' | 'absent' | 'conflict'>;
  verified_genealogy: Check<'not_checked' | 'not_verified' |
                           'verified_references' | 'conflict' | 'unavailable'>;
};
type Evidence = {
  id: string;                // único, 1..64 caracteres ASCII, sin instrucciones
  kind: 'oracle_snapshot' | 'explorer_editorial' | 'chronik' | 'ipfs_bytes';
  retrieved_at: IsoTime;
  repository: string | null;  // solo repositorios permitidos
  commit: GitSha | null;
  path: string | null;        // solo rutas fijadas por adaptador
  blob: GitSha | null;
  entry: string | null;       // TXID o clave editorial validada
  endpoint: string | null;    // identificador configurado, no URL arbitraria
  content_sha256: Hex64 | null;
};
type Field = { value: string | null; evidence_ids: string[] };
type RecordView = {
  identity: { txid: Hex64 | null; token_id: Hex64 | null;
              slug: Slug | null; membership: Membership };
  fields: { name: Field; editorial_title: Field; onchain_title: Field;
            sex: Field; color: Field; variety: Field; stage: Field; birth_date: Field };
  ipfs_reference: { cid: string | null; document_hash: Hex64 | null };
  published_claims: {
    ipfs_state: 'validated' | 'failed' | 'temporary' | 'unchecked' | null;
    documented_parents: boolean | null;
    verified_parent_references: boolean | null;
  };
  trust: Trust;
};
type Context = {
  contract_version: '1.0';
  request_id: OpaqueId;
  snapshot_id: OpaqueId | null;
  oracle_commit: GitSha | null;
  explorer_commit: GitSha | null;
  retrieved_at: IsoTime;
  content_updated_at: IsoTime | null; // metrics.ultima_actualizacion
  freshness: 'fresh' | 'stale' | 'unknown'; // edad de lectura de origen; no salud del Oráculo
  publisher_health: 'unknown';      // MVP sin acceso a estado operativo privado
};
type Warning = { code: string; evidence_ids: string[] };
type Success<T> = {
  status: 'ok' | 'partial'; context: Context; data: T;
  evidence: Evidence[]; warnings: Warning[];
};
type Failure = {
  status: 'error'; context: Context;
  error: { code: ErrorCode; retryable: boolean; retry_after_seconds: number | null;
           candidates: { txid: Hex64 | null; slug: Slug | null }[] };
  evidence: Evidence[]; warnings: Warning[];
};
type Result<T> = Success<T> | Failure;
```

`Field` nunca mezcla valores: `name` procede de metadata anclada que publica el
censo, `editorial_title` de Explorer y `onchain_title` de Chronik o de la afirmación
on-chain publicada, identificada por evidencia. Los atributos `sex`, `color`,
`variety`, `stage`, `birth_date` del MVP proceden exclusivamente de la ficha
editorial vinculada por ID; si falta, null. No copiar `attributes[]` o `lineage`
arbitrarios de IPFS. Fechas y atributos son afirmaciones, no hechos biológicos
verificados. Hasta 256 caracteres por valor; si excede, null y warning
`FIELD_TOO_LARGE`, sin truncar una identidad. Todo campo no nulo debe tener evidencia.

`Evidence` apunta a la fuente verificable; no incluye el documento completo,
microchips, nombres de criadores, direcciones, tokens de acceso ni respuestas
remotas de error. CID se parsea con el componente existente, máximo 128 caracteres,
sin path/IPNS. Los enlaces navegables se derivan de repositorio/SHA/ruta/ID válidos.

## Estados independientes y reglas de elevación

| Eje | Qué significa el estado positivo | Qué no demuestra |
| --- | --- | --- |
| `blockchain=confirmed` | Observación propia: ancla mainnet válida, génesis NFT1 válida según componente compartido, bloque en cadena observada y al menos seis confirmaciones | Identidad física, permanencia frente a reorg, propiedad actual, prueba SPV autónoma o consenso independiente del endpoint Chronik |
| `ipfs=validated` | Bytes recuperados cuyo SHA-256 coincide con el hash SLP corroborado y que cumplen UTF-8/JSON y estructura mínima del Oráculo | Veracidad del JSON, disponibilidad futura, pedigree, integridad de imágenes o validación completa del DAG/CID |
| `documented_genealogy=documented` | Declaración de dos progenitores con procedencia editorial reconciliada por TXID | IDs de progenitores correctos, enlace on-chain o parentesco biológico |
| `verified_genealogy=verified_references` | Dos IDs explícitos de metadata anclada, distintos entre sí y de la cría, presentes en el censo según regla existente del Oráculo | ADN, certificación de asociación canina, identidad del animal o verificación recursiva de todos los ancestros |

La base y fecha forman parte obligatoria de cada eje. Un estado con
`basis=oracle_report` solo reproduce lo publicado; no es una comprobación nueva
del MCP. Para `blockchain=confirmed` se exige `basis=mcp_observation`; las consultas
de catálogo devuelven ese eje `not_checked`. `checked_at=null` en afirmaciones
cuyo instante individual no publica el Oráculo. No sustituirlo por la fecha de
recuperación, del commit o del bloque.

Consultar un snapshot puede informar `ipfs=validated` con base `oracle_report` y
evidencia de la fila; `verify_nft` lo sustituye en ese eje por su nueva observación,
conservando el estado original en `published_claims`. Si el gateway falla hoy,
la respuesta muestra `temporary/mcp_observation` aunque la publicación diga
`validated`. No reescribe la fuente ni afirma que el NFT sea inválido.

Una verificación fallida no eleva otro eje: IPFS válido no verifica genealogía;
nombres de padres no prueban IDs; un NFT1 válido fuera del censo no pertenece
automáticamente al Oráculo. No usar `hasParents` sin esquema conocido ni interpretar
`estado='verificado'` de una ficha como prueba. Si la referencia editorial no se
puede corroborar, documentar `not_checked`/conflicto; no elevar por disponibilidad.

El hash SHA-256 anclado y el CID son compromisos distintos. El MVP comprobará el
primero y declarará `cid_dag_verified=false`; verificar un DAG requiere un cliente
IPLD/CAR y políticas adicionales, fuera del MVP. Véanse la documentación de
[CIDs](https://docs.ipfs.tech/concepts/content-addressing/) y la
[especificación de gateways verificables](https://specs.ipfs.tech/http-gateways/trustless-gateway/).

## `list_lineages`

Scope conceptual: `lineage:read`. Consulta **solo** filas del censo publicado.

```ts
type ListInput = SnapshotInput & {
  limit?: number;             // entero 1..50, default 20
  cursor?: OpaqueId;          // ligado a snapshot/filtros/sesión
  ipfs_state?: 'validated' | 'failed' | 'temporary' | 'unchecked';
  genealogy?: 'documented' | 'verified_references';
};
type ListData = { items: RecordView[]; next_cursor: OpaqueId | null };
// Resultado: Result<ListData>
```

Filtros se aplican a las afirmaciones del snapshot; `documented` exige objeto
reconciliado no null y `verified_references` exige el booleano del esquema conocido.
No realizan red para verificar cada fila. Orden estable del Oráculo: altura
descendente, TXID ascendente. El cursor conserva filtros, límite y snapshot;
argumentos incompatibles producen `INVALID_CURSOR`. No se devuelve un total
alternativo censal. Una página legítimamente vacía es éxito; un fallo de fuente
no se presenta como página vacía.

Ejemplo de entrada: `{"limit":20,"genealogy":"documented"}`.

## `get_lineage`

Scope: `lineage:read`. Recupera registro y ficha, sin verificación de red puntual.

```ts
type GetInput = SnapshotInput & { selector: Selector };
type GetData = { record: RecordView };
// Resultado: Result<GetData>
```

Primero buscar en censo. Explorer añade contexto por ID demostrado, conservando
fuentes. Una ficha ajena al censo retorna `editorial_only` con advertencia
`NOT_IN_ORACLE_CENSUS`; no se añade a `list_lineages` ni a métricas. Una ficha
provisional puede tener `txid=null`, `token_id=null`, ejes sin comprobar y warning
`DRAFT_REFERENCE`; jamás se envía su `Draft_Token` a Chronik. No se expone ese
texto como si fuese un token válido.

Slug con múltiples candidatos devuelve `AMBIGUOUS_ID` y hasta 50 candidatos
paginables mediante `list_lineages`/selector por TXID; si son más, warning
`CANDIDATES_LIMITED`. Un desacuerdo de identidad entre censo y editorial produce
`SOURCE_CONFLICT`; nunca prevalencia silenciosa de la ficha. Cero coincidencias
comprobadas en fuentes disponibles da `NOT_FOUND`. Fuente faltante necesaria para
resolver da `UPSTREAM_UNAVAILABLE`, no ausencia demostrada.

Ejemplo: `{"selector":{"kind":"slug","value":"xochitl-ramirez"}}`.

## `get_census`

Scope: `lineage:read`. Sin filtros poblacionales ni recomputación de autoridad.

```ts
type CensusInput = SnapshotInput; // {} consulta último snapshot disponible
type CensusData = {
  metrics: {
    linajes_registrados: number;
    linajes_validados_ipfs: number | null;
    registros_con_padre_y_madre: number;
    registros_con_padre_y_madre_verificados: number;
    txs_xolo_detectadas: number;
    ipfs_disponibles: number | null;
    ipfs_fallidos: number;
    ipfs_temporales: number;
    ipfs_no_comprobados: number;
    nfts_con_slug_resuelto: number;
    ult_registro_txid: Hex64 | null;
    ult_registro_slug: Slug | null;
    ultima_actualizacion: IsoTime;
  };
  consistency: 'passed'; // comprobaciones compartidas; si fallan no hay éxito
};
// Resultado: Result<CensusData>
```

Contadores: enteros seguros >=0. Mantener null según semántica publicada. Validar
que los tres JSON pertenecen al mismo commit y son coherentes. Esquema desconocido
o métricas incongruentes dan error; no recalcular un conjunto para ocultarlo.
La fecha de contenido puede ser antigua por ausencia de cambios. Su antigüedad
no permite asegurar que el publicador esté caído o sano.

## `verify_nft`

Scope conceptual: `lineage:verify` más `lineage:read`. Solo un ID hex64, sin URL.

```ts
type VerifyInput = SnapshotInput & { token_id: Hex64 };
type VerifyData = {
  record: RecordView;
  chain: {
    network: 'ecash-mainnet'; tip_height: number | null; tip_hash: Hex64 | null;
    block_height: number | null; block_hash: Hex64 | null;
    confirmations: number | null; required_confirmations: 6;
    group_token_id: Hex64 | null;
    raw_script_sha256: Hex64 | null;
  };
  document: {
    cid: string | null; expected_sha256: Hex64 | null;
    computed_sha256: Hex64 | null; byte_length: number | null;
    hash_matches: boolean | null; metadata_valid: boolean | null;
    cid_dag_verified: false;
  };
};
// Resultado: Result<VerifyData>
```

Secuencia: resolver snapshot → consultar ancla/punta/tx/token/bloque del ID con
cliente compartido → comprobar tipo, génesis, grupo/input/emisor, script y bloque
→ calcular confirmaciones → recuperar el CID corroborado con gateways permitidos
→ hash sobre bytes exactos → JSON estricto y estructura mínima. Releer el bloque
o punta dentro del presupuesto para detectar cambios. Una reorganización durante
la consulta produce conflicto, nunca `confirmed`. No consultar IPFS si no se ha
corroborado su referencia on-chain; con menos de seis confirmaciones puede quedar
`unconfirmed` y realizar la comprobación documental, sin promover blockchain.

Datos de [Chronik](https://github.com/Bitcoin-ABC/bitcoin-abc/blob/master/chronik/chronik-proto/proto/chronik.proto)
son evidencia de un indexador público confiado. El MVP no implementa verificación
SPV ni un nodo completo. `not_found` significa que ese endpoint no encontró el ID
en ese instante; no inexistencia universal. Un tipo de token no admitido o contenido
con hash discordante es un resultado de comprobación, no un error de protocolo.
Conservar razón `unsupported_token`, `document_hash_mismatch`, etc.

Un NFT fuera del censo se puede inspeccionar puntualmente con
`membership=not_in_census`; esto no autoriza admisión ni descubrimiento masivo.
Un ID no NFT1 queda `blockchain=conflict` con motivo `unsupported_token`.
Timeout parcial devuelve `status=partial` con ejes afectados `unavailable` o
`temporary`. No completar con un resultado previo ocultando su fecha.

Genealogía conserva la afirmación del Oráculo con `basis=oracle_report`; esta
herramienta no revalida toda la red de ancestros. No hay flag global `is_verified`.

## `get_genealogy`

Scope: `lineage:read`. Proyección temporal del grafo que ya documentan las fuentes.

```ts
type GenealogyInput = SnapshotInput & {
  selector: Selector;
  depth?: number;             // entero 1..3, default 1
  relation?: 'documented' | 'verified_references'; // default documented
};
type Node = { node_id: string; txid: Hex64 | null; slug: Slug | null;
              name: string | null; evidence_ids: string[] };
type Edge = {
  child_node_id: string; parent_node_id: string | null;
  role: 'father' | 'mother';
  reference: string;          // texto original permitido o ID explícito
  resolution: 'explicit_id' | 'documented_label' | 'unresolved' | 'cycle';
  trust: Trust; evidence_ids: string[];
};
type GenealogyData = { root_node_id: string; nodes: Node[]; edges: Edge[];
                       depth_reached: number; truncated: boolean };
// Resultado: Result<GenealogyData>
```

En modo `documented`, usar `genealogy.documented` reconciliado del censo. Para una
ficha `editorial_only`, mostrar solo los valores explícitos de esa ficha con base
editorial y advertencia; no producir un árbol censal alternativo. Nombres o slugs
de progenitores se muestran como `documented_label`, sin unión inferida. Un ID
literal hex64 puede resolver identidad en el snapshot pero sigue siendo una
arista documental; no aumenta `verified_genealogy`.

En modo `verified_references`, usar únicamente IDs y la regla verificada publicada
por O en un esquema conocido. Si no hay relaciones, devolver raíz y aristas
vacías, no error. Cada nodo solo se expande una vez; detectar ciclos, padre/madre
iguales, referencias a la propia cría y faltantes. Un ciclo devuelve `cycle`,
`status=partial` y warning; nunca recursión infinita o certificación genealógica.
La marca de O se conserva como reporte, pero el eje propio afectado pasa a
conflicto si se detecta una contradicción estructural.

En cada arista, blockchain e IPFS describen el anclaje del registro de la cría;
no afirman que se haya verificado en red a los progenitores o a todos sus ancestros.

Máximo 31 nodos, 30 aristas y profundidad 3. Alcanzar presupuesto devuelve
`truncated=true` con warning `GRAPH_LIMIT`; alcanzar la profundidad solicitada
también se señala si quedan referencias sin expandir. El grafo es una proyección
de la consulta, se descarta al terminar y no es una base genealógica mantenida.

## Errores y compatibilidad

```ts
type ErrorCode =
  | 'NOT_FOUND' | 'AMBIGUOUS_ID' | 'SOURCE_CONFLICT'
  | 'SOURCE_SCHEMA_UNSUPPORTED' | 'SOURCE_INCONSISTENT'
  | 'UPSTREAM_UNAVAILABLE' | 'INVALID_CURSOR' | 'CURSOR_EXPIRED'
  | 'SNAPSHOT_EXPIRED' | 'LIMIT_EXCEEDED' | 'RATE_LIMITED'
  | 'FORBIDDEN' | 'INTERNAL_ERROR';
```

Tool desconocida o argumentos inválidos: error JSON-RPC MCP (sin hacer fetch).
Fallos de dominio/origen: `Failure` en `structuredContent`, `isError=true`; no
incluir traces, tokens o cuerpos de error remotos. Un resultado negativo de
verificación puede ser éxito `isError=false`; el estado y razón explican lo
observado. `partial` no oculta ejes pendientes y usa `isError=false`.
`RATE_LIMITED` incluye segundos acotados de reintento; `FORBIDDEN` no revela
existencia de registros o configuración interna. Antes de transportar HTTP, los
errores de autorización seguirán también el contrato de ese transporte.

Cada respuesta incluye `content` de texto que serializa el mismo resultado
saneado y `structuredContent` conforme a `outputSchema`. No duplicar documentos
upstream completos. Cambiar el significado de un estado, la semántica poblacional
o los tipos requiere nueva versión mayor del contrato y revisión de procedencia.
