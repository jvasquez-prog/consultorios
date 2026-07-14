# Análisis de Comercialización — App de Gestión Pediátrica con IA
### Un enfoque de 360°: mercado, costos de producción, pricing y estrategia comercial

*Documento elaborado combinando cuatro lentes de análisis: investigación de mercado, ingeniería de costos en la era de la IA, estrategia de pricing y go-to-market. Cada sección responde una pregunta distinta que un inversor o vos mismo se harían antes de lanzar.*

---

## 1. Analista de Mercado — ¿Quién compra esto y cuánto vale ese mercado?

### 1.1 Tamaño del mercado objetivo

- La **Sociedad Argentina de Pediatría (SAP)** nuclea actualmente **19.160 asociados** en todo el país, organizados en 48 filiales y 9 regiones. Este es el proxy más confiable del universo de pediatras matriculados y activos en Argentina.
- No todos ejercen en consultorio propio/autónomo: una parte trabaja en relación de dependencia (hospitales públicos, clínicas, sanatorios). Los estudios disponibles muestran que **7 de cada 10 pediatras combinan dos o más lugares de trabajo** (público + privado + consultorio propio), lo que sugiere que la **mayoría tiene, en algún grado, práctica privada o consultorio propio** — aunque sea part-time.
- **Estimación conservadora del mercado direccionable (TAM funcional):** entre 8.000 y 12.000 pediatras con algún grado de consultorio privado/autónomo en Argentina. Este es tu TAM real, no los 19.160 totales.
- Si tu foco inicial es CABA + GBA (mayor densidad de consultorios privados y mejor conectividad/adopción digital), el **SAM (mercado servible)** realista para una fase de lanzamiento ronda **2.000–3.500 consultorios pediátricos**.

### 1.2 Panorama competitivo

El mercado de software de gestión médica en Argentina está poblado, pero **fragmentado y genérico** — nadie ataca la pediatría como vertical específica con IA:

| Competidor | Enfoque | Precio aprox. | Debilidad frente a tu propuesta |
|---|---|---|---|
| Turnito App | Turnos + anti-ausentismo (Mercado Pago) | Gratis (hasta 100 turnos) / ~$21.400 ARS/mes plan premium | No es clínico, no tiene vacunación ni IA |
| Medicloud | Gestión integral + recetas + HC | Planes en ARS, bot WhatsApp desde ~$150.000 ARS/mes | Genérico, no pediátrico, IA cara como add-on |
| Gendu | Agenda + recordatorios básicos | Bajo costo en ARS | Muy básico, sin clínica ni vacunación |
| Doctoralia Pro | Visibilidad + turnos | Costo elevado, cotizado en divisa dura | Orientado a marketing/captación, no a gestión clínica |
| Gestión Salud | Gestión de centros/consultorios | Suscripción, sin precio público claro | Genérico multi-especialidad, sin IA ni vacunación |
| Alephoo | HC + agenda + CRM, adaptado a normativa AR | Suscripción mensual | Generalista, no pediátrico ni con foco en vacunación |

**Conclusión clave: no existe (públicamente detectable) un competidor argentino que combine gestión pediátrica + calendario de vacunación nacional + copiloto clínico con IA en un mismo producto.** Esto es tu ventana de diferenciación — pero también significa que tenés que educar al mercado sobre por qué pagar más que un Turnito o un Gendu.

### 1.3 El comprador real

Tu comprador no es una clínica con departamento de compras: es **un pediatra autónomo, dueño de su tiempo, generalmente sobrecargado** (cargas horarias promedio de 47 hs/semana, hasta 60+ hs en 2 de cada 10 casos) y con **ingresos moderados para el esfuerzo que implica la especialidad** (pediatría está entre las peor remuneradas relativo a otras especialidades). Esto tiene una implicancia directa en pricing: **es sensible al precio, pero comprará sin dudar cualquier cosa que le devuelva horas de su semana.** El ROI que vendés no es "gestión de pacientes", es "tiempo de vida".

---

## 2. Ingeniero de Costos — ¿Cuánto cuesta producir y operar esto en la era de la IA?

### 2.1 El cambio de paradigma que mencionás es real y hay que cuantificarlo

Tenés razón en el punto de partida: **contemplar un equipo de desarrollo full-time tradicional (PM + 2-3 devs + QA + diseñador) sería sobre-dimensionar la estructura de costos** para lo que hoy se puede lograr con desarrollo asistido por IA (Claude Code y similares). Esto cambia completamente la estructura de costos fijos de un producto SaaS B2B nicho como este.

**Estructura de costos recomendada — Fase de desarrollo (MVP + Capa 1 y 2):**

