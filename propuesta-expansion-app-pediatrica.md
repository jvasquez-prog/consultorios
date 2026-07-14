# De gestor de pacientes a copiloto del consultorio pediátrico
### Propuesta de expansión funcional con IA

---

## El punto de partida

Hoy la app ya resuelve lo esencial: carga de pacientes por voz, calendario de vacunación nacional 2026 con contador de atrasos, y seguimiento de pacientes. Es una base sólida.

La pregunta que guía esta propuesta es otra: **¿qué pasaría si esta app dejara de ser un lugar donde el médico *carga* información, y empezara a ser un lugar que le *devuelve* tiempo, criterio clínico y tranquilidad?**

Para eso, pensamos la evolución en cuatro capas. Cada una construye sobre la anterior, y cada una ataca un dolor real de la práctica pediátrica diaria.

---

## Capa 1 — Copiloto Clínico
*"Que la consulta se documente sola, mientras el médico mira al paciente y no a la pantalla."*

- **Nota clínica automática (SOAP):** el médico dicta o conversa naturalmente durante la consulta, y la IA transcribe y estructura automáticamente motivo de consulta, examen físico, diagnóstico e indicaciones. Cierra la consulta con un clic, no con diez minutos de tipeo.
- **Curvas de crecimiento inteligentes:** carga de peso, talla y perímetro cefálico graficados automáticamente contra percentilos OMS/SAP, con alertas cuando un paciente se desvía de su curva histórica.
- **Checklist de desarrollo madurativo:** hitos motores, de lenguaje y sociales esperados por edad, con alertas tempranas de posible retraso.
- **Calculadora de dosis pediátrica por peso:** con chequeo automático de rangos seguros, reduciendo el margen de error humano en la prescripción.
- **Apoyo a diagnóstico diferencial:** sugerencias basadas en síntomas cargados y guías pediátricas locales — siempre como apoyo, nunca como reemplazo del criterio médico.

---

## Capa 2 — Vacunación de Próxima Generación
*"El contador de atrasos ya funciona. Ahora que la vacuna se aplique antes de que haga falta preguntar."*

- **Priorización predictiva:** la app identifica proactivamente qué pacientes entran en zona de riesgo esta semana, sin que el médico tenga que revisarlos uno por uno.
- **Recordatorios automáticos a las familias** por WhatsApp/SMS, antes de que el atraso ocurra.
- **Certificados de vacunación con QR**, autogenerados en PDF, listos para colegios o trámites.
- **Vacunación ampliada:** además del calendario oficial, sugerencia de vacunas recomendadas no incluidas (conjugadas, meningo B, etc.), como valor agregado del consultorio.

---

## Capa 3 — Canal Inteligente con las Familias
*"El mayor ladrón de tiempo de un pediatra es el WhatsApp personal a las 11 de la noche. Esta capa se lo devuelve."*

- **Portal/app para padres** con recordatorios automáticos de vacunas y controles.
- **Chatbot con IA de primera línea:** responde preguntas frecuentes (fiebre, sueño, alimentación) con criterio pediátrico validado, y **escala al médico solo lo que realmente lo necesita**.
- **Educación personalizada por edad:** mensajes automáticos tipo "tu bebé cumple 6 meses, esto es lo que viene", que refuerzan el vínculo entre consultas sin esfuerzo del médico.

---

## Capa 4 — Inteligencia del Consultorio
*"Lo que convierte una app útil en una app imprescindible: que también cuide el negocio."*

- **Dashboard de indicadores:** pacientes activos, adherencia a vacunación, consultas mensuales, tasa de ausentismo.
- **Confirmación automática de turnos** por WhatsApp, con impacto directo en la reducción de ausentismo (y por lo tanto, en los ingresos).
- **Exportación simple a facturación/obra social.**

---

## El horizonte — Funcionalidades "wow"
*Para cuando el consultorio esté listo para dar el salto disruptivo.*

- **Modo consulta 100% por voz:** el médico dicta toda la consulta y al finalizar la IA entrega nota clínica, receta e indicaciones para los padres en lenguaje simple — todo en un solo flujo, sin tocar el teclado.
- **Apoyo visual por imagen:** análisis de fotos de erupciones cutáneas comunes como apoyo diagnóstico, con disclaimer claro de que no reemplaza el diagnóstico presencial.
- **Red epidemiológica entre consultorios:** alertas locales tempranas (ej. brote de bronquiolitis en la zona), si el producto escala a múltiples consultorios.

---

## Por dónde empezar

No todas las capas tienen el mismo costo de desarrollo ni el mismo impacto inmediato. Recomendamos arrancar por lo que **más tiempo ahorra** y **más rápido se siente mágico** en el uso diario:

1. **Copiloto de consulta (nota clínica automática)** — Capa 1
2. **Recordatorios automáticos a familias** — Capas 2 y 3

Estas dos funcionalidades, combinadas, atacan los dos dolores más grandes de cualquier pediatra: el tiempo perdido documentando y el tiempo perdido respondiendo mensajes fuera de horario.

---

### Nota técnica para implementación

Este documento está pensado como brief funcional. Para la implementación técnica de cada capa (especialmente el copiloto clínico por voz y el chatbot de familias), se recomienda evaluar el uso de la API de Claude para transcripción estructurada, generación de resúmenes clínicos y respuesta conversacional con escalamiento condicional al médico.
