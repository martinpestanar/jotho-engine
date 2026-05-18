export interface VerificationCriteria {
  keywords: string[];
  forbiddenKeywords?: string[];
  minLength?: number;
}

export interface WeekLesson {
  weekNum: number;
  title: string;
  theory: string;
  template: string;
  expectedType: "json" | "python" | "text";
  verificationCriteria: VerificationCriteria;
  isExam?: "parcial1" | "parcial2" | "final";
}

export interface Course {
  code: string;
  title: string;
  semester: number;
  description: string;
  rewardPKD: number;
  weeks: WeekLesson[];
  
  // Backwards compatibility fields (mapped to Week 1)
  expectedType: "json" | "python" | "text";
  theory: string;
  template: string;
  verificationCriteria: VerificationCriteria;
}

// Dynamic topic generator helper to give a realistic feel to all 16 weeks of all 32 courses
function getWeekTopic(code: string, weekNum: number): string {
  const topics: Record<string, string[]> = {
    "MAP-1": [
      "Introducción al Mapeo de Procesos y Descubrimiento Socrático",
      "Modelado de Negocios en BPMN 2.0 y Carriles (Lanes)",
      "Diagramación de Eventos de Inicio, Fin e Intermedios",
      "Toma de Decisiones Lógicas y Flujos de Mensajería",
      "Subprocesos y Modularización de Actividades Caóticas",
      "EXAMEN PARCIAL I", // Week 6
      "Identificación de Cuellos de Botella Reales y Fricciones",
      "Metodología de Entrevistas Socráticas con Operadores",
      "Definición de SLAs y KPIs de Rendimiento Operativo",
      "Normalización de Formatos de Entrada de Negocio",
      "Diagramación de Integración de APIs en Flujos",
      "EXAMEN PARCIAL II", // Week 12
      "Simulación de Volumen y Estrés de Procesos Corporativos",
      "Preparación de Presentaciones Ejecutivas de Proyectos",
      "Auditoría Previa de Integridad de Procesos",
      "EXAMEN FINAL" // Week 16
    ],
    "MAP-2": [
      "Introducción a la Orquestación Enterprise y n8n",
      "Servidores VPS y Despliegue con Docker Compose",
      "Conexiones de Redes Virtuales y Redirección de Puertos",
      "Modularización de Flujos mediante Subworkflows",
      "Control de Errores y Notificaciones Críticas",
      "EXAMEN PARCIAL I",
      "Webhooks Base y Gestión de Cargas Útiles (Payloads)",
      "Database Webhooks de Supabase en Tiempo Real",
      "JavaScript Avanzado en Nodos de Código (Code Node)",
      "Procesamiento de Archivos Binarios y Buffer en Memoria",
      "Peticiones HTTP Dinámicas con Paginación y Headers",
      "EXAMEN PARCIAL II",
      "Seguridad de Credenciales y Manejo de Secrets",
      "Versionado de Flujos y Git para Integraciones",
      "Optimización de CPU y Consumo de Memoria en VPS",
      "EXAMEN FINAL"
    ],
    "MAP-3": [
      "Introducción a la Programación Defensiva en Python",
      "Estructuras de Control y Manejo de Tipado Estricto",
      "Captura de Excepciones (Try/Except) en Producción",
      "Entornos Virtuales de Desarrollo y Pipenv/Poetry",
      "FastAPI: Creación de Endpoints REST Ultra-rápidos",
      "EXAMEN PARCIAL I",
      "Modelado y Validación de Datos de Entrada con Pydantic",
      "Playwright: Automatización Navegador Headless",
      "Evasión de Bloqueos en Páginas Web Dinámicas",
      "Extracción de Datos Estructurados mediante selectores CSS",
      "Manejo de Cookies y Almacenamiento de Sesiones",
      "EXAMEN PARCIAL II",
      "Inyección de Dependencias y Seguridad en APIs FastAPI",
      "Manejo de Tareas Asíncronas en Segundo Plano (Celery)",
      "Mapeadores de Datos (ORMs) y Conexión SQL en Python",
      "EXAMEN FINAL"
    ],
    "MAP-4": [
      "Data Science Aplicado: Introducción a Pandas y DataFrames",
      "Limpieza y Depuración de Datos Inconsistentes en Pandas",
      "Transformación y Unión (Merge) de Tablas Financieras",
      "ETL Completo: Carga a PostgreSQL desde DataFrames",
      "Seguridad de Endpoints: Webhooks y Autenticación",
      "EXAMEN PARCIAL I",
      "Criptografía en Tránsito: Firmas HMAC SHA-256",
      "OAuth 2.0: Ciclos de Vida y Conexiones Seguras",
      "Manejo Automatizado de Refresh Tokens en Azure/Google",
      "Introducción a Scrum y Metodologías Ágiles",
      "Control de Versiones: Git Workflow Profesional en Equipo",
      "EXAMEN PARCIAL II",
      "Herramientas de Colaboración: Notion & Jira para Ingenieros",
      "Integridad Referencial Avanzada en la Base de Datos",
      "Planificación de Sprints y Estimación en Story Points",
      "EXAMEN FINAL"
    ],
    "MAP-5": [
      "Ingeniería de Prompts Científica y Casos de Uso Reales",
      "System Prompts Avanzados y Control de Salidas JSON",
      "Few-Shot Prompting: Curación de Ejemplos de Entrada/Salida",
      "Chain of Thought (Cadena de Pensamiento) para Lógica Compleja",
      "PGVector: Extensiones Vectoriales en Supabase",
      "EXAMEN PARCIAL I",
      "Cálculo de Embeddings Matemáticos con Modelos OpenAI",
      "Búsqueda Semántica Basada en Distancia Coseno",
      "Políticas de row-level security (RLS) en Supabase",
      "Cumplimiento SOC 2 y GDPR en Tratamiento de Datos",
      "Testing Unitario Automatizado en Python con Pytest",
      "EXAMEN PARCIAL II",
      "Pruebas de Integración y Mocking de APIs de Terceros",
      "Monitoreo de Costos e Historial de Tokens de IA",
      "Auditoría de Inyecciones de Prompts en Producción",
      "EXAMEN FINAL"
    ],
    "MAP-6": [
      "Introducción a los Agentes Cognitivos e IA Agente",
      "LangGraph: Modelado de Grafos de Estado Deterministas",
      "Nodos y Bordes Condicionales en Agentes Multi-IA",
      "Persistencia de Conversación y Manejo de Sesiones",
      "Function Calling: Bindear Herramientas de Python a LLMs",
      "EXAMEN PARCIAL I",
      "Manejo de Respuestas de Error de Herramientas Dinámicas",
      "CrewAI: Orquestación de Agentes con Roles Especializados",
      "Autogen: Conversación entre Agentes de Inteligencia",
      "Seguridad en la Ejecución de Código Dinámico de LLMs",
      "Optimización de Prompts del Agente para Reducción de Latencia",
      "EXAMEN PARCIAL II",
      "Casos de Uso Corporativos de Agentes Multi-IA",
      "Sincronización de Base de Datos con Decisiones del Agente",
      "Monitoreo de Ejecuciones y Trazabilidad en LangSmith",
      "EXAMEN FINAL"
    ],
    "MAP-7": [
      "Arquitecturas RAG Avanzadas: GraphRAG y sus Ventajas",
      "Construcción de Grafos de Conocimiento en Base de Datos",
      "Indexación Semántica Multimodal de Documentos",
      "Stealth Scraping: Evasión Avanzada de Cloudflare y Captchas",
      "Rotación de Proxies Residenciales y User-Agents",
      "EXAMEN PARCIAL I",
      "Servicios Serverless en AWS: Lambda y API Gateway",
      "Despliegue y Orquestación en la Nube con GCP",
      "Optimización y Caching de Embeddings para Ahorro de Costos",
      "Políticas OWASP para Aplicaciones Basadas en LLMs",
      "Arquitectura de Datos Sin Servidores (Serverless DB)",
      "EXAMEN PARCIAL II",
      "Análisis Estático de Código para Detección de Vulnerabilidades",
      "Balanceo de Carga y Auto-escalado de Microservicios",
      "Resiliencia y Circuit Breakers en Automatizaciones de Alta Carga",
      "EXAMEN FINAL"
    ],
    "MAP-8": [
      "Planificación del Proyecto Capstone Enterprise",
      "Mapeo Completo y Entrevistas del Caso Real",
      "Diseño de la Base de Datos Relacional y RLS Seguro",
      "Orquestación en n8n e Integración con FastAPI",
      "Ecosistema Agente Basado en LangGraph",
      "EXAMEN PARCIAL I",
      "Pruebas Integradas y Verificación Completa de la Solución",
      "Marca Personal de Élite: Optimización de LinkedIn",
      "Portafolio en GitHub de Alto Nivel para Venta Consultiva",
      "Redacción de Contratos Freelance Internacionales y NDAs",
      "Cobros e Impuestos Internacionales (Wise/Deel/Stripe)",
      "EXAMEN PARCIAL II",
      "Venta Consultiva de Alto Ticket y Negociación Socrática",
      "Cierre de Negocios y Retenedores Mensuales (Retainers)",
      "Liderazgo Técnico (Tech Lead) e Habilidades Blandas",
      "EXAMEN FINAL"
    ],
    "ENG-": [
      "Technical Vocabulary I: Systems & APIs",
      "Daily Standups: Explaining Tasks and Roadblocks",
      "Technical Email Drafting and Status Reports",
      "Documenting Technical Specs and README Files",
      "Professional Presentations: Expressing Architecture",
      "EXAMEN PARCIAL I",
      "Proposal Writing: Explaining Value to Non-Technical Clients",
      "Client Discovery Calls: Asking Questions In English",
      "Negotiating Deadlines and Deliverables Ethically",
      "Technical Documentation: System Design Blueprints",
      "Pitching Solutions Dynamically to Technical Teams",
      "EXAMEN PARCIAL II",
      "Contract Negotiation: Term Sheets & IP Rights",
      "Handling Challenging Client Feedback Professionally",
      "Active Listening in Cross-Cultural Remote Teams",
      "EXAMEN FINAL"
    ]
  };

  const prefix = code.substring(0, 5); // e.g. "MAP-1"
  const matchedKey = Object.keys(topics).find(key => prefix.startsWith(key) || code.startsWith(key)) || "ENG-";
  const topicList = topics[matchedKey];
  return topicList[weekNum - 1] || `Tópico Avanzado de la Semana ${weekNum}`;
}

