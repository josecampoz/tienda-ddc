# ADR-001: Monolito Modulado vs Microservicios

## Estado
Aceptado

## Contexto
Al diseñar la arquitectura de TiendaOnline-DDC, se evaluaron dos enfoques principales:
1. Arquitectura de microservicios
2. Monolito modulado

El equipo de desarrollo consiste en una sola persona, y el sistema debe ser mantenible, desplegable y operable sin sobrecarga operacional excesiva.

## Decision
Se eligió un **monolito modulado** en lugar de microservicios.

## Justificacion

### Complejidad Operacional
Los microservicios introducen complejidad significativa:
- Orquestación de contenedores (Kubernetes, Docker Swarm)
- Service discovery y load balancing
- Distributed tracing y logging centralizado
- Manejo de fallos parciales y circuit breakers
- Versionamiento de APIs entre servicios

Esta complejidad operacional es un costo que un equipo de una sola persona no puede absorber sin sacrificar la calidad del diseño.

### Modularidad Interna
El monolito modulado provee separación de responsabilidades a través de:
- Servicios con interfaces bien definidas (OrderService, ProductCatalogService, etc.)
- Capas claramente separadas (routes → services → repositories)
- Dependencias inyectables que facilitan testing
- Posibilidad futura de extraer servicios si escala el equipo

### Latencia y Consistencia
Un monolito evita:
- Latencia de red entre servicios
- Complejidad de transacciones distribuidas (saga pattern)
- Eventual consistency en operaciones críticas como pagos

## Consecuencias

### Positivas
- Deployment simple (un solo artefacto)
- Debugging directo (stack traces completos)
- Transacciones ACID nativas
- Menor costo operacional

### Negativas
- Escalado horizontal limitado (toda la aplicación escala junta)
- Si un módulo falla, puede afectar a otros
- Todas las tecnologías deben ser compatibles con Node.js

## Alternativas Consideradas
- Microservicios con Docker Compose: Rechazado por complejidad operacional
- Serverless functions: Rechazado por cold starts y límites de ejecución
- Modular monolith con mensajería: Considerado para fase 2

## Referencias
- Martin Fowler: "Monolith First"
- Sam Newman: "Building Microservices"
