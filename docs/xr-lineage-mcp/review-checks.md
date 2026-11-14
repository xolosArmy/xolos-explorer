# Comprobaciones de PR-01

Fecha de revisión: 2026-11-14. Alcance: documentación y auditoría estática de fuentes
fijadas; no se ejecutó el indexador, publicador, servidor MCP o despliegue alguno.

## Evidencia comprobada

- Se obtuvieron los HEAD remotos y se fijaron E, B y O en `source-lock.json`.
  O coincide con el checkout local limpio inspeccionado; el checkout local de
  Explorer es anterior a E y se documentó por separado.
- Se leyeron árboles completos de Explorer y Business_network. Se cotejó el
  contenido descargado de los cuatro archivos requeridos, `recent-registrations.json`
  y `App.jsx` contra sus seis blobs Git exactos. La copia temporal de inspección
  no se incluye en el PR ni se convierte en una fuente censal.
- El snapshot B tiene 131 TXID únicos, hex64, con tokenId igual al TXID de
  génesis y orden por altura descendente/TXID ascendente. Las referencias CID y
  los booleanos/estados IPFS son coherentes.
- Se contrastaron las 12 fórmulas de métricas derivadas de filas; la fecha de
  contenido se leyó como dato publicado. Se comprobó que recent es exactamente
  la proyección de las primeras 12 filas.
- Las 30 genealogías documentadas del snapshot enlazan el TXID de la fila y
  el commit/blob editorial E. Hay cero relaciones verificadas según el reporte
  del Oráculo. La fixture reconciliada de O tiene 30 entradas y 28 exclusiones.
- Se contrastó la cobertura de todos los paths observados en lineages, todas
  las claves de metrics y los nombres de propiedades estáticas de linajeMeta
  con la matriz. Las reglas del generador explican también valores/estados
  opcionales que no están presentes en B.
- Se revisaron el workflow independiente de arte, la configuración del servicio
  y timer del Oráculo, el publicador Git y la ejecución exitosa de Pages para B.
  No se infirió que una descripción histórica demuestre el runtime actual.
- Se comprobaron formato JSON del lock, SHA de 40 caracteres, enlaces locales,
  bloques de código cerrados y espacios/finales de archivo de los documentos.
  La preconsulta de publicación encontró `xolos-explorer/main` aún en E y ningún
  PR abierto que duplicase esta entrega.

## Comprobaciones deliberadamente no afirmadas

Los casos C01–C28 son requisitos para implementación, no pruebas ejecutadas de un
MCP existente. No se ejecutó build/lint del frontend porque no se cambió código
ejecutable. No se hicieron verificaciones nuevas de los 131 NFT, lecturas de redes
internas, consultas al VPS, comprobaciones del binario activo o uso de llaves.
No se instalaron dependencias. No se comprobó el contenido HTTP servido por Pages
ni su correspondencia byte a byte con el dominio público.

Los contratos de este PR son tipos y restricciones normativas de diseño; generar
y validar sus JSON Schemas y fixtures pertenece a la implementación revisada.
La revisión humana y las decisiones abiertas continúan pendientes.