const BASE_COURSES = [
  // Semestre 1
  {
    code: "MAP-101",
    title: "Consultoría Socrática e Ingeniería de Procesos",
    semester: 1,
    description: "Mapea procesos caóticos de negocio usando BPMN 2.0 y descubre cuellos de botella reales.",
    expectedType: "text" as const,
    rewardPKD: 500,
    baseTemplate: `--- DIAGRAMA DE PROCESOS BPMN 2.0 ---\n[Cliente] -> Solicita Cotización\n[Vendedor] -> Revisa Inventario\n[Vendedor] -> Envía Cotización\n...`,
    baseTheory: `La automatización de procesos de negocio comienza siempre con la consultoría. Antes de escribir una sola línea de código o crear un nodo en n8n, debes entender cómo fluyen los datos y los procesos de la empresa en la realidad.\n\n#### 📊 Diagramación en BPMN 2.0\nEl estándar internacional **BPMN 2.0** te permite crear mapas visuales estructurados.\n- **Lanes (Carriles)**: Representan quién realiza cada actividad.\n- **Events (Eventos)**: Indican el inicio, interrupciones o finalización.\n- **Tasks (Tareas)**: Las acciones individuales realizadas.\n\n#### 🛠️ Reto del Auditor:\nDescribe en formato de texto un diagrama de procesos BPMN básico de negocio que contenga los carriles de Cliente y Vendedor, usando el estándar de flechas \`->\` para describir el flujo de una cotización de forma lógica.`,
    baseCriteria: {
      keywords: ["BPMN", "Cliente", "Vendedor", "Cotización", "Inventario"],
      minLength: 50
    }
  },
  {
    code: "MAP-102",
    title: "Arquitectura del Cerebro de Datos e Integridad Referencial",
    semester: 1,
    description: "Diseña bases de datos relacionales robustas en Supabase/PostgreSQL eliminando Excel.",
    expectedType: "text" as const,
    rewardPKD: 500,
    baseTemplate: `CREATE TABLE clientes (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    nombre TEXT NOT NULL\n);\n\nCREATE TABLE pedidos (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    cliente_id UUID REFERENCES clientes(id)\n);`,
    baseTheory: `Las hojas de cálculo de Excel no son bases de datos para automatizaciones a nivel empresarial. Un sistema robusto requiere integridad referencial y un diseño relacional sólido en PostgreSQL.\n\n#### 🗄️ Relaciones y Claves en PostgreSQL\n- **PRIMARY KEY**: Identificador único.\n- **FOREIGN KEY**: Columna que referencia a la clave primaria de otra tabla.\n\n#### 🛠️ Reto del Auditor:\nEscribe un script SQL básico para crear dos tablas relacionadas (\`clientes\` y \`pedidos\`), definiendo claves primarias, claves foráneas y restricciones de no nulo.`,
    baseCriteria: {
      keywords: ["CREATE TABLE", "PRIMARY KEY", "FOREIGN KEY", "REFERENCES", "clientes", "pedidos"],
      minLength: 80
    }
  },
  {
    code: "MAP-103",
    title: "Ingeniería Financiera y Modelos de ROI",
    semester: 1,
    description: "Aprende a formular y justificar el retorno financiero exacto de tus automatizaciones.",
    expectedType: "text" as const,
    rewardPKD: 500,
    baseTemplate: `--- PROPUESTA COMERCIAL Y CÁLCULO DE ROI ---\nAhorro mensual de horas: X horas\nCosto por hora-hombre: $Y USD\nAhorro bruto mensual: $Z USD\nRetorno de inversión (ROI) estimado: %`,
    baseTheory: `Un consultor de automatización de élite no vende "software"; vende **tiempo, reducción de errores y retorno financiero**. Debes saber justificar tus tarifas cobrando según el valor real generado.\n\n#### 🛠️ Reto del Auditor:\nRedacta una propuesta financiera simple justificando el retorno de inversión mensual estimado para un cliente basándote en horas de trabajo ahorradas.`,
    baseCriteria: {
      keywords: ["ROI", "Ahorro", "horas", "Costo", "mensual"],
      minLength: 50
    }
  },
  {
    code: "ENG-101",
    title: "Inglés Técnico I: Vocabulario de Sistemas",
    semester: 1,
    description: "Domina la jerga técnica global en inglés para expresarte en llamadas corporativas.",
    expectedType: "text" as const,
    rewardPKD: 500,
    baseTemplate: `Dear client,\nI have reviewed the system requirements. The API integration requires a POST request with...`,
    baseTheory: `Hablar inglés no es opcional. Debes conocer y dominar el vocabulario específico que se maneja a diario en la industria tecnológica.\n\n#### 🛠️ Reto del Auditor:\nEscribe un correo electrónico formal en inglés técnico dirigido a un cliente, explicando que estás revisando los requerimientos de la integración de su API.`,
    baseCriteria: {
      keywords: ["Dear client", "API", "POST", "integration", "requirements"],
      minLength: 50
    }
  },
  // Semestre 2
  {
    code: "MAP-201",
    title: "Orquestación de Ecosistemas con n8n Enterprise",
    semester: 2,
    description: "Domina n8n a nivel avanzado: JavaScript en nodos, subworkflows y manejo de errores.",
    expectedType: "json" as const,
    rewardPKD: 500,
    baseTemplate: `{\n  "nodes": [\n    {\n      "parameters": {},\n      "id": "1",\n      "name": "When clicking Execute Workflow",\n      "type": "n8n-nodes-base.manualTrigger",\n      "typeVersion": 1\n    }\n  ]\n}`,
    baseTheory: `n8n es el sistema nervioso de tus automatizaciones. En este curso aprenderás a usarlo como un arquitecto enterprise.\n\n#### 🛠️ Reto del Auditor:\nPega un JSON de flujo válido de n8n que contenga al menos un nodo de tipo \`n8n-nodes-base.manualTrigger\` u otro nodo válido, simulando un flujo inicial de orquestación.`,
    baseCriteria: {
      keywords: ["nodes", "n8n-nodes-base.manualTrigger"],
      minLength: 30
    }
  },
  {
    code: "MAP-202",
    title: "Eventos Reactivos y Webhooks de Base de Datos",
    semester: 2,
    description: "Conecta Supabase Webhooks directos a n8n para automatizaciones instantáneas en base de datos.",
    expectedType: "json" as const,
    rewardPKD: 500,
    baseTemplate: `{\n  "nodes": [\n    {\n      "parameters": {\n        "path": "supabase-webhook-event"\n      },\n      "id": "w1",\n      "name": "Webhook Trigger",\n      "type": "n8n-nodes-base.webhook",\n      "typeVersion": 1\n    }\n  ]\n}`,
    baseTheory: `Hacer encuestas constantes (polling) a una base de datos es ineficiente. La arquitectura moderna es **reactiva** basada en eventos.\n\n#### 🛠️ Reto del Auditor:\nEnvía un JSON de flujo de n8n que configure un nodo Trigger de tipo \`n8n-nodes-base.webhook\` listo para recibir los payloads automáticos de Supabase.`,
    baseCriteria: {
      keywords: ["nodes", "n8n-nodes-base.webhook", "path"],
      minLength: 30
    }
  },
  {
    code: "MAP-203",
    title: "DevOps Práctico y Servidores VPS con Docker",
    semester: 2,
    description: "Levanta tu propio servidor ilimitado de n8n en Linux usando Docker Compose.",
    expectedType: "text" as const,
    rewardPKD: 500,
    baseTemplate: `version: '3.8'\nservices:\n  n8n:\n    image: docker.n8n.io/n8nio/n8n\n    ports:\n      - 5678:5678\n    volumes:\n      - n8n_data:/home/node/.n8n\n...`,
    baseTheory: `La verdadera libertad y control residen en levantar tu propia infraestructura auto-hospedada.\n\n#### 🛠️ Reto del Auditor:\nEscribe un fragmento YAML de un archivo docker-compose.yml básico para levantar un servicio de n8n utilizando su imagen oficial y configurando puertos y volúmenes.`,
    baseCriteria: {
      keywords: ["version", "services", "n8n", "docker", "image", "ports"],
      minLength: 60
    }
  },
  {
    code: "ENG-201",
    title: "Inglés Técnico II: Redacción de Propuestas",
    semester: 2,
    description: "Aprende a redactar propuestas comerciales y especificaciones técnicas claras en inglés.",
    expectedType: "text" as const,
    rewardPKD: 500,
    baseTemplate: `### Project Proposal: Workflow Automation\n1. Project Overview\n2. Deliverables\n3. Budget and Pricing...`,
    baseTheory: `Tus habilidades técnicas pierden su valor si no puedes comunicarlas de forma persuasiva y profesional a nivel de negocios.\n\n#### 🛠️ Reto del Auditor:\nEscribe en inglés un bosquejo simple de propuesta de automatización que contenga secciones para Overview, Deliverables y Budget.`,
    baseCriteria: {
      keywords: ["Proposal", "Overview", "Deliverables", "Budget", "Pricing"],
      minLength: 60
    }
  },
  // Semestre 3
  {
    code: "MAP-301",
    title: "Programación Defensiva y Algoritmia con Python",
    semester: 3,
    description: "Escribe scripts estructurados en Python inmunes a caídas accidentales.",
    expectedType: "python" as const,
    rewardPKD: 500,
    baseTemplate: `import json\n\ndef procesar_datos(raw_json):\n    try:\n        datos = json.loads(raw_json)\n        return datos["id"]\n    except Exception as e:\n        print(f"Error procesando: {e}")\n        return None`,
    baseTheory: `Un script mal estructurado puede detener las operaciones críticas ante cualquier cambio inesperado. Debes escribir código robusto bajo principios defensivos.\n\n#### 🛠️ Reto del Auditor:\nEscribe una función básica en Python que reciba un string JSON, intente cargarlo con \`json.loads()\` de forma segura manejando excepciones, y devuelva un valor o \`None\`.`,
    baseCriteria: {
      keywords: ["def ", "try:", "except ", "json.loads", "return"],
      minLength: 80
    }
  },
  {
    code: "MAP-302",
    title: "Construcción de Microservicios con FastAPI",
    semester: 3,
    description: "Crea APIs REST ultra-rápidas validadas con Pydantic listas para agentes de IA.",
    expectedType: "python" as const,
    rewardPKD: 500,
    baseTemplate: `from fastapi import FastAPI\nfrom pydantic import BaseModel\n\napp = FastAPI()\n\nclass Item(BaseModel):\n    nombre: str\n    precio: float\n\n@app.post("/items")\ndef create_item(item: Item):\n    return {"status": "ok", "data": item}`,
    baseTheory: `FastAPI es uno de los frameworks de Python más rápidos para construir endpoints de API RESTful. Hace uso de anotaciones de tipo nativas y de **Pydantic** para validar los payloads de entrada automáticamente.\n\n#### 🛠️ Reto del Auditor:\nEscribe una API básica con FastAPI que configure una ruta POST \`/items\` y acepte un esquema de validación Pydantic que tenga las llaves \`nombre\` y \`precio\`.`,
    baseCriteria: {
      keywords: ["FastAPI", "BaseModel", "@app.post", "Pydantic"],
      minLength: 80
    }
  },
  {
    code: "MAP-303",
    title: "Extracción Dinámica y Scraping con Playwright",
    semester: 3,
    description: "Programa robots en Python capaces de saltar barreras y extraer datos de la web.",
    expectedType: "python" as const,
    rewardPKD: 500,
    baseTemplate: `import asyncio\nfrom playwright.async_api import async_playwright\n\nasync def scrape():\n    async with async_playwright() as p:\n        browser = await p.chromium.launch()\n        page = await browser.new_page()\n        await page.goto("https://ejemplo.com")\n        content = await page.content()\n        await browser.close()\n        return content`,
    baseTheory: `Playwright ejecuta un navegador Chromium completo en segundo plano (headless), permitiéndote hacer login en portales, hacer click en botones interactivos y esperar la carga dinámica de Javascript.\n\n#### 🛠️ Reto del Auditor:\nEscribe una pequeña función asíncrona en Python usando Playwright que lance un navegador en segundo plano, visite \`https://ejemplo.com\` y devuelva el contenido de la página.`,
    baseCriteria: {
      keywords: ["playwright", "async ", "goto", "content"],
      minLength: 80
    }
  },
  {
    code: "ENG-301",
    title: "Pitching de Proyectos y Negociación en Inglés",
    semester: 3,
    description: "Aprende a vender tus soluciones arquitectónicas ante directores de tecnología globales.",
    expectedType: "text" as const,
    rewardPKD: 500,
    baseTemplate: `Hello team, today I want to present the technical architecture for your new automation engine.\nWe will deploy self-hosted instances of n8n coupled with custom Python FastAPI services...`,
    baseTheory: `Sostener videollamadas con directores de habla inglesa requiere confianza, términos de arquitectura claros y el arte de vender soluciones lógicas sin trabas.\n\n#### 🛠️ Reto del Auditor:\nRedacta un guion breve en inglés con el que abrirías una presentación de arquitectura de automatización ante un equipo técnico internacional.`,
    baseCriteria: {
      keywords: ["n8n", "FastAPI", "architecture", "automation", "deploy"],
      minLength: 60
    }
  },
  // Semestre 4
  {
    code: "MAP-401",
    title: "Pipelines de ETL y Manipulación con Pandas",
    semester: 4,
    description: "Limpia y consolida millones de filas de bases de datos financieras en milisegundos.",
    expectedType: "python" as const,
    rewardPKD: 500,
    baseTemplate: `import pandas as pd\n\ndef limpiar_datos(csv_path):\n    df = pd.read_csv(csv_path)\n    df_limpio = df.dropna().drop_duplicates()\n    return df_limpio`,
    baseTheory: `Pandas es la biblioteca líder en Python para manipulación y análisis de datos en tablas.\n- **ETL**: Extract, Transform, Load.\n\n#### 🛠️ Reto del Auditor:\nPrograma una función básica en Python que reciba la ruta de un archivo CSV, use Pandas para cargarlo, elimine filas nulas e inconsistencias, y retorne el DataFrame depurado.`,
    baseCriteria: {
      keywords: ["pandas", "read_csv", "dropna", "drop_duplicates"],
      minLength: 80
    }
  },
  {
    code: "MAP-402",
    title: "Ciberseguridad de Webhooks y Criptografía HMAC",
    semester: 4,
    description: "Asegura la integridad de tus endpoints validando firmas criptográficas.",
    expectedType: "python" as const,
    rewardPKD: 500,
    baseTemplate: `import hmac\nimport hashlib\n\ndef validar_firma(payload, key, signature_header):\n    computed = hmac.new(key.encode(), payload.encode(), hashlib.sha256).hexdigest()\n    return hmac.compare_digest(computed, signature_header)`,
    baseTheory: `Para garantizar la integridad y el origen de una solicitud, plataformas robustas envían una firma digital cifrada basada en HMAC en las cabeceras HTTP del webhook.\n\n#### 🛠️ Reto del Auditor:\nEscribe una rutina en Python que valide una firma criptográfica HMAC SHA-256 utilizando la biblioteca nativa y compare los resultados de manera segura.`,
    baseCriteria: {
      keywords: ["hmac", "hashlib", "compare_digest", "sha256"],
      minLength: 80
    }
  },
  {
    code: "MAP-403",
    title: "Protocolos de Autenticación y OAuth 2.0",
    semester: 4,
    description: "Domina el flujo de refresco automático de tokens para sistemas de alta seguridad.",
    expectedType: "text" as const,
    rewardPKD: 500,
    baseTemplate: `1. Client requests authorization from User\n2. User grants access\n3. Client exchanges code for Access Token & Refresh Token...`,
    baseTheory: `OAuth 2.0 es el estándar global de la industria. Requiere que tu sistema maneje de forma automatizada un ciclo de intercambio de autorizaciones.\n\n#### 🛠️ Reto del Auditor:\nDescribe detalladamente los pasos secuenciales que realiza el protocolo OAuth 2.0 para otorgar un Access Token y Refresh Token a un sistema cliente.`,
    baseCriteria: {
      keywords: ["OAuth", "Access Token", "Refresh Token", "Authorization"],
      minLength: 60
    }
  },
  {
    code: "MAP-404",
    title: "Gestión Ágil: Scrum, Notion & Jira y DevTools (Git/GitHub)",
    semester: 4,
    description: "Trabaja profesionalmente en equipos internacionales usando Git y flujos ágiles.",
    expectedType: "text" as const,
    rewardPKD: 500,
    baseTemplate: `$ git checkout -b feature/n8n-stripe-integration\n$ git commit -am "feat: added HMAC signature verification"\n$ git push origin feature/...`,
    baseTheory: `El arquitecto profesional trabaja colaborativamente en repositorios y bajo marcos organizados que garantizan el ritmo de entrega corporativo.\n\n#### 🛠️ Reto del Auditor:\nDescribe los comandos típicos de Git necesarios para crear una nueva rama local, agregar tus cambios con un mensaje de confirmación profesional y subirlos a GitHub.`,
    baseCriteria: {
      keywords: ["git ", "checkout", "commit", "push"],
      minLength: 50
    }
  },
  // Semestre 5
  {
    code: "MAP-501",
    title: "Ingeniería de Prompts Científica y Control de Alucinaciones",
    semester: 5,
    description: "Estructura prompts avanzados de sistema para forzar respuestas 100% verídicas de los LLMs.",
    expectedType: "text" as const,
    rewardPKD: 500,
    baseTemplate: `You are a strict data formatting assistant. \nInput: raw text\nOutput: structured JSON only\nRule: Do not add explanations, markdown blocks, or text outside the JSON structure.\nExamples...`,
    baseTheory: `El ingeniero trata con los LLMs mediante técnicas rigurosas estructuradas.\n- **Few-Shot Prompting**: Enviar ejemplos de entrada y salida esperados.\n- **Chain of Thought**: Indicarle al modelo que desglose su lógica paso a paso.\n\n#### 🛠️ Reto del Auditor:\nRedacta un prompt de sistema profesional estructurado con instrucciones estrictas, reglas restrictivas y ejemplos tipo few-shot para formatear un bloque de texto libre a JSON.`,
    baseCriteria: {
      keywords: ["JSON", "Rule", "Output", "Input", "Example"],
      minLength: 60
    }
  },
  {
    code: "MAP-502",
    title: "Búsqueda Semántica y Cerebros Vectoriales con pgvector",
    semester: 5,
    description: "Diseña cerebros de conocimiento corporativo inyectando pgvector en Supabase.",
    expectedType: "text" as const,
    rewardPKD: 500,
    baseTemplate: `-- Activar extensión\nCREATE EXTENSION IF NOT EXISTS vector;\n\n-- Tabla de embeddings\nCREATE TABLE documentos (\n    id UUID PRIMARY KEY,\n    contenido TEXT,\n    embedding VECTOR(1536)\n);`,
    baseTheory: `La búsqueda semántica basada en embeddings matemáticos representa el significado de las palabras.\n- **pgvector**: Extensión de Postgres que permite almacenar y realizar búsquedas de similitud.\n\n#### 🛠️ Reto del Auditor:\nEscribe un script SQL para habilitar la extensión \`vector\` en PostgreSQL y crear una tabla que almacene embeddings de texto de 1536 dimensiones.`,
    baseCriteria: {
      keywords: ["vector", "CREATE EXTENSION", "embedding", "VECTOR(1536)"],
      minLength: 60
    }
  },
  {
    code: "MAP-503",
    title: "Privacidad, Cumplimiento Global (SOC 2) y Auditoría",
    semester: 5,
    description: "Cumple con normativas de seguridad configurando políticas RLS y audita costos de IA.",
    expectedType: "text" as const,
    rewardPKD: 500,
    baseTemplate: `-- Row Level Security en Supabase\nALTER TABLE facturas ENABLE ROW LEVEL SECURITY;\n\nCREATE POLICY "Ver propias facturas" ON facturas\n    FOR SELECT USING (auth.uid() = user_id);`,
    baseTheory: `Es obligatorio diseñar bases de datos bajo políticas de seguridad estrictas.\n- **RLS**: Directiva de PostgreSQL que intercepta todas las consultas entrantes y las restringe según el rol o identidad autenticada.\n\n#### 🛠️ Reto del Auditor:\nEscribe un conjunto de sentencias SQL en PostgreSQL que activen RLS en una tabla de facturas y definan una política de acceso basada en el usuario autenticado.`,
    baseCriteria: {
      keywords: ["ROW LEVEL SECURITY", "POLICY", "auth.uid", "facturas"],
      minLength: 60
    }
  },
  {
    code: "MAP-504",
    title: "Testing Automatizado y QA con Pytest",
    semester: 5,
    description: "Valida la robustez de tus sistemas escribiendo tests unitarios automatizados.",
    expectedType: "python" as const,
    rewardPKD: 500,
    baseTemplate: `import pytest\nfrom app.utils import formatear_telefono\n\ndef test_formatear_telefono():\n    assert formatear_telefono("5551234567") == "+1-555-123-4567"\n    with pytest.raises(ValueError):\n        formatear_telefono("invalido")`,
    baseTheory: `En este curso aprenderás a blindar la calidad de tu código mediante pruebas controladas con Pytest.\n\n#### 🛠️ Reto del Auditor:\nEscribe un caso de prueba unitario básico usando Pytest que verifique el comportamiento esperado de una función y maneje errores.`,
    baseCriteria: {
      keywords: ["pytest", "assert", "def test_", "raises"],
      minLength: 80
    }
  },
  // Semestre 6
  {
    code: "MAP-601",
    title: "Arquitectura de Agentes Lógicos con LangGraph",
    semester: 6,
    description: "Programa agentes multi-IA con flujos de estado deterministas libres de bucles infinitos.",
    expectedType: "python" as const,
    rewardPKD: 500,
    baseTemplate: `from langgraph.graph import StateGraph, START, END\n\nclass State(dict):\n    messages: list\n\nworkflow = StateGraph(State)\nworkflow.add_node("agent", call_model)\nworkflow.add_edge(START, "agent")\nworkflow.add_edge("agent", END)...`,
    baseTheory: `Para construir automatizaciones cognitivas empresariales fiables se utilizan grafos de estado deterministas con LangGraph.\n\n#### 🛠️ Reto del Auditor:\nEscribe un script inicial en Python estructurando un StateGraph básico de LangGraph con un nodo inicial conectado al inicio y al final.`,
    baseCriteria: {
      keywords: ["StateGraph", "START", "END", "add_node", "add_edge"],
      minLength: 80
    }
  },
  {
    code: "MAP-602",
    title: "Function Calling y Orquestación de Herramientas",
    semester: 6,
    description: "Conecta a la IA con tus APIs y scripts de forma segura bajo el control de tu código.",
    expectedType: "python" as const,
    rewardPKD: 500,
    baseTemplate: `from langchain_core.tools import tool\n\n@tool\ndef sumar(a: int, b: int) -> int:\n    """Suma dos números enteros."""\n    return a + b\n\nmodel_with_tools = model.bind_tools([sumar])`,
    baseTheory: `Un agente inteligente cobra vida útil cuando adquiere la capacidad física de interactuar con el mundo real.\n\n#### 🛠️ Reto del Auditor:\nEscribe una herramienta básica de Python anotada con el decorador \`@tool\` de LangChain lista para ser enlazada a un modelo inteligente.`,
    baseCriteria: {
      keywords: ["@tool", "bind_tools", "def ", "sumar"],
      minLength: 80
    }
  },
  {
    code: "MAP-603",
    title: "Orquestación de Agentes con CrewAI y Autogen",
    semester: 6,
    description: "Diseña flujos conversacionales dinámicos y equipos de agentes colaborando solos.",
    expectedType: "python" as const,
    rewardPKD: 500,
    baseTemplate: `from crewai import Agent, Crew, Process, Task\n\ninvestigador = Agent(role="Investigador", goal="Analizar...")\nredactor = Agent(role="Redactor", goal="Escribir...")`,
    baseTheory: `La orquestación multi-agente con CrewAI y Autogen permite dividir tareas sumamente complejas entre expertos con IA enfocados en un rol.\n\n#### 🛠️ Reto del Auditor:\nEscribe una estructura básica de CrewAI definiendo dos agentes de IA con diferentes roles y objetivos de negocio.`,
    baseCriteria: {
      keywords: ["Agent", "Crew", "role", "goal"],
      minLength: 80
    }
  },
  {
    code: "ENG-401",
    title: "Inglés Técnico III: Negociación de Contratos Internacionales",
    semester: 6,
    description: "Domina la jerga jurídica y comercial en inglés para firmar acuerdos freelance de alto nivel.",
    expectedType: "text" as const,
    rewardPKD: 500,
    baseTemplate: `This Services Agreement is entered into by and between the Consultant and the Client...\nIntellectual Property Rights shall belong exclusively to...`,
    baseTheory: `Firmar contratos internacionales en inglés requiere precisión y vocabulario legal para resguardar tus derechos y propiedad intelectual.\n\n#### 🛠️ Reto del Auditor:\nRedacta en inglés un fragmento de acuerdo de servicios que especifique la protección de propiedad intelectual y los términos de pago.`,
    baseCriteria: {
      keywords: ["Agreement", "Intellectual Property", "payment", "Consultant", "Client"],
      minLength: 60
    }
  },
  // Semestre 7
  {
    code: "MAP-701",
    title: "Sistemas RAG Avanzados y Bases de Datos de Grafos (GraphRAG)",
    semester: 7,
    description: "Construye cerebros híbridos usando ontologías de grafos para búsquedas de IA con precisión total.",
    expectedType: "text" as const,
    rewardPKD: 500,
    baseTemplate: `CREATE TABLE nodos (\n    id UUID PRIMARY KEY,\n    label TEXT NOT NULL,\n    propiedades JSONB\n);\n\nCREATE TABLE aristas (\n    id UUID PRIMARY KEY,\n    origen_id UUID REFERENCES nodos(id),\n    destino_id UUID REFERENCES nodos(id),\n    tipo TEXT NOT NULL\n);`,
    baseTheory: `GraphRAG une la semántica de embeddings con la rigurosidad estructural de un grafo relacional de conceptos para erradicar las alucinaciones de IA.\n\n#### 🛠️ Reto del Auditor:\nDiseña un esquema relacional básico SQL en PostgreSQL para almacenar un grafo de conocimiento compuesto de nodos y aristas con integridad referencial.`,
    baseCriteria: {
      keywords: ["CREATE TABLE", "nodos", "aristas", "REFERENCES"],
      minLength: 60
    }
  },
  {
    code: "MAP-702",
    title: "Extracción Sigilosa (Stealth Scraping) y Evasión de Bloqueos",
    semester: 7,
    description: "Programa robots capaces de saltar Cloudflare, captchas y sistemas antibot en 2028.",
    expectedType: "python" as const,
    rewardPKD: 500,
    baseTemplate: `from playwright.async_api import async_playwright\n\nasync def stealth_scrape():\n    async with async_playwright() as p:\n        # Inyectar evasión de firmas digitales\n        browser = await p.chromium.launch(args=["--disable-blink-features=AutomationControlled"])\n        page = await browser.new_page()\n        await page.goto("https://secure-portal.com")`,
    baseTheory: `Las empresas en 2028 protegen celosamente sus datos con WAFs dinámicos. Aprende a simular firmas TLS humanas y rotar proxies residenciales de forma automatizada.\n\n#### 🛠️ Reto del Auditor:\nEscribe un script en Python con Playwright que desactive la cabecera de automatización controlada (\`AutomationControlled\`) para navegar sigilosamente.`,
    baseCriteria: {
      keywords: ["playwright", "AutomationControlled", "args", "launch"],
      minLength: 80
    }
  },
  {
    code: "MAP-703",
    title: "Orquestación en Nube (AWS/GCP) y Serverless para Automatizaciones",
    semester: 7,
    description: "Despliega infraestructuras escalables sin servidores administrando Docker en AWS Lambda.",
    expectedType: "text" as const,
    rewardPKD: 500,
    baseTemplate: `AWSTemplateFormatVersion: '2010-09-09'\nResources:\n  MyLambdaFunction:\n    Type: AWS::Serverless::Function\n    Properties:\n      Handler: app.handler\n      Runtime: python3.11\n...`,
    baseTheory: `El despliegue Serverless en la nube (AWS/GCP) elimina el mantenimiento de servidores VPS fijos y permite escalar tus APIs y flujos a coste casi cero.\n\n#### 🛠️ Reto del Auditor:\nEscribe una plantilla YAML básica de AWS CloudFormation / SAM o describe los pasos de despliegue de una función Serverless en AWS/GCP.`,
    baseCriteria: {
      keywords: ["Lambda", "Serverless", "Handler", "Runtime"],
      minLength: 60
    }
  },
  {
    code: "MAP-704",
    title: "Auditoría de Costos de IA y Optimización de Consumo de LLMs",
    semester: 7,
    description: "Estructura flujos de caching semántico y compresión de contextos para reducir gastos de IA en 90%.",
    expectedType: "python" as const,
    rewardPKD: 500,
    baseTemplate: `def calcular_costo_tokens(input_tokens, output_tokens):\n    costo_in = input_tokens * (0.0015 / 1000)\n    costo_out = output_tokens * (0.0020 / 1000)\n    return costo_in + costo_out`,
    baseTheory: `El despilfarro de tokens en prompts redundantes puede quebrar una startup. El arquitecto audita y optimiza el consumo de LLMs aplicando caché de embeddings.\n\n#### 🛠️ Reto del Auditor:\nEscribe una función en Python que estime el costo financiero de una consulta a una API de LLM basada en la cantidad de tokens de entrada y salida.`,
    baseCriteria: {
      keywords: ["def ", "tokens", "costo", "return"],
      minLength: 60
    }
  },
  // Semestre 8
  {
    code: "MAP-801",
    title: "Proyecto de Fin de Carrera (Capstone Enterprise Project)",
    semester: 8,
    description: "Integra todo tu conocimiento construyendo una automatización holística real auditada por expertos.",
    expectedType: "text" as const,
    rewardPKD: 500,
    baseTemplate: `### JTU CAPSTONE ENTERPRISE BLUEPRINT\n1. BPMN Discovery (Mapeo de Procesos)\n2. Postgres Database & RLS Setup\n3. Dockerized VPS Orquestación (n8n)\n4. Cognitive Agent Flow (LangGraph)\n5. Security & QA Verification`,
    baseTheory: `El Proyecto Capstone representa tu carta de graduación como Ingeniero en Automatización e IA. Debes diseñar una arquitectura robusta, segura y auditada.\n\n#### 🛠️ Reto del Auditor:\nRedacta el Blueprint conceptual estructurado de tu proyecto final de carrera integrando BPMN, Supabase/PostgreSQL, n8n, LangGraph y seguridad SOC 2.`,
    baseCriteria: {
      keywords: ["BPMN", "Postgres", "n8n", "LangGraph", "Security"],
      minLength: 80
    }
  },
  {
    code: "MAP-802",
    title: "Marca Personal de Élite, Posicionamiento y LinkedIn para Contratos",
    semester: 8,
    description: "Optimiza tu presencia profesional en GitHub y LinkedIn para atraer clientes internacionales sin buscar empleo.",
    expectedType: "text" as const,
    rewardPKD: 500,
    baseTemplate: `### LinkedIn Profile Headlines & GitHub Bio\nHeadline: Enterprise Automation Architect | FastAPI, n8n & LangGraph Expert\nAbout Section:\nHelping businesses save thousands of hours through custom AI Agents...`,
    baseTheory: `Tu marca personal es tu canal de atracción más potente. Un perfil de LinkedIn bien estructurado atrae ofertas de contratos internacionales de forma orgánica.\n\n#### 🛠️ Reto del Auditor:\nEscribe tu propuesta de valor y tu titular profesional en inglés dirigido al posicionamiento premium de tu marca en LinkedIn.`,
    baseCriteria: {
      keywords: ["Automation", "Architect", "n8n", "FastAPI", "AI Agents"],
      minLength: 60
    }
  },
  {
    code: "MAP-803",
    title: "Finanzas Freelance, Facturación Internacional (Deel/Wise) y NDAs",
    semester: 8,
    description: "Crea cuentas internacionales de cobro, genera facturas corporativas y blinda tu negocio legalmente.",
    expectedType: "text" as const,
    rewardPKD: 500,
    baseTemplate: `--- INVOICE STRUCTURE ---\nInvoice Number: #JTU-2028-001\nConsultant Info & Client Info\nDescription: Enterprise Workflow Automation Phase 1\nAmount Due: $X,XXX USD\nPayment terms: Deel / Wire Transfer`,
    baseTheory: `Operar de forma legal y segura en el mercado transfronterizo es indispensable. Debes estructurar tus facturas, contratos de confidencialidad (NDAs) y procesadores de pago (Deel, Wise).\n\n#### 🛠️ Reto del Auditor:\nDescribe en formato de texto el esqueleto de una factura internacional corporativa detallando las secciones e información legal indispensables.`,
    baseCriteria: {
      keywords: ["Invoice", "Amount Due", "Consultant", "Client", "Deel"],
      minLength: 60
    }
  },
  {
    code: "MAP-804",
    title: "Liderazgo Técnico (Tech Lead), Venta Consultiva y Cierre de Negocios de Alto Ticket",
    semester: 8,
    description: "Domina el cierre de contratos de alto valor usando negociación socrática de alto nivel.",
    expectedType: "text" as const,
    rewardPKD: 500,
    baseTemplate: `### Socratic Sales Discovery Script\n1. "What is the actual bottleneck of your operations?"\n2. "How much is that bottleneck costing your business monthly?"\n3. "If we automate this, what is the estimated ROI for the company?"...`,
    baseTheory: `La venta consultiva no convence; educa y asiste. Al usar preguntas socráticas, permites que el cliente descubra por sí mismo el valor y el retorno de inversión de tu propuesta.\n\n#### 🛠️ Reto del Auditor:\nEscribe un pequeño guion de venta consultiva en inglés utilizando preguntas socráticas para desentrañar el dolor financiero y operativo de un cliente potencial.`,
    baseCriteria: {
      keywords: ["bottleneck", "costing", "ROI", "automate"],
      minLength: 80
    }
  }
];