| Rubro | Modelo tradicional | Modelo con IA asistida | Ahorro |
|---|---|---|---|
| Desarrollo core | 1 equipo full-time (3-4 personas, 4-6 meses) | 1-2 devs senior + IA como multiplicador (2-3 meses) | 50-65% |
| QA | Tester dedicado | QA asistido por IA + testing manual acotado | 40-60% |
| Diseño UI/UX | Diseñador dedicado | Diseño asistido (Figma + IA) con 1 revisor freelance | 50-70% |
| Documentación técnica | Analista dedicado | Generada y mantenida por IA con supervisión | 70-80% |

**Costos que NO se reducen (y hay que presupuestar completos):**

- **Validación clínica del contenido médico** (calendario de vacunación, dosis pediátricas, alertas de desarrollo): esto requiere revisión de un pediatra/farmacéutico real. No delegable a IA sin supervisión humana — es tu mayor riesgo legal y reputacional si falla.
- **Cumplimiento normativo:** manejo de historia clínica electrónica, protección de datos de pacientes (Ley 25.326 de Protección de Datos Personales en Argentina), y eventual interoperabilidad con sistemas de salud. Esto necesita asesoría legal específica, no es negociable.
- **Costo variable de IA en producción:** cada consulta transcripta, cada resumen SOAP generado, cada respuesta del chatbot a un padre, consume tokens de API. Esto es un **costo marginal por uso**, no fijo — hay que modelarlo por pediatra activo (ver 2.2).

### 2.2 Costo variable de IA por usuario (modelo aproximado)

Un pediatra promedio atiende entre 15-25 consultas por día. Si cada consulta implica:

- 1 transcripción + resumen SOAP (uso moderado-alto de tokens)
- Eventuales consultas del chatbot de padres fuera de horario (variable, puede ser el rubro de mayor volumen)
- Generación ocasional de certificados/reportes

El costo de IA por pediatra activo full-feature debería modelarse en un rango de **USD 8 a USD 25 mensuales** dependiendo de intensidad de uso, antes de aplicar margen. Esto es crítico: **tu pricing tiene que cubrir este costo variable con margen, no solo amortizar desarrollo.** Es el error más común al pasar de "app de gestión" a "app con IA generativa embebida": subestimar el costo marginal por usuario activo.

### 2.3 Implicancia estratégica

Como el desarrollo ya no requiere un equipo grande dedicado, **tu estructura de costos se corre del CAPEX de desarrollo hacia el OPEX de infraestructura de IA + soporte + validación clínica continua.** Esto es una buena noticia para el break-even (menos inversión inicial), pero mala noticia si el pricing no contempla el costo variable por uso — muchos productos con IA fracasan comercialmente no por falta de ventas, sino por vender planes fijos que no cubren un costo variable creciente con el uso.

---

## 3. Estratega de Pricing — ¿Cuánto cobrar y bajo qu

é modelo?

### 3.1 Referencias de mercado (benchmarks reales relevados)

- Software de turnos básico en Argentina: **gratis a ~$21.400 ARS/mes** (Turnito).
- Software de gestión integral con IA/WhatsApp bot: hasta **$150.000 ARS/mes** solo por el módulo de IA conversacional (Medicloud) — evidencia de que **el mercado ya está dispuesto a pagar caro específicamente por funcionalidades de IA**, cuando resuelven el dolor del ausentismo/comunicación.
- Software especializado internacional (Jane, Healthie): **USD 49-79/mes por profesional**, en mercados con mayor poder adquisitivo pero como referencia de anclaje de valor para funcionalidad clínica + IA combinada.

### 3.2 Modelo de pricing recomendado: freemium + escalones por valor, no por "features"

En vez de vender "plan básico / plan premium" por cantidad de funciones (que es como compite todo el mercado genérico), recomendamos **segmentar por el problema que resuelve cada capa**, alineado a la estructura que ya definimos:

| Plan | Incluye | Público objetivo | Precio orientativo (ARS/mes) |
|---|---|---|---|
| **Esencial** | Gestión de pacientes + calendario de vacunación + contador de atrasos | Pediatra que recién digitaliza su consultorio | $15.000 - $25.000 |
| **Copiloto Clínico** | Esencial + nota clínica automática por voz + curvas de crecimiento + calculadora de dosis | Pediatra que quiere recuperar tiempo en consulta | $35.000 - $55.000 |
| **Consultorio Inteligente** | Copiloto + recordatorios automáticos a familias + chatbot de primera línea + dashboard | Pediatra con consultorio consolidado, foco en escalar sin sumar personal | $60.000 - $90.000 |

