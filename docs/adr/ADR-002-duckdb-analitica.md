# ADR-002: DuckDB vs Soluciones Cloud para Analítica

## Estado
Aceptado

## Contexto
El sistema requiere capacidad analítica para responder preguntas de negocio:
- ¿Cuáles productos se ven más pero se compran menos?
- ¿En qué paso del checkout se pierden más usuarios?
- ¿Qué correlación existe entre monto de orden y día de la semana?

Se evaluaron opciones:
1. BigQuery (Google Cloud)
2. Snowflake
3. Amazon Redshift
4. DuckDB (embebido)

## Decision
Se eligió **DuckDB** como motor OLAP embebido en el proceso del backend.

## Justificacion

### Costo
- BigQuery: ~$5/TB escaneado + almacenamiento
- Snowflake: Desde $2/crédito (mínimo $400/mes para uso razonable)
- Redshift: Desde $0.25/hora (~$180/mes mínimo)
- **DuckDB: $0** (open source, embebido)

Para un proyecto académico/MVP, el costo de soluciones cloud es prohibitivo.

### Capacidad
DuckDB ofrece rendimiento de nivel industrial:
- Procesa millones de filas en segundos
- Soporta SQL completo incluyendo window functions
- Columnar storage optimizado para agregaciones
- Integración nativa con JSON y Parquet

### Simplicidad Operacional
- No requiere infraestructura separada
- No hay latencia de red hacia servicio externo
- Backup es un simple archivo
- No hay configuración de VPC, IAM, etc.

### Arquitectura Dual
La separación PostgreSQL (transaccional) + DuckDB (analítico) mitiga el anti-patrón de mezclar carga OLTP y OLAP en el mismo motor:

```
[Frontend] → [Backend] → [PostgreSQL] ← Transacciones ACID
                ↓
            [DuckDB] ← Consultas analíticas complejas
```

## Consecuencias

### Positivas
- Costo cero de infraestructura analítica
- Sin dependencias externas para analítica
- Consultas SQL familiares
- Excelente rendimiento para volúmenes medianos

### Negativas
- No escala horizontalmente (single node)
- Sin capacidades de ML integradas (vs BigQuery ML)
- Requiere export manual para BI tools externos
- Límite práctico ~100GB de datos

### Mitigacion
Para escalar más allá del límite de DuckDB:
1. Exportar datos a Parquet en S3
2. Migrar a ClickHouse (también open source, distribuido)
3. O adoptar BigQuery cuando el negocio lo justifique

## Alternativas Consideradas
- SQLite: Rechazado por falta de optimización columnar
- ClickHouse: Considerado para fase 2 si se requiere escala
- TimescaleDB: Rechazado por ser extensión de PostgreSQL (mezcla OLTP/OLAP)

## Referencias
- DuckDB Documentation: https://duckdb.org/docs/
- "OLAP vs OLTP: What's the Difference?" - IBM