// Helper to programmatically populate the 16 Weeks array for each course to avoid 20MB files
function populateCourseWeeks(course: typeof BASE_COURSES[number]): WeekLesson[] {
  return generateWeeksForCourse(
    course.code,
    course.title,
    course.expectedType,
    course.baseTheory,
    course.baseTemplate,
    course.baseCriteria
  );
}

function generateWeeksForCourse(
  code: string,
  title: string,
  expectedType: "json" | "python" | "text",
  baseTheory: string,
  baseTemplate: string,
  baseCriteria: VerificationCriteria
): WeekLesson[] {
  const weeks: WeekLesson[] = [];
  
  for (let w = 1; w <= 16; w++) {
    let weekTitle = "";
    let isExam: "parcial1" | "parcial2" | "final" | undefined = undefined;
    let weekTheory = "";
    let weekTemplate = baseTemplate;
    let weekCriteria = { ...baseCriteria };

    // Define titles and details based on week type
    if (w === 6) {
      weekTitle = `Examen Parcial I: Consolidación y Auditoría Crítica`;
      isExam = "parcial1";
      weekTheory = `### 🏆 EXAMEN PARCIAL I: ${title.toUpperCase()}
Esta semana te enfrentas al primer gran hito de la asignatura. Debes demostrar dominio total de los conceptos prácticos de las primeras 5 semanas.

#### 📝 Consigna de Examen:
Desarrolla una solución integral que demuestre los fundamentos aprendidos, garantizando la integridad de datos, optimización y ciberseguridad. El Auditor evaluará con máximo rigor socrático.

*Nota: Requiere calificación de mínimo 7.0 para avanzar.*`;
      // Stricter verification criteria for exams
      weekCriteria = {
        keywords: baseCriteria.keywords,
        minLength: baseCriteria.minLength ? Math.floor(baseCriteria.minLength * 1.5) : 100
      };
    } else if (w === 12) {
      weekTitle = `Examen Parcial II: Arquitectura Avanzada y Control de Errores`;
      isExam = "parcial2";
      weekTheory = `### 🏆 EXAMEN PARCIAL II: ${title.toUpperCase()}
Has llegado al segundo hito evaluativo de la carrera. Evaluaremos tu capacidad para diseñar arquitecturas tolerantes a fallos y optimizadas para entornos empresariales de alto estrés en 2028.

#### 📝 Consigna de Examen:
Propón una solución completa bajo patrones de diseño defensivos, integrando subworkflows, manejo de excepciones avanzado, validación estricta y protección perimetral.

*Nota: Requiere calificación de mínimo 7.0 para avanzar.*`;
      weekCriteria = {
        keywords: baseCriteria.keywords,
        minLength: baseCriteria.minLength ? Math.floor(baseCriteria.minLength * 1.5) : 100
      };
    } else if (w === 16) {
      weekTitle = `Examen Final: Proyecto Integrador de Especialidad`;
      isExam = "final";
      weekTheory = `### 🎓 EXAMEN FINAL: RETO INTEGRADOR JTU
¡Bienvenido al reto definitivo de la asignatura! Para graduarte de esta materia debes resolver un caso de negocio enterprise real de principio a fin, integrando todas las aristas cubiertas.

#### 📝 Consigna de Examen:
Despliega el ecosistema completo para este reto integrador. Escribe código de calidad empresarial, documenta cada paso, optimiza recursos de procesamiento y asegura los flujos de datos y credenciales.

*Nota: Es el reto decisivo con peso del 30% en tu promedio final.*`;
      weekCriteria = {
        keywords: baseCriteria.keywords,
        minLength: baseCriteria.minLength ? Math.floor(baseCriteria.minLength * 2) : 120
      };
    } else {
      weekTitle = `Semana ${w}: ${getWeekTopic(code, w)}`;
      weekTheory = `### 🧭 ${code} - Semana ${w}: ${weekTitle}
En esta lección profundizaremos en la metodología y las mejores prácticas asociadas a **${title}**.

#### 📘 Lección de Aprendizaje:
El diseño de sistemas y la IA cognitiva en el ecosistema 2027-2028 demanda un entendimiento claro de los flujos de datos y la integridad referencial. Debes comprender los cuellos de botella reales y diseñar soluciones sólidas que automaticen las operaciones sin fricción.

*Píldora del Conocimiento:*
- Analiza siempre el problema desde una perspectiva socrática antes de escribir código.
- Divide tus flujos y mantén las dependencias aisladas.
- Valida los payloads de entrada y salida rigurosamente.

#### 🛠️ Reto Semanal:
Completa el reto de programación o diseño conceptual propuesto en el editor y envíalo para validación del Auditor de JTU.`;
    }

    weeks.push({
      weekNum: w,
      title: weekTitle,
      theory: weekTheory,
      template: weekTemplate,
      expectedType,
      verificationCriteria: weekCriteria,
      isExam
    });
  }

  return weeks;
}

// Map the generated curriculum list
export const JTU_CURRICULUM: Course[] = BASE_COURSES.map((course) => {
  const weeks = populateCourseWeeks(course);
  
  // Return expanded course structure preserving backwards compatibility fields
  return {
    code: course.code,
    title: course.title,
    semester: course.semester,
    description: course.description,
    rewardPKD: course.rewardPKD,
    weeks: weeks,
    
    // Backwards compatibility mappings
    expectedType: course.expectedType,
    theory: weeks[0].theory,
    template: weeks[0].template,
    verificationCriteria: weeks[0].verificationCriteria
  };
});