*(Precios orientativos a valores de 2026, sujetos a ajuste por inflación — recomendamos indexar mensualmente como ya hace buena parte del mercado, o cotizar en USD con conversión al día, como hacen algunos competidores, aunque esto último genera fricción psicológica en el comprador argentino.)*

**Por qué este modelo y no "por feature":**

1. El pediatra no compra funcionalidades sueltas, compra **una promesa** ("recuperá 5 horas por semana", "nunca más un WhatsApp a las 11pm"). Empaquetar por promesa, no por checklist técnico, es lo que te permite cobrar más que Turnito sin que se sienta como sobreprecio.
2. Te da un **camino de expansión de ingresos por cliente (expansion revenue)** sin tener que salir a buscar cliente nuevo cada vez: el mismo pediatra que hoy paga el plan Esencial es tu prospecto más caliente para el Copiloto Clínico en 3-6 meses, cuando ya confía en la herramienta.

### 3.3 Sobre el costo variable de IA (conectando con la sección 2)

Cada escalón de precio tiene que "absorber" el costo variable de IA de ese nivel de uso, con margen bruto objetivo saludable para SaaS (idealmente 70-80% de margen bruto, dejando margen para soporte y validación clínica continua). Si el costo de IA por pediatra activo en el plan más completo ronda USD 15-25/mes, el precio de ese plan tiene que quedar cómodamente por encima de eso incluso en escenarios de uso intensivo — sino el crecimiento en usuarios activos erosiona margen en vez de generar escala.

---

## 4. Estratega de Go-to-Market — ¿Cómo se vende esto a un pediatra autónomo?

### 4.1 El canal más efectivo no es publicidad digital genérica

Dado que el comprador está agrupado institucionalmente (SAP, con 48 filiales regionales) y es una comunidad profesional con alta interacción entre pares, el canal de mayor ROI probablemente sea:

- **Referidos entre colegas** (un pediatra convence a otro más rápido que cualquier anuncio — la confianza profesional pesa mucho en medicina).
- **Presencia en congresos/jornadas de SAP** (el Congreso Argentino de Pediatría es el evento de mayor concentración de tu comprador ideal en un mismo lugar).
- **Contenido educativo gratuito** ligado al calendario de vacunación 2026 (ya lo tenés como funcionalidad — convertilo también en gancho de marketing: calculadora pública de vacunación como lead magnet).

### 4.2 Estrategia de entrada de precio

Recomendamos **no regalar el producto gratis indefinidamente** (a diferencia de Turnito), sino ofrecer un **trial acotado de 30-60 días con el plan Copiloto Clínico completo** — porque tu diferencial (la IA) recién se aprecia cuando el médico *siente* que le ahorra tiempo real, no en una demo. Un trial corto en el plan más básico no muestra tu verdadero valor.

### 4.3 Métrica de éxito comercial a monitorear

Para este tipo de producto, la métrica que más importa no es la cantidad de altas, sino:

- **Tasa de activación real del copiloto de voz en las primeras 2 semanas** (si el médico no lo usa en la consulta rápido, no va a valorar el upgrade).
- **Churn por fricción de uso vs. churn por precio** — son problemas distintos y requieren soluciones distintas (uno es producto, el otro es pricing).

---

## 5. Síntesis — Los tres números que definen si el negocio cierra

1. **CAC (costo de adquisición por pediatra):** con canal de referidos + congresos, debería mantenerse bajo comparado con adquisición paga pura — objetivo referencial: que el CAC se recupere en los primeros 2-3 meses de suscripción.
2. **Costo variable de IA por usuario activo:** el número que hay que vigilar mes a mes con más cuidado, porque crece con el éxito del producto (más uso = más costo). Es el que menos se parece a un SaaS tradicional.
3. **LTV (valor de vida del cliente):** un pediatra que adopta el Copiloto Clínico tiene bajísima probabilidad de volver atrás (una vez que delega la documentación de consulta a la IA, es muy difícil volver a hacerlo a mano) — esto sugiere que el foco de esfuerzo comercial debería estar en la conversión al plan intermedio más que en maximizar altas del plan básico.

---

### Nota metodológica

Las cifras de precios de competidores y tamaño de mercado provienen de fuentes públicas relevadas en julio de 2026 (SAP, comparativas de software médico en Argentina). Las estimaciones de costo de desarrollo y costo variable de IA son órdenes de magnitud razonables para este tipo de producto, no cotizaciones — se recomienda validarlas con una prueba de carga real de la API una vez definido el volumen de consultas mensuales esperado por usuario.
