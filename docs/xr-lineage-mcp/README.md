# XR-LINEAGE-MCP-01 · PR-01: arquitectura y procedencia

Propuesta para revisión, 14 de noviembre de 2026. Este PR es documental. No
implementa un servidor, no crea `xolosArmy/xolos-lineage-mcp`, no cambia el censo,
no modifica producción y no autoriza fusionar ni desplegar.

El MCP será una interfaz de consulta y verificación del Oráculo XOLO, Xolos
Explorer, Chronik e IPFS. **No constituirá otra fuente de verdad.** La admisión,
el censo y sus métricas pertenecen al Oráculo; las fichas editoriales pertenecen
a Explorer. Las comprobaciones del MCP serán observaciones fechadas con evidencia,
sin corregir, completar ni publicar registros en las fuentes.

## Documentos de revisión

- [Arquitectura, reutilización y plan por PR](architecture.md).
- [Auditoría, pipeline y matriz de procedencia](provenance.md).
- [Contrato de las cinco herramientas y estados de confianza](tools.md).
- [Amenazas, seguridad, pruebas y aceptación](security-and-acceptance.md).
- [Commits y blobs fijados](source-lock.json).

## Resultado de la auditoría

| Fuente | Commit revisado | Hallazgo |
| --- | --- | --- |
| xolos-explorer remoto | `6cc1b4ec2ed582c689c83352b0ffb8cdcd04c60f` | React/Vite; 55 entradas de índice y 58 fichas editoriales; existen borradores y afirmaciones sin prueba adjunta |
| Business_network | `a533cabbcb9a28149be75393c84e6cf68807611b` | Publicación de 131 registros, 123 IPFS validados, 8 temporales, 30 genealogías documentadas y 0 verificadas |
| xolo-oracle-indexer | `455aff43bd0e41cfa8a304c1b1e2045192c923ad` | Fuente localizada; decodificación SLP NFT1, reconciliación editorial, validación de bytes IPFS y publicador Git |
| Checkout local de Explorer | `9f927eee879057da36825a7482df5c8f6e5f4b1f` | Anterior al remoto; no se usa como versión vigente del catálogo |

Las cantidades anteriores describen esos commits, no un estado en tiempo real.
Se comprobó el código del pipeline y una ejecución exitosa de Pages asociada al
commit de datos. No se demostró el SHA instalado en el VPS, el estado de sus
timers, su checkpoint actual ni la salud del servicio. No se accedió a redes
internas, credenciales, fondos o servidores de producción.

## Decisiones que requiere la revisión

1. Aprobar o ajustar la ubicación propuesta `xolosArmy/xolos-lineage-mcp` y el
   árbol de archivos; su creación permanece pendiente de aprobación explícita.
2. Aprobar el MVP por stdio para agentes autorizados, las cinco herramientas,
   su proyección mínima y los límites de recursos.
3. Aprobar la extracción de un componente de lectura compartido en el repositorio
   del Oráculo, con licencia y exportaciones explícitas. El MCP no copiará reglas
   de admisión ni ejecutará `run`, `scan`, `cli` o `publish`.
4. Confirmar responsables y proporcionar, mediante el proceso operativo existente,
   evidencia saneada del SHA instalado, timers y último chequeo exitoso. Esta
   evidencia no requiere conectar el MCP al VPS ni exponer su estado privado.

La arquitectura está lista para revisión con esas decisiones abiertas. La
integración MVP no se considera aceptada ni desplegable mientras falte su
validación. Los criterios completos están en
[seguridad y aceptación](security-and-acceptance.md).
