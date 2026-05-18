"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import { useRouter } from "next/navigation"
import { useAcademyStore } from "@/store/useAcademyStore"
import { useEconomyStore } from "@/store/useEconomyStore"
import { JTU_CURRICULUM, Course, WeekLesson } from "@/data/academyData"
import { createClient, supabaseReady } from "@/shared/lib/supabase/client"
import {
  GraduationCap, BookOpen, Terminal, Sparkles, Lock, CheckCircle2, ChevronRight, ChevronLeft, ChevronDown,
  TrendingUp, Award, FileText, ArrowLeft, RefreshCw, Copy, Check, ShieldAlert,
  Play, Cpu, BookMarked, UserCheck, AlertCircle, FileSignature, HelpCircle, Eye,
  Printer, X
} from "lucide-react"

// Simple Markdown parser to render course theory beautifully
const parseMarkdown = (text: string) => {
  const parts = text.split("```")
  return parts.map((part, index) => {
    // Odd indexes are code blocks
    if (index % 2 === 1) {
      const lines = part.split("\n")
      const language = lines[0].trim()
      const code = lines.slice(1).join("\n").trim()
      return (
        <div key={index} className="my-5 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-950 font-mono text-xs text-slate-800">
          <div className="bg-slate-900/90 px-4 py-2 flex justify-between items-center text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
            <span>{language || "code"}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(code)
                confetti({ particleCount: 15, spread: 20, origin: { y: 0.8 } })
              }}
              className="hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              Copiar
            </button>
          </div>
          <pre className="p-4 overflow-x-auto select-all leading-relaxed"><code>{code}</code></pre>
        </div>
      )
    }

    // Even indexes are standard text - process line by line
    return (
      <div key={index} className="space-y-3">
        {part.split("\n").map((line, lineIdx) => {
          const key = `${index}-${lineIdx}`
          if (line.startsWith("### ")) {
            return <h3 key={key} className="text-sm md:text-base font-black text-slate-800 mt-6 mb-2 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-2">{line.replace("### ", "")}</h3>
          }
          if (line.startsWith("#### ")) {
            return <h4 key={key} className="text-xs md:text-sm font-bold text-slate-700 mt-4 mb-2">{line.replace("#### ", "")}</h4>
          }
          if (line.startsWith("- ")) {
            return <li key={key} className="ml-5 list-disc text-xs text-slate-600 mb-1 leading-relaxed">{line.substring(2)}</li>
          }
          if (line.startsWith("1. ")) {
            return <li key={key} className="ml-5 list-decimal text-xs text-slate-600 mb-1 leading-relaxed">{line.substring(3)}</li>
          }
          if (line.startsWith("> ")) {
            return (
              <div key={key} className="border-l-4 border-violet-500 bg-violet-50/40 p-4 rounded-r-xl my-4 text-[11px] text-slate-700 leading-relaxed font-medium">
                {line.substring(2)}
              </div>
            )
          }
          if (line.trim() === "") {
            return <div key={key} className="h-1" />
          }

          // Inline code replacement
          const inlineParts = line.split("`")
          if (inlineParts.length > 1) {
            return (
              <p key={key} className="text-xs text-slate-600 leading-relaxed">
                {inlineParts.map((subPart, subIdx) => {
                  if (subIdx % 2 === 1) {
                    return <code key={subIdx} className="px-1.5 py-0.5 bg-slate-100 rounded text-rose-600 font-mono text-[10px] font-semibold">{subPart}</code>
                  }
                  return subPart
                })}
              </p>
            )
          }

          return <p key={key} className="text-xs text-slate-600 leading-relaxed">{line}</p>
        })}
      </div>
    )
  })
}

interface EnrichedLesson extends WeekLesson {
  datasetContent: string;
  datasetFilename: string;
  templateFilename: string;
}

const enrichWeeklyLesson = (course: Course, weekNum: number, baseLesson: WeekLesson): EnrichedLesson => {
  const code = course.code;
  const sem = course.semester;
  const expectedType = baseLesson.expectedType;
  const keywords = baseLesson.verificationCriteria.keywords;
  const minLength = baseLesson.verificationCriteria.minLength || 60;
  
  // 1. Determine Business Case Startup
  let startupName = "";
  let startupEmoji = "";
  let startupIndustry = "";
  let startupBrief = "";
  let startupConsultingTicket = "";
  
  if ([1, 2, 7, 8].includes(sem)) {
    startupName = "Veggietopia";
    startupEmoji = "🥦";
    startupIndustry = "Cadena de Restaurantes Veganos Premium y Agricultura Urbana Tecnológica";
    startupConsultingTicket = "$4,500 - $6,000 USD";
    startupBrief = `Veggietopia ha tenido un crecimiento explosivo con 5 sucursales físicas y un huerto hidropónico IoT automatizado. Sin embargo, sufren pérdidas del 18% en su margen operativo debido a: (1) reservas fantasmas (no-shows) de clientes que reservan por WhatsApp y no asisten, lo que pudre insumos ultra-perecederos como aguacates orgánicos y quesos veganos de almendra artesanales, y (2) falta de coordinación entre el stock físico de sus cámaras de frío y las órdenes de compra de los proveedores. Tu misión en esta semana es sentar la arquitectura técnica que resuelva este cuello de botella real en producción.`;
  } else if ([3, 4].includes(sem)) {
    startupName = "Paws & Claws";
    startupEmoji = "🐶";
    startupIndustry = "Red Nacional de Clínicas Veterinarias y Pet Shop Inteligente";
    startupConsultingTicket = "$6,800 - $8,500 USD";
    startupBrief = `Paws & Claws atiende a más de 12,000 mascotas activas. Sin embargo, su operación diaria es un caos: las recepcionistas pasan hasta 4 horas al día enviando recordatorios de vacunas críticas de forma manual por teléfono, y las citas de peluquería canina se agendan en un Excel compartido que sufre de corrupción constante de celdas. Además, el inventario de vacunas no tiene control de caducidad. Te contratan para programar scripts defensivos en Python, diseñar endpoints rápidos y seguros con FastAPI, y estructurar robots de raspado de precios (stealth scraping) para competir en tiempo real en la venta de pet-food.`;
  } else {
    startupName = "EcoGlow Commerce";
    startupEmoji = "🌿";
    startupIndustry = "E-commerce Global de Cosmética Ecológica y Bienestar Vegano";
    startupConsultingTicket = "$12,000 - $15,500 USD";
    startupBrief = `EcoGlow recibe más de 800 correos de soporte diarios. Las consultas de información general ("¿Hacen envíos gratuitos?") sepultan a los reclamos críticos de clientes que recibieron frascos de sérum de vidrio rotos durante el envío. Esto causa reembolsos tardíos, cancelaciones de suscripciones y mala publicidad en redes. Te contratan para integrar un motor semántico pgvector en Supabase que clasifique correos de forma automática, consulte Shopify mediante web APIs para reembolsar compras elegibles y orqueste redes de agentes autónomos con LangGraph con observabilidad total de costos financieros por tokens.`;
  }

  // 2. Select Analogy-First description based on subject matter or keywords
  let analogyTitle = "";
  let analogyText = "";
  const keywordsStr = keywords.join(", ");
  
  if (expectedType === "python" || keywordsStr.toLowerCase().includes("def") || keywordsStr.toLowerCase().includes("try")) {
    analogyTitle = "El Vehículo de Pruebas con Airbags Defensivos (Manejo de Excepciones)";
    analogyText = `Imagínate que estás conduciendo un automóvil de pruebas de alta velocidad. Si tomas un bache inesperado en la carretera (como que una API devuelva un error 500, o un JSON venga vacío), un auto ordinario se estrellaría destruyendo el motor. La programación defensiva con bloques \`try/except\` (o try/catch) es como equipar tu auto con bolsas de aire y sensores adaptativos de amortiguación: al detectar el impacto del error, el airbag se infla instantáneamente (captura la excepción), te mantiene a salvo y te permite desviar el vehículo suavemente hacia el arcén, registrando detalladamente la bitácora del fallo sin detener el tráfico de la ciudad.`;
  } else if (expectedType === "json" || keywordsStr.toLowerCase().includes("webhook") || keywordsStr.toLowerCase().includes("api")) {
    analogyTitle = "El Chef Pizero de Notificación Directa (Webhooks vs. Polling)";
    analogyText = `Imagina que vas a una pizzería premium y quieres saber cuándo estará lista tu pizza. 'Polling' es ir al mostrador cada 30 segundos a preguntarle al chef: "¿Ya está? ¿Ya está? ¿Y ahora?". Esto satura al chef, te agota a ti y genera tráfico innecesario. 'Webhook' es, en cambio, darle tu número de WhatsApp al chef: tú te vas a sentar tranquilamente a leer un libro, y en el instante exacto en que la pizza sale del horno, el chef te envía un mensaje automático diciendo: "¡Pizza lista, mesa 4!". Eso es comunicación reactiva y asíncrona de alto rendimiento.`;
  } else if (keywordsStr.toLowerCase().includes("table") || keywordsStr.toLowerCase().includes("key") || keywordsStr.toLowerCase().includes("select") || keywordsStr.toLowerCase().includes("insert")) {
    analogyTitle = "La Placa de Identidad del Collar Canino (Llaves Foráneas e Integridad Referencial)";
    analogyText = `Imagina una gran guardería de mascotas en Johto. Cada perrito lleva en su collar una placa grabada con el ID único de su dueño (esto es la Llave Foránea o \`FOREIGN KEY\`). Si intentas dar de baja a un dueño de la base de datos de la veterinaria mientras su perrito sigue en las instalaciones, el sistema de seguridad te gritará: "¡Detente! No puedes borrar al dueño porque dejarías al perrito huérfano en la guardería". Eso es la integridad referencial en bases de datos: previene el caos de registros huérfanos que arruinaría las auditorías empresariales.`;
  } else if (keywordsStr.toLowerCase().includes("vector") || keywordsStr.toLowerCase().includes("embedding") || keywordsStr.toLowerCase().includes("pgvector")) {
    analogyTitle = "La Biblioteca de Vibras y Conceptos (pgvector y Búsquedas Semánticas)";
    analogyText = `Imagina una biblioteca mágica donde los libros no están ordenados por orden alfabético ni por género, sino por su 'vibra' o significado profundo. Si buscas "remedio natural para la ansiedad de un perrito", no necesitas buscar la palabra exacta. El bibliotecario mágico (pgvector) entiende el concepto vectorial (embedding) y te guiará directamente al pasillo de "hierbas calmantes para mascotas", situándolo muy cerca de "bienestar animal" y lejos de "coches deportivos". Buscamos por cercanía semántica de ideas, no por coincidencia exacta de letras.`;
  } else if (keywordsStr.toLowerCase().includes("docker") || keywordsStr.toLowerCase().includes("vps") || keywordsStr.toLowerCase().includes("container")) {
    analogyTitle = "Las Casas Prefabricadas Idénticas (Docker y Servidores VPS)";
    analogyText = `Docker es como fabricar casas de madera modulares idénticas dentro de una fábrica sellada. No importa si tu cliente final vive en una playa de arena, en una montaña rocosa o en el desierto (servidores Linux, Windows o macOS): tú transportas la casa en un contenedor sellado, la descargas y arranca a funcionar en 5 segundos exactamente igual que en tu laboratorio de pruebas. Te olvidas del dolor de cabeza de configurar librerías locales o dependencias que no coinciden: si funciona en tu contenedor, funciona en producción.`;
  } else if (keywordsStr.toLowerCase().includes("graph") || keywordsStr.toLowerCase().includes("agent") || keywordsStr.toLowerCase().includes("langgraph")) {
    analogyTitle = "Las Vías de Acero de la Montaña Rusa Inteligente (LangGraph y Multi-Agentes)";
    analogyText = `Un agente de IA libre sin guías es como un globo suelto en el aire: flota sin rumbo y puede salir volando si el viento sopla fuerte. Un flujo en LangGraph es una montaña rusa de última tecnología: el carrito (el estado del agente) tiene sensores para tomar curvas o decidir desvíos automáticos según los datos recibidos (el clima), pero siempre viaja anclado a rieles de acero sólidos y predecibles diseñados por ti. La IA puede razonar dentro de cada nodo, pero nunca puede descarrilarse ni salirse de las vías operativas de la empresa.`;
  } else {
    analogyTitle = "El Plano de Construcción de una Autopista de Datos";
    analogyText = `Diseñar una automatización industrial es como trazar el plano de una autopista metropolitana. No conectas calles secundarias de forma caótica; organizas carriles rápidos, cabinas de peaje para seguridad (autenticación), retornos para casos de emergencia (manejo de errores) y cámaras de monitoreo continuo (observabilidad). Cada dato viaja encapsulado a gran velocidad hacia su destino final, protegido contra inclemencias o saturación del tráfico de la red.`;
  }

  // 3. Construct deep, beautiful socratic theory markdown (800+ words)
  const theory = `### 🏛️ UNIVERSIDAD DE JOHTO (JTU) — CÁTEDRA DE ESTUDIO OFICIAL
## Materia: \`${code}\` — Semestre ${sem}
### 📚 Lección de Élite: **${baseLesson.title}**

---

### 🏢 A. EL BRIEF DE CONSULTORÍA DE ALTO TICKET (${startupEmoji} Caso: ${startupName})
> **Cliente:** ${startupName} — *${startupIndustry}*
> **Tarifa del Proyecto:** \`${startupConsultingTicket}\`
>
> **El Diagnóstico Operativo:**
> ${startupBrief}
>
> En esta semana, tu rol como **Arquitecto Principal de Automatización y Datos** es resolver el módulo de la lección para asegurar la estabilidad, retorno de inversión (ROI) y blindaje de las operaciones del cliente.

---

### 🧠 B. EL GANCHO SOCRÁTICO (Pregunta de Diseño Reflexivo)
> *Reflexiona antes de programar:*
> "Si el endpoint principal de tu cliente o la API de base de datos responde con un retraso excesivo o cae por 15 segundos debido a saturación de peticiones concurrentes... ¿cómo reaccionará tu sistema? ¿Tu flujo colapsará en silencio perdiendo transacciones valiosas, o tienes una arquitectura resistente que captura el error, alerta al equipo en Slack y guarda la transacción de forma temporal para auto-recuperarse al de restablecerse el servicio?"

---

### 💡 C. LA ANALOGÍA DEL DÍA A DÍA (Analogies-First)
#### **${analogyTitle}**
${analogyText}

---

### 🔬 D. INMERSIÓN TÉCNICA Y CONCEPTUAL (Deep Dive)
Para estructurar e implementar exitosamente la solución requerida de esta semana, es fundamental comprender la arquitectura y los fundamentos teóricos detrás de los siguientes elementos clave:
1. **Flujo de Datos Limpio**: El tránsito de información entre APIs y base de datos debe estar estructurado en base a esquemas predecibles. Esto asegura la coherencia en todo el ciclo de vida del dato.
2. **Criterios de Verificación del Oráculo**: Para calificar tu entrega, el Auditor de JTU buscará de forma estricta el cumplimiento de conceptos como: **${keywordsStr}**.
3. **Control Defensivo y Gestión de Excepciones**: No asumas que la red o los datos de entrada siempre serán perfectos. Debes validar la presencia de nulos, formatear estructuras multinivel JSON de forma segura y blindar los puntos críticos de código contra desbordamientos.

#### **Directrices Técnicas Específicas para esta Lección:**
*   Si estás trabajando con **scripts en Python**, utiliza tipado estático sutil, manejo defensivo mediante bloques \`try/except\` para capturar excepciones detalladas, y validación estricta de variables de entorno.
*   Si estás estructurando **cadenas JSON o llamadas REST**, asegúrate de que todos los campos requeridos estén presentes, evita la duplicidad de llaves, y utiliza estructuras limpias de tipo clave-valor conformes con la especificación industrial.
*   Si estás manipulando **comandos o esquemas SQL**, garantiza el uso de tipos de datos adecuados, respeta los constraints de llaves foráneas para mantener la integridad, y evita realizar consultas ineficientes sin índices.

---

### 🛡️ E. BLINDAJE DE PRODUCCIÓN & SEGURIDAD CORPORATIVA (SOC 2 Check)
*   **Prevención de Fugas**: Jamás quemes credenciales o tokens en texto plano dentro del código. Utiliza variables de entorno seguras (\`process.env\` o \`os.getenv\`).
*   **Sanitización Completa**: Limpia y sanitiza cualquier parámetro de entrada para neutralizar ataques de inyección SQL o Prompt Injection indirectas.
*   **Políticas RLS Activas**: Al consultar Supabase, certifica que las políticas Row Level Security estén restringiendo el acceso exclusivamente al usuario autenticado.
*   **Manejo de Errores Activo**: Cualquier excepción debe registrarse de forma auditable detallando la estampa de tiempo (timestamp) y el contexto del error, evitando que el flujo falle de manera silenciosa.

---

### 🛠️ F. INSTRUCCIONES DE LA CONDICIÓN DE VICTORIA (Micro-entregable)
Modifica el código base proporcionado abajo. Integra de forma limpia y obligatoria los conceptos clave (**${keywordsStr}**) asegurando una redacción de código/texto de al menos \`${minLength}\` caracteres. Pégalo en el Auditor de la derecha para recibir tu calificación de Harvard Weighted.

---

*Lección oficial elaborada por la Facultad de Ingeniería de JTU para el ciclo académico 2027-2028.*`;

  // 4. Construct commented, high-quality, professional code template
  let templateFilename = `entrega_semana_${weekNum}_${code}`;
  let ext = "txt";
  if (expectedType === "python") {
    ext = "py";
  } else if (expectedType === "json") {
    ext = "json";
  } else if (code.includes("102") || code.includes("202") || code.includes("602")) {
    ext = "sql";
  }

  templateFilename = `${templateFilename}.${ext}`;

  let commentedTemplate = "";
  if (expectedType === "python") {
    commentedTemplate = `# ==============================================================================
# 🏛️ JOHTO TECH UNIVERSITY (JTU) - DEPARTAMENTO DE INGENIERÍA Y AGENTES DE IA
# 📚 Cátedra: ${code} - Semana ${weekNum}
# 💼 Proyecto Freelance: Caso ${startupName} (${startupEmoji})
# 🎯 Misión: Resolver el cuello de botella técnico utilizando mejores prácticas.
# ==============================================================================
#
# INSTRUCCIONES EN LOCAL:
# 1. Abre este archivo en tu IDE de cabecera (Cursor, VS Code, etc.).
# 2. Resuelve los bloques 'TODO' marcados abajo integrando obligatoriamente
#    las siguientes palabras clave para el Oráculo: [${keywordsStr}]
# 3. Recuerda programar con mentalidad defensiva ante nulos y excepciones.
#
# ==============================================================================

import json
import logging

# Configurar logs audibles en producción (Estilo Enterprise)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

def resolver_mision_semanal(payload: dict) -> dict:
    """
    Función principal de consultoría para resolver la crisis de ${startupName}.
    Recuerda integrar los conceptos requeridos: [${keywordsStr}]
    """
    logging.info("Iniciando procesamiento de la misión para ${startupName}...")
    
    try:
        # TODO: Implementar la lógica del negocio de esta semana.
        # Asegúrate de usar los conceptos de: ${keywordsStr}
        
        # Lógica base sugerida (Modifícala a fondo):
        result = {
            "status": "success",
            "message": "Misión completada con éxito",
            "data": payload
        }
        
        logging.info("Procesamiento finalizado con éxito.")
        return result
        
    except Exception as e:
        logging.error(f"Error crítico en la ejecución del flujo: {str(e)}")
        raise e

# Ejemplo de prueba local:
if __name__ == "__main__":
    test_payload = {"origen": "jtu_lab_semana_${weekNum}"}
    print(resolver_mision_semanal(test_payload))
`;
  } else if (expectedType === "json") {
    commentedTemplate = `{
  "//_jtu_header": "🏛️ JOHTO TECH UNIVERSITY - DEPARTAMENTO DE ARCHIVOS DE DATOS",
  "//_course": "${code} - Semana ${weekNum}",
  "//_startup": "Caso ${startupName} (${startupEmoji})",
  "//_keywords_required": [${keywords.map(k => `"${k}"`).join(", ")}],
  
  "meta": {
    "version": "2028.1.0",
    "developer_credentials": "JTU-STUDENT-REMOTE",
    "transaction_id": "tx_jtu_${code}_w${weekNum}"
  },
  
  "payload": {
    "status": "active",
    "description": "TODO: Completa este JSON integrando los conceptos de la semana",
    "requisitos_adicionales": "${keywordsStr}"
  }
}`;
  } else {
    // SQL / TEXT expected types
    if (ext === "sql") {
      commentedTemplate = `-- ==============================================================================
-- 🏛️ JOHTO TECH UNIVERSITY (JTU) - INGENIERÍA DE BASES DE DATOS Y AUTOMATIZACIÓN
-- 📚 Cátedra: ${code} - Semana ${weekNum}
-- 💼 Caso de Negocio: ${startupName} (${startupEmoji})
-- 🎯 SQL Blueprint de Integridad y Consulta Profesional
-- ==============================================================================
--
-- INSTRUCCIONES:
-- Completa el script SQL integrando obligatoriamente los conceptos: [${keywordsStr}]
-- Asegura una extensión de caracteres mayor a ${minLength}.
--
-- ==============================================================================

-- TODO: Escribe tu esquema, trigger, consulta o procedimiento almacenado abajo.
-- Asegúrate de usar palabras clave del Oráculo: [${keywordsStr}]

SELECT 
  current_timestamp AS fecha_consulta,
  '${code}_SEMANA_${weekNum}' AS identificador_cátedra,
  '${startupName}' AS startup_auditada;
`;
    } else {
      commentedTemplate = `==============================================================================
🏛️ JOHTO TECH UNIVERSITY (JTU) - REPORTE DE INGENIERÍA Y CONSULTORÍA
📚 Cátedra: ${code} - Semana ${weekNum}
💼 Caso de Negocio: ${startupName} (${startupEmoji})
🎯 Entregable Teórico-Metodológico Oficial (JAF Framework)
==============================================================================

INSTRUCCIONES DE REDACCIÓN SOCRÁTICA:
Redacta un ensayo técnico o propuesta de arquitectura que resuelva el brief de ${startupName}.
Recuerda integrar de forma coherente los conceptos obligatorios: [${keywordsStr}]
Longitud mínima requerida: ${minLength} caracteres.

==============================================================================

[TODO: REDACTA AQUÍ TU INFORME TÉCNICO Y PROPUESTA DE ARQUITECTURA]
`;
    }
  }

  // 5. Construct highly realistic dataset file
  let datasetFilename = `${startupName.toLowerCase()}_datos_semana_${weekNum}`;
  let datasetContent = "";
  
  if (startupName === "Veggietopia") {
    datasetFilename = `${datasetFilename}.csv`;
    datasetContent = `id,sucursal,ingrediente_perecedero,inventario_kilos,temperatura_celsius,alerta_caducidad,fecha_registro
1,Johto Centro,Aguacate Orgánico,45.2,4.5,false,2028-05-17 08:30:00
2,Johto Centro,Queso de Almendra,12.8,3.2,false,2028-05-17 08:30:00
3,Goldenrod Norte,Aguacate Orgánico,8.5,8.1,true,2028-05-17 08:35:00
4,Goldenrod Norte,Queso de Almendra,2.4,5.0,true,2028-05-17 08:35:00
5,Violet Outpost,Tofu Ahumado Artesanal,30.0,2.8,false,2028-05-17 08:40:00
6,Violet Outpost,Aguacate Orgánico,50.0,4.2,false,2028-05-17 08:40:00
7,Azalea Cove,Leche de Avena Casera,15.5,5.1,false,2028-05-17 08:45:00
`;
  } else if (startupName === "Paws & Claws") {
    datasetFilename = `${datasetFilename}.json`;
    datasetContent = `{
  "clinicas": [
    {
      "id": 1,
      "nombre": "Paws & Claws - Sede Goldenrod",
      "citas_pendientes": 24,
      "inventario_vacunas_rabia": 85,
      "alertas_caducidad_vacunas": 2,
      "recepcionistas_activas": 3
    },
    {
      "id": 2,
      "nombre": "Paws & Claws - Sede Ecruteak",
      "citas_pendientes": 12,
      "inventario_vacunas_rabia": 40,
      "alertas_caducidad_vacunas": 0,
      "recepcionistas_activas": 2
    }
  ],
  "agenda_simulada": [
    {
      "mascota_id": "pet_1092",
      "nombre_mascota": "Growlithe",
      "especie": "Perro",
      "dueño_nombre": "Koga Trainer",
      "dueño_email": "koga@johtomail.com",
      "vacuna_pendiente": "Refuerzo Antirrábico",
      "fecha_vencimiento": "2028-05-25"
    }
  ]
}`;
  } else {
    // EcoGlow Commerce
    datasetFilename = `${datasetFilename}.csv`;
    datasetContent = `ticket_id,email_cliente,categoria_soporte,mensaje_cliente,urgencia,order_id_shopify,fecha_recibido
t_90832,green_trainer@ecoglow.com,Emergencia Reembolso,"¡Oh no! Mi pedido #EG-9902 llegó roto. El frasco de sérum de vidrio se rompió por completo y goteó todo el empaque.",Alta,EG-9902,2028-05-17 10:15:30
t_90833,red_kanto@kanto.org,Información,"¿Tienen envíos gratuitos a la zona de Ciudad Celeste o Ciudad Azafrán si compro más de $50 USD?",Baja,null,2028-05-17 10:18:12
t_90834,misty_water@sea.com,Venta,"Quiero consultar si sus cremas de noche orgánicas son libres de crueldad animal y 100% hipoalergénicas.",Media,null,2028-05-17 10:20:00
`;
  }

  return {
    ...baseLesson,
    theory,
    template: commentedTemplate,
    datasetContent,
    datasetFilename,
    templateFilename
  };
};

interface KeywordScaffolding {
  analogyTitle: string;
  analogyText: string;
  questionText: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  explanation: string;
}

const getKeywordScaffolding = (keyword: string): KeywordScaffolding => {
  const kw = keyword.toLowerCase().trim();
  
  if (kw.includes("try") || kw.includes("catch") || kw.includes("except")) {
    return {
      analogyTitle: "El Escudo Protector (Manejo de Excepciones)",
      analogyText: "Imagínate que estás en un circo. Un acróbata salta a gran altura. Trabajar con código es igual: a veces ocurren caídas inesperadas (una API externa caída, un valor nulo, un fallo de conexión). El bloque `try-except` es la gran red de seguridad del circo: permite que si el acróbata cae (ocurre un error), la red lo atrape suavemente, evitando que se estrelle contra el suelo (evitando que el programa aborte con pantalla azul de error).",
      questionText: "¿Cuál es la función exacta de un bloque 'except' en Python (o 'catch' en Javascript)?",
      options: [
        { id: "opt_correct", text: "Atrapar el error si ocurre una excepción dentro de 'try' y ejecutar un flujo de contingencia.", isCorrect: true },
        { id: "opt_inc1", text: "Forzar al procesador a reintentar la operación infinitamente hasta que funcione.", isCorrect: false },
        { id: "opt_inc2", text: "Ocultar el error al usuario final sin avisar a los desarrolladores.", isCorrect: false }
      ],
      explanation: "El bloque `except` o `catch` captura la excepción del bloque `try` y nos da la oportunidad de manejar el incidente con elegancia (por ejemplo, devolviendo un valor por defecto o alertando al equipo)."
    };
  }
  
  if (kw.includes("logger") || kw.includes("log") || kw.includes("print")) {
    return {
      analogyTitle: "La Caja Negra del Avión (Logging de Eventos)",
      analogyText: "Cuando un avión realiza un viaje, lleva una Caja Negra grabadora. Si algo falla o si todo va bien, los ingenieros pueden consultar esa bitácora para entender el historial del vuelo. Usar `logger` es exactamente eso: en lugar de imprimir mensajes temporales en pantalla con `print` (que se pierden al cerrar el programa), el `logger` escribe un registro permanente y clasificado (DEBUG, INFO, WARNING, ERROR) en un archivo persistente para auditorías de producción.",
      questionText: "¿Por qué un 'logger' es superior a un simple 'print()' para entornos corporativos?",
      options: [
        { id: "opt_correct", text: "Permite clasificar la severidad de los mensajes (INFO, ERROR) y persistirlos de forma permanente en archivos de auditoría.", isCorrect: true },
        { id: "opt_inc1", text: "Hace que el código se ejecute 10 veces más rápido al saltarse la salida estándar.", isCorrect: false },
        { id: "opt_inc2", text: "Envía automáticamente una notificación física a la casa del programador.", isCorrect: false }
      ],
      explanation: "El logging profesional es un pilar de la norma SOC 2. Permite categorizar la severidad e historiar eventos para descubrir fallos difíciles de rastrear."
    };
  }
  
  if (kw.includes("raise") || kw.includes("throw") || kw.includes("error")) {
    return {
      analogyTitle: "La Alarma de Incendios Activa (Propagación de Errores)",
      analogyText: "Imagina un banco comercial. Si una caja de seguridad detecta que se intenta retirar dinero con una llave duplicada, no se limita a poner un mensajito en pantalla. Dispara una alarma sonora masiva que cierra las puertas y alerta a la policía. El comando `raise` (o `throw`) es esa palanca de alarma: detiene el flujo normal de inmediato para alertar que ha ocurrido una anomalía severa que debe ser atendida obligatoriamente por los niveles superiores.",
      questionText: "¿Qué ocurre cuando ejecutas una instrucción 'raise ValueError(...)' en tu script de Python?",
      options: [
        { id: "opt_correct", text: "Interrumpe la ejecución del bloque actual y propaga el error hacia arriba para ser atrapado o detener la app.", isCorrect: true },
        { id: "opt_inc1", text: "Duplica la memoria disponible para el proceso de cálculo.", isCorrect: false },
        { id: "opt_inc2", text: "Borra la base de datos de forma preventiva ante un posible hackeo.", isCorrect: false }
      ],
      explanation: "El uso de `raise` propaga la excepción intencionalmente hacia arriba de la pila de llamadas, forzando a los componentes superiores a lidiar con el error de forma segura."
    };
  }

  if (kw.includes("key") || kw.includes("foreign") || kw.includes("table") || kw.includes("constraint")) {
    return {
      analogyTitle: "La Placa de Identidad Única (Llaves Foráneas e Integridad)",
      analogyText: "Imagina una guardería de mascotas en Johto. Cada mascota lleva en su collar una placa grabada con el ID único de su tutor (la llave foránea). Si intentas dar de baja a un tutor de la base de datos mientras su mascota sigue registrada en la guardería, el sistema de seguridad lo impedirá diciendo: '¡Error de restricción! No puedes eliminar al tutor porque dejarías a la mascota huérfana'. Esto garantiza la integridad referencial.",
      questionText: "¿Cuál es el propósito principal de declarar una 'FOREIGN KEY' (llave foránea) en una base de datos relacional?",
      options: [
        { id: "opt_correct", text: "Garantizar la integridad referencial asegurando que una fila en la tabla A siempre apunte a un registro válido en la tabla B.", isCorrect: true },
        { id: "opt_inc1", text: "Acelerar la conexión a internet del servidor Postgres.", isCorrect: false },
        { id: "opt_inc2", text: "Encriptar las contraseñas de todos los clientes corporativos.", isCorrect: false }
      ],
      explanation: "Las llaves foráneas evitan registros huérfanos e inconsistencias de datos, bloqueando la eliminación accidental de registros padres asociados a registros hijos."
    };
  }

  if (kw.includes("webhook") || kw.includes("api") || kw.includes("request")) {
    return {
      analogyTitle: "El Camarero de Mensajes (Webhooks vs. Polling)",
      analogyText: "Imagina que vas a una pizzería de alto ticket. Polling es levantarte a preguntarle al chef cada 30 segundos: ¿Ya está mi pizza? ¿Y ahora? Esto cansa al chef y satura el restaurante. Un Webhook es darle tu WhatsApp al chef: tú te sientas a leer, y en el segundo exacto en que la pizza sale del horno, el chef te envía un mensaje automático avisándote. Es comunicación asíncrona de alto rendimiento empujada por eventos.",
      questionText: "¿Cuál es la diferencia operativa clave entre hacer Polling (consultas repetitivas) y recibir un Webhook?",
      options: [
        { id: "opt_correct", text: "El Webhook es empujado por el servidor cuando ocurre el evento de forma asíncrona, eliminando tráfico y latencia innecesarios.", isCorrect: true },
        { id: "opt_inc1", text: "El Polling requiere encriptación cuántica obligatoria.", isCorrect: false },
        { id: "opt_inc2", text: "Los Webhooks solo funcionan en servidores locales sin internet.", isCorrect: false }
      ],
      explanation: "Los Webhooks son orientados a eventos, lo que significa que el servidor emisor envía un POST HTTP con la carga útil directamente a tu endpoint en el instante exacto del suceso, optimizando recursos."
    };
  }

  if (kw.includes("vector") || kw.includes("embedding") || kw.includes("pgvector")) {
    return {
      analogyTitle: "La Biblioteca de Vibras y Conceptos (pgvector y Embeddings)",
      analogyText: "Imagina una biblioteca mágica donde los libros no se ordenan alfabéticamente ni por autor, sino por su 'vibra' o significado profundo. Si buscas 'remedio natural para calmar el estrés de un perrito', pgvector entiende el concepto semántico (el embedding) y te guía directamente al estante de 'bienestar animal', cerca de 'hierbas relajantes' y lejos de 'carreras de autos'. Buscamos por cercanía conceptual, no por coincidencia exacta de texto.",
      questionText: "¿Por qué usamos la extensión 'pgvector' en Supabase para búsquedas de Inteligencia Artificial?",
      options: [
        { id: "opt_correct", text: "Permite almacenar embeddings vectoriales generados por LLMs y realizar búsquedas de similitud semántica de alta velocidad.", isCorrect: true },
        { id: "opt_inc1", text: "Sirve para dibujar gráficos tridimensionales en la pantalla del usuario.", isCorrect: false },
        { id: "opt_inc2", text: "Comprime los archivos PDF para ahorrar un 95% de almacenamiento.", isCorrect: false }
      ],
      explanation: "Los embeddings convierten ideas en listas de números (vectores). Con pgvector, podemos usar operadores matemáticos de distancia (coseno, L2) para buscar conceptos similares de forma ultra-rápida."
    };
  }

  if (kw.includes("docker") || kw.includes("container") || kw.includes("vps") || kw.includes("dockerfile")) {
    return {
      analogyTitle: "Las Casas Prefabricadas Idénticas (Docker y Containers)",
      analogyText: "Docker es como construir casas de madera modulares idénticas dentro de una fábrica sellada. No importa si tu cliente final vive en una playa húmeda, en una montaña nevada o en el desierto (servidores Linux, Windows o macOS): tú transportas la casa en un contenedor sellado y arranca a funcionar en 5 segundos exactamente igual que en tu laboratorio. Te olvidas del típico error de 'en mi computadora sí funciona'.",
      questionText: "@¿Cuál es el beneficio de empaquetar una aplicación web dentro de un contenedor Docker?",
      options: [
        { id: "opt_correct", text: "Garantiza la portabilidad absoluta del software aislando la app, dependencias y configuración en cualquier entorno.", isCorrect: true },
        { id: "opt_inc1", text: "Duplica la velocidad del procesador físico del servidor.", isCorrect: false },
        { id: "opt_inc2", text: "Elimina la necesidad de escribir código en lenguajes como Python o JS.", isCorrect: false }
      ],
      explanation: "Al aislar todo el entorno operativo en una imagen Docker, eliminamos los problemas de incompatibilidad de dependencias entre desarrollo y producción."
    };
  }

  // Generic Fallback
  return {
    analogyTitle: `Fundamentos de ${keyword.toUpperCase()} (Cátedra JTU)`,
    analogyText: `El concepto de ${keyword} es un pilar fundamental en la ingeniería de sistemas modernos. Permite estructurar flujos de datos resilientes, escalables y seguros, garantizando la consistencia del negocio bajo estándares de alta disponibilidad y robustez técnica.`,
    questionText: `¿Cuál es el beneficio primordial de integrar de forma correcta el concepto '${keyword}' en tu arquitectura de software?`,
    options: [
      { id: "opt_correct", text: `Optimiza la coherencia, resiliencia y estabilidad del flujo operativo del sistema ante casos límite y condiciones de producción.`, isCorrect: true },
      { id: "opt_inc1", text: "Garantiza que el código se compile directamente en código de máquina binario sin pasar por un intérprete.", isCorrect: false },
      { id: "opt_inc2", text: "Permite cambiar el color de la interfaz de la base de datos de forma automática.", isCorrect: false }
    ],
    explanation: `Dominar ${keyword} es un paso esencial para transicionar de ser un programador básico a un arquitecto de software de alto ticket capaz de certificar resiliencia.`
  };
};

interface CompendiumPage {
  title: string;
  subtitle: string;
  icon: string;
  content: string;
}

const getWeeklyCompendiumChapters = (course: Course, weekNum: number, lesson: EnrichedLesson): CompendiumPage[] => {
  const startup = lesson.theory.includes("Veggietopia") 
    ? "Veggietopia 🥦 (Hidroponía & Restaurantes)" 
    : lesson.theory.includes("Paws & Claws") 
      ? "Paws & Claws 🐶 (Veterinarias & E-commerce)" 
      : "EcoGlow Commerce 🌿 (Cosmética & AI Agents)";
      
  const keywords = lesson.verificationCriteria.keywords;
  const formattedKeywords = keywords.map(k => `\`${k}\``).join(", ");
  
  return [
    {
      title: "1. Portada y Hoja de Ruta",
      subtitle: "Certificación Oficial de Cátedra JTU",
      icon: "📚",
      content: `# 🏛️ JOHTO TECH UNIVERSITY
## Facultad de Ingeniería de Software y Sistemas de Información
### CÁTEDRA OFICIAL: \`${course.code}\` — SEMESTRE ${course.semester}

---

**Lección de la Semana ${weekNum}:** ${lesson.title}
**Caso Práctico:** ${startup}
**Oráculo de Verificación:** ${formattedKeywords}

---

### 📝 Mensaje del Decanato de JTU:
"Estimado estudiante, este compendio representa 4 horas de cátedra intensiva presencial condensadas en un recurso académico de élite. Estúdialo con rigor científico. La programación defensiva, el diseño de bases de datos resilientes y la orquestación semántica no son modas pasajeras: son las vías de acero de la infraestructura tecnológica global."

---

### 🗺️ Hoja de Ruta Semanal (Estimación de 4 Horas):
1. **Hora 1: Fundamentación Teórica** (Comprensión de Big-O y ciclos de vida).
2. **Hora 2: Laboratorio de Diseño** (Maquetación y diagramas de flujo).
3. **Hora 3: Programación Defensiva** (Estructura de código con control de fallos).
4. **Hora 4: Auditoría y Despliegue** (SOC 2, RLS y entrega formal)."
`
    },
    {
      title: "2. Fundamentos Científicos",
      subtitle: "Modelado Matemático e Ingeniería de CPU",
      icon: "🔬",
      content: `# 🔬 Fundamentos Científicos Absolutos
En entornos de producción masivos, cada milisegundo de ejecución y cada byte consumido repercute directamente en la factura de la nube (Cloud Cost Optimization) y en la experiencia de usuario (SLA).

### 📊 Complejidad Computacional (Big-O Notation):
Cuando operamos con algoritmos de andamiaje, el análisis de complejidad nos ayuda a anticipar la degradación del sistema:
*   **Búsquedas Semánticas (pgvector)**: La comparación lineal $O(N)$ es inviable para bases de datos masivas. Estudiamos índices avanzados como **HNSW** (Hierarchical Navigable Small World) que reducen la búsqueda semántica a una complejidad de tipo $O(\\log N)$.
*   **Manejo de Excepciones**: Los bloques \`try-except\` en lenguajes interpretados como Python incurren en una sobrecarga de memoria mínima en el "Happy Path" (cuando no hay error). Sin embargo, cuando se dispara un error, el desempaquetado de la pila de llamadas (Traceback Stack Unwinding) incrementa la latencia temporal de forma exponencial.

### 🧠 Ciclo de Vida de los Recursos en Memoria (Heap vs Stack):
*   **Pila (Stack)**: Almacena variables de control rápido y referencias a subworkflows locales. Su asignación es ultra-rápida y automática.
*   **Montículo (Heap)**: Estructuras grandes como dataframes de Pandas, payloads JSON multinivel de webhooks o respuestas semánticas completas de LLMs. Una mala gestión de referencias causa fugas de memoria (Memory Leaks) en servidores de producción de ejecución continua.
`
    },
    {
      title: "3. Anatomía y Patrones",
      subtitle: "Diseño de Sistemas Robustos",
      icon: "📐",
      content: `# 📐 Anatomía y Patrones de Diseño
El desarrollo moderno exige la aplicación de patrones de diseño clásicos de la ingeniería de software para evitar el "Código Espagueti" y garantizar el mantenimiento a largo plazo.

### 🛠️ Patrón Circuit Breaker (Corta-Fuegos):
Si una API externa o base de datos falla repetidamente, el Circuit Breaker "abre" el circuito de forma preventiva. Evitamos saturar al servidor externo moribundo y devolvemos respuestas degradadas seguras (graceful degradation) de forma instantánea.

\`\`\`python
# Estructura del Patrón Circuit Breaker Conceptual
class CircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=60):
        self.state = "CLOSED"  # CLOSED, OPEN, HALF-OPEN
        self.failures = 0
        
    def execute(self, func, *args, **kwargs):
        if self.state == "OPEN":
            return "Fallback: Servidor en mantenimiento temporal."
        try:
            result = func(*args, **kwargs)
            self.failures = 0
            return result
        except Exception as e:
            self.failures += 1
            if self.failures >= 5:
                self.state = "OPEN"
            raise e
\`\`\`

### ⚡ Patrón Observer (Observador Asíncrono):
Ideal para la implementación de **Webhooks**: el emisor no espera a que el receptor procese la información. Simplemente emite el evento y continúa con su ciclo operativo, garantizando máxima concurrencia.`
    },
    {
      title: "4. Casos Reales",
      subtitle: "Rigor Industrial en Producción",
      icon: "💼",
      content: `# 💼 Casos Reales de la Industria
Aprender de las trincheras de las empresas líderes tecnológicas es fundamental para un graduado de JTU.

### 💳 Stripe y las Firmas de Webhooks:
Stripe procesa miles de millones de transacciones de cobros al día. Para avisar a sus clientes que una suscripción se cobró con éxito, utiliza **Webhooks**.
*   **El Problema**: Cualquier hacker podría enviar un POST falso simulando un pago exitoso para robar servicios.
*   **La Solución**: Stripe firma digitalmente cada webhook usando un secreto compartido y una firma hash **HMAC SHA-256**. El cliente receptor valida la firma usando criptografía defensiva antes de procesar el pago.

### 🎬 Netflix y Chaos Monkey (Manejo Defensivo):
Netflix diseña sus microservicios asumiendo que **todo va a fallar en cualquier momento**. Chaos Monkey es un software que apaga servidores en producción de forma aleatoria a propósito. Gracias a una arquitectura defensiva blindada, el usuario en su sofá nunca nota una interrupción en su película.`
    },
    {
      title: "5. Escenario de la Startup",
      subtitle: "Diagnóstico Clínico y Telemetría",
      icon: "📊",
      content: `# 📊 Escenario de la Startup
Volvamos al caso semanal de **${startup}**. A continuación, exponemos la telemetría y logs de producción reales capturados en el servidor central:

### 📡 Logs de Error en Vivo (Consola del Servidor JTU):
\`\`\`bash
[2028-05-18 08:12:43] [WARNING] [API_GATEWAY] Connection slow to DB. Timeout 5000ms reached.
[2028-05-18 08:12:48] [ERROR]   [WEBHOOK_HANDLER] Failed to POST payload to client endpoint. Status: 504 Gateway Timeout.
[2028-05-18 08:12:49] [CRITICAL][SYSTEM] Exception unhandled: 'NoneType' object has no attribute 'get'. Stopping worker process!
\`\`\`

### 📉 Impacto en Pérdidas Operativas:
*   **Latencia Promedio**: Incremento de \`340ms\` a \`4800ms\` por llamadas síncronas bloqueantes (Falta de Webhooks / Colas).
*   **Pérdida Financiera Estimada**: \`$1,200 USD\` diarios en órdenes perdidas debido a colapsos de memoria silenciosos.
*   **Solución Clave**: Diseñar un andamiaje que controle las excepciones de forma defensiva, procese asíncronamente mediante webhooks y asocie datos relacionales mediante llaves foráneas seguras.`
    },
    {
      title: "6. Manual de Hardening",
      subtitle: "Ciberseguridad y Normas SOC 2",
      icon: "🛡️",
      content: `# 🛡️ Manual de Hardening y Seguridad (SOC 2 Check)
La seguridad no es una capa externa: se teje en cada línea de código. Todo sistema JTU debe cumplir con las siguientes directrices de blindaje:

### 🤐 1. Cero Credenciales Quemadas (Zero Hardcoded Secrets):
Nunca guardes llaves de API, contraseñas o URLs de bases de datos directamente en el código. Utiliza variables de entorno cifradas de forma estricta.

### 💉 2. Prevención de Inyecciones SQL:
Al utilizar consultas complejas en Postgres, utiliza consultas parametrizadas o mapeadores ORM seguros. Jamás concatenes texto ingresado por el usuario directamente en consultas SQL.

### 🛡️ 3. Row Level Security (RLS) en Supabase:
Al habilitar tablas en Supabase, activa siempre RLS:
\`\`\`sql
ALTER TABLE jtu.socratic_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student can only read their own logs"
ON jtu.socratic_chat_history
FOR SELECT
USING (auth.uid() = student_id);
\`\`\`
Esto garantiza que ningún alumno pueda espiar o alterar las notas de sus compañeros, cumpliendo con las regulaciones SOC 2.`
    },
    {
      title: "7. Laboratorio Guiado",
      subtitle: "Recetario Práctico y Snippets",
      icon: "🛠️",
      content: `# 🛠️ Laboratorio Guiado Paso a Paso
A continuación, se detalla la receta de código idónea para estructurar la solución de esta semana en base a los criterios de evaluación del Oráculo:

### 🐍 Recetario Python Profesional (Manejo Defensivo y Logging):
\`\`\`python
import logging
import os

# Configuración profesional de bitácora
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("JTU_Academia")

def procesar_transaccion_defensiva(payload: dict) -> bool:
    try:
        # Validación defensiva ante nulos
        if not payload:
            raise ValueError("Payload de transacción vacío o nulo.")
            
        transaccion_id = payload.get("id")
        monto = payload.get("monto")
        
        logger.info(f"Procesando transacción {transaccion_id} de forma segura.")
        
        # Simulación de inserción con validación de datos
        if monto < 0:
            raise ValueError(f"Monto inválido detectado: {monto}")
            
        return True
        
    except ValueError as ve:
        logger.warning(f"Error de validación capturado: {str(ve)}")
        return False
    except Exception as e:
        logger.error(f"Fallo crítico inesperado de infraestructura: {str(e)}")
        # Propagación de contingencia
        raise e
\`\`\``
    },
    {
      title: "8. Glosario y Evaluación",
      subtitle: "Glosario Científico y Autoevaluación",
      icon: "🎓",
      content: `# 🎓 Glosario Académico y Autoevaluación

### 📚 Glosario JTU:
1. **Programación Defensiva**: Filosofía de desarrollo que asume la posibilidad de fallos y diseña el software para responder ante ellos de forma predecible y segura.
2. **Webhook**: Endpoint HTTP que recibe eventos asíncronos distribuidos en tiempo real desde un sistema emisor externo.
3. **Integridad Referencial**: Regla de base de datos que garantiza que las asociaciones entre tablas se mantengan coherentes y válidas.

---

### ❓ Cuestionario de Autoevaluación Rápida:
*   **Pregunta 1**: Si tu logger está imprimiendo en disco en un hilo bloqueante y la tasa de logs sube a 100,000 por segundo, ¿qué le ocurrirá a la CPU?
    *   *Respuesta*: Se producirá un cuello de botella de I/O de disco. En producción, debemos configurar loggers asíncronos con buffers de memoria intermedios.
*   **Pregunta 2**: ¿Qué tipo de índice Postgres optimiza las consultas vectoriales de embeddings?
    *   *Respuesta*: El índice HNSW (Hierarchical Navigable Small World) o IVFFlat.`
    }
  ];
};

const getInitialSocraticMessages = (courseCode: string, weekNum: number, lesson: EnrichedLesson) => {
  const startup = lesson.theory.includes("Veggietopia") 
    ? "Veggietopia 🥦" 
    : lesson.theory.includes("Paws & Claws") 
      ? "Paws & Claws 🐶" 
      : "EcoGlow Commerce 🌿";
  
  return [
    {
      sender: "professor" as const,
      text: `### 🏛️ UNIVERSIDAD DE JOHTO — DIALÉCTICA SOCRÁTICA
Estimado colega, bienvenido a la mesa de debate de la **Semana ${weekNum}** de la cátedra \`${courseCode}\`.

Hoy analizaremos el caso crítico de la startup **${startup}**. Como futuro arquitecto de datos e inteligencia artificial de Johto Tech University, tu deber no es escribir código de forma mecánica, sino defender con solidez y rigor académico tus decisiones de diseño de software.

¿Por dónde deseas que comencemos nuestra sesión dialéctica hoy?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "concept" as const
    }
  ];
};

const getInitialOptions = (courseCode: string, weekNum: number, lesson: EnrichedLesson) => {
  const keywords = lesson.verificationCriteria.keywords;
  const firstKeyword = keywords[0] || "Programación Defensiva";
  return [
    {
      id: "option_start_scaffolding",
      text: `🎓 Iniciar Aula Interactiva JTU (Concepto 1: ${firstKeyword})`,
      nextStep: "scaffolding" as const
    },
    {
      id: "option_challenge",
      text: "⚡ Saltar directo a la defensa (Solo si dominas los conceptos)",
      nextStep: "tech_challenge" as const
    }
  ];
};

const generateLocalSocraticCritique = (
  courseCode: string, 
  weekNum: number, 
  lesson: EnrichedLesson, 
  defense: string
): { success: boolean; grade: number; feedback: string } => {
  const cleanDefense = defense.trim();
  const criteria = lesson.verificationCriteria;
  const keywords = criteria.keywords;
  const minLength = Math.max(criteria.minLength || 60, 45);

  if (cleanDefense.length < minLength) {
    return {
      success: false,
      grade: parseFloat((2.0 + Math.random() * 2.5).toFixed(1)),
      feedback: `### ❌ EXAMEN PARCIAL FALLIDO — TESIS RECHAZADA
**Rigor de Cátedra JTU**: Tu argumentación es demasiado superficial y carece de madurez científica. Redactaste apenas **${cleanDefense.length} caracteres**, mientras que el estándar universitario requiere al menos **${minLength} caracteres** para una justificación arquitectónica aceptable.

**Sugerencia del Decano**: Evita las explicaciones vagas. Explica detalladamente cómo tu propuesta mitiga pérdidas financieras, cómo previene excepciones en tiempo de ejecución, y por qué el diseño de base de datos elegido es óptimo para la startup.`
    };
  }

  const missingKeywords: string[] = [];
  const defenseLower = cleanDefense.toLowerCase();
  
  for (const kw of keywords) {
    if (!defenseLower.includes(kw.toLowerCase())) {
      missingKeywords.push(kw);
    }
  }

  if (missingKeywords.length > 0) {
    const isOne = missingKeywords.length === 1;
    return {
      success: false,
      grade: parseFloat((4.0 + Math.random() * 2.0).toFixed(1)),
      feedback: `### ⚠️ REVISIÓN ACADÉMICA REQUERIDA — FALTA DE RIGOR TÉCNICO
Tu propuesta metodológica aborda el caso, pero incurre en una grave omisión técnica al ignorar el uso y la justificación de ${isOne ? "la palabra clave fundamental" : "los pilares clave del Oráculo"}: **${missingKeywords.map(k => `\`${k}\``).join(", ")}**.

En la Facultad de Ingeniería de JTU, enseñamos que una arquitectura defensiva exitosa no puede omitir estos componentes sin comprometer el retorno de inversión (ROI) corporativo y la integridad transaccional.

**Directriz**: Por favor, reformula tu defensa integrando explícitamente conceptos socráticos que justifiquen cómo aplicarás **${missingKeywords.join(", ")}** para resolver la crisis de la startup.`
    };
  }

  const baseGrade = 8.5;
  const randomBonus = Math.random() * 1.5;
  const grade = parseFloat((baseGrade + randomBonus).toFixed(1));

  const startup = lesson.theory.includes("Veggietopia") 
    ? "Veggietopia 🥦" 
    : lesson.theory.includes("Paws & Claws") 
      ? "Paws & Claws 🐶" 
      : "EcoGlow Commerce 🌿";

  return {
    success: true,
    grade,
    feedback: `### 🎓 ¡TESIS APROBADA CON MÉRITO ACADÉMICO!
**Calificación Socrática**: \`${grade} / 10.0\` (Aprobación de Cátedra JTU)

Estimado colega, tu defensa de arquitectura técnica para **${startup}** es extraordinariamente sólida. Has demostrado un entendimiento intachable de las asunciones del negocio, justificando con maestría técnica la implementación de **${keywords.map(k => `\`${k}\``).join(", ")}** para blindar la operación.

**Comentario del Catedrático**: 
* Tu lógica no tiene vacíos cognitivos y prevé el manejo seguro de excepciones.
* La solución mitiga efectivamente el riesgo de pérdida financiera del cliente.
* Has ganado **+1.0 Puntos de Acreditación Socrática** para tu auditoría final de código.

He registrado tu aprobación en el acta digital. El entorno del editor y auditor a tu derecha ha sido **totalmente desbloqueado** para tu entrega de código final. ¡Excelente trabajo!`
  };
};

export default function AcademiaPage() {
  const router = useRouter()
  const pkdBalance = useEconomyStore((s) => s.pkdBalance)
  const { 
    kardex, 
    activeCourseCode, 
    selectCourse, 
    completeWeek, 
    getGPA, 
    getCreditsEarned, 
    resetAcademy 
  } = useAcademyStore()

  const computedSkills = React.useMemo(() => {
    const skills = {
      backend: 10,
      database: 10,
      automation: 10,
      ai: 10,
      strategy: 10,
    };

    JTU_CURRICULUM.forEach((course) => {
      const state = kardex[course.code];
      if (!state) return;

      const isCompleted = state.status === "completed";
      const isUnlocked = state.status === "unlocked";
      const progressBonus = isCompleted ? 15 : isUnlocked ? (state.currentWeek / 16) * 10 : 0;
      const gradeBonus = isCompleted && state.grade ? (state.grade / 10) * 5 : 0;
      const totalContribution = progressBonus + gradeBonus;

      if (course.code.startsWith("MAP-1")) {
        skills.strategy += totalContribution * 0.6;
        skills.automation += totalContribution * 0.4;
      } else if (course.code.startsWith("MAP-2")) {
        skills.automation += totalContribution * 0.7;
        skills.backend += totalContribution * 0.3;
      } else if (course.code.startsWith("MAP-3")) {
        skills.backend += totalContribution * 0.8;
        skills.automation += totalContribution * 0.2;
      } else if (course.code.startsWith("MAP-4")) {
        skills.database += totalContribution * 0.7;
        skills.backend += totalContribution * 0.3;
      } else if (course.code.startsWith("MAP-5")) {
        skills.ai += totalContribution * 0.6;
        skills.database += totalContribution * 0.4;
      } else if (course.code.startsWith("MAP-6")) {
        skills.ai += totalContribution * 0.9;
        skills.backend += totalContribution * 0.1;
      } else if (course.code.startsWith("MAP-7")) {
        skills.backend += totalContribution * 0.5;
        skills.ai += totalContribution * 0.5;
      } else if (course.code.startsWith("MAP-8")) {
        skills.strategy += totalContribution * 0.9;
        skills.automation += totalContribution * 0.1;
      } else {
        skills.backend += totalContribution * 0.2;
        skills.database += totalContribution * 0.2;
        skills.automation += totalContribution * 0.2;
        skills.ai += totalContribution * 0.2;
        skills.strategy += totalContribution * 0.2;
      }
    });

    return {
      backend: Math.min(100, Math.round(skills.backend)),
      database: Math.min(100, Math.round(skills.database)),
      automation: Math.min(100, Math.round(skills.automation)),
      ai: Math.min(100, Math.round(skills.ai)),
      strategy: Math.min(100, Math.round(skills.strategy)),
    };
  }, [kardex]);

  const [activeTab, setActiveTab] = useState<"study" | "kardex">("study")
  const [selectedSemester, setSelectedSemester] = useState<number>(1)
  const [submissionCode, setSubmissionCode] = useState<string>("")
  const [copySuccess, setCopySuccess] = useState(false)

  // Auditor Terminal Simulation States
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditLogs, setAuditLogs] = useState<string[]>([])
  const [auditResult, setAuditResult] = useState<{
    success: boolean;
    grade: number;
    feedback: string;
  } | null>(null)

  // Selected week review states
  const [viewedWeekNum, setViewedWeekNum] = useState<number | null>(null)

  // Expanded editor deep work state
  const [isExpandedAuditor, setIsExpandedAuditor] = useState(false)
  const [layoutMode, setLayoutMode] = useState<"zen" | "split">("split")

  // Custom Dropdown UI States
  const [isSemDropdownOpen, setIsSemDropdownOpen] = useState(false)
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false)
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false)

  // 🧪 SOCRATIC CHAT RPG STATES
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const [chatInputValue, setChatInputValue] = useState("")
  const [isProfessorWriting, setIsProfessorWriting] = useState(false)
  const [chatDialogueStep, setChatDialogueStep] = useState<"intro" | "scaffolding" | "scaffolding_check" | "analogy" | "business" | "tech_challenge" | "waiting_defense" | "hint" | "completed">("intro")
  const [socraticConceptIndex, setSocraticConceptIndex] = useState<number>(0)
  const [suggestedOptions, setSuggestedOptions] = useState<any[]>([])
  const [socraticGrade, setSocraticGrade] = useState<number | null>(null)
  const [chatMode, setChatMode] = useState<"text" | "chat">("chat")

  // Compendium Book Reader Modal States
  const [isCompendiumOpen, setIsCompendiumOpen] = useState(false)
  const [activeCompendiumPage, setActiveCompendiumPage] = useState(0)
  const [compendiumFontSize, setCompendiumFontSize] = useState(16)
  const [compendiumFontFamily, setCompendiumFontFamily] = useState<"sans" | "serif">("sans")

  // Hybrid Supabase loader states
  const [supabaseLesson, setSupabaseLesson] = useState<{
    theory: string;
    template_code: string;
    title: string;
    expected_type: string;
  } | null>(null)
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(false)

  const activeCourse = JTU_CURRICULUM.find((c) => c.code === activeCourseCode) || JTU_CURRICULUM[0]
  
  // Hydrated active course state
  const activeCourseState = kardex[activeCourse.code] || {
    status: activeCourse.semester === 1 ? "unlocked" : "locked",
    currentWeek: 1,
    weeklyGrades: {}
  }
  const activeWeekNum = activeCourseState.currentWeek || 1
  const weekNumToRender = viewedWeekNum || activeWeekNum
  const baseWeekLesson = activeCourse.weeks[weekNumToRender - 1] || activeCourse.weeks[0]

  // Async load Supabase week lesson
  useEffect(() => {
    let isMounted = true
    
    async function loadSupabaseData() {
      if (!supabaseReady) {
        setSupabaseLesson(null)
        return
      }
      
      setIsLoadingSupabase(true)
      
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .schema('jtu')
          .from('weeks_metadata')
          .select('theory, template_code, expected_type, title')
          .eq('course_code', activeCourse.code)
          .eq('week', weekNumToRender)
          .single()
          
        if (error) {
          throw error
        }
        
        if (isMounted && data) {
          setSupabaseLesson({
            theory: data.theory || "",
            template_code: data.template_code || "",
            expected_type: data.expected_type || "text",
            title: data.title || ""
          })
        }
      } catch (err: any) {
        console.warn("Supabase fetch failed, falling back to local hybrid generator:", err.message || err)
        if (isMounted) {
          setSupabaseLesson(null)
        }
      } finally {
        if (isMounted) {
          setIsLoadingSupabase(false)
        }
      }
    }
    
    loadSupabaseData()
    
    return () => {
      isMounted = false
    }
  }, [activeCourse.code, weekNumToRender])

  // Enriched lesson using the Dynamic Pedagogical Brain with Supabase support!
  const activeWeekLesson = React.useMemo(() => {
    const localEnriched = enrichWeeklyLesson(activeCourse, weekNumToRender, baseWeekLesson)
    
    if (!supabaseLesson) {
      return localEnriched
    }
    
    const isBasicPlaceholder = 
      supabaseLesson.theory.includes("En esta lección profundizaremos") || 
      supabaseLesson.theory.trim().length < 350
      
    if (isBasicPlaceholder) {
      return localEnriched
    }
    
    return {
      ...localEnriched,
      title: supabaseLesson.title || localEnriched.title,
      theory: supabaseLesson.theory,
      template: supabaseLesson.template_code || localEnriched.template,
      expectedType: (supabaseLesson.expected_type || localEnriched.expectedType) as "text" | "json" | "python",
    }
  }, [activeCourse, weekNumToRender, baseWeekLesson, supabaseLesson])

  // Confetti trigger helper
  const triggerSuccessConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
  }

  // Handle Copy Template
  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(activeWeekLesson.template)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
    confetti({ particleCount: 10, spread: 30, origin: { y: 0.8 } })
  }

  // File Download Helpers
  const triggerDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    confetti({ particleCount: 15, spread: 20 })
  }

  const handleDownloadGuide = () => {
    const filename = `JTU_Guia_Semana_${weekNumToRender}_${activeCourse.code}.md`
    triggerDownload(filename, activeWeekLesson.theory)
  }

  const handleDownloadTemplate = () => {
    triggerDownload(activeWeekLesson.templateFilename, activeWeekLesson.template)
  }

  const handleDownloadDataset = () => {
    triggerDownload(activeWeekLesson.datasetFilename, activeWeekLesson.datasetContent)
  }

  // Set template code when course or week selection changes
  useEffect(() => {
    setSubmissionCode(activeWeekLesson.template)
    setAuditResult(null)
    setAuditLogs([])

    // Check if we already have a grade recorded for this week in Zustand
    const existingGrade = activeCourseState.weeklyGrades[weekNumToRender];

    if (existingGrade && existingGrade >= 7.0) {
      // Reconstruct basic fallback messages so they don't have to redo it
      const fallbackMsgs = [
        {
          sender: "professor" as const,
          text: `### 🏛️ EXAMEN ORAL APROBADO\n\nEstimado colega, has acreditado la defensa dialéctica para la **Semana ${weekNumToRender}** con una calificación socrática de **${existingGrade.toFixed(1)}/10.0**.\n\nEl Auditor de JTU está listo para recibir tu script base a la derecha. ¡Continúa con tu programación!\n\n*(Cargando historial detallado desde la nube...)*`,
          timestamp: "08:00 A.M.",
          type: "feedback" as const
        }
      ];
      setChatHistory(fallbackMsgs)
      setSuggestedOptions([
        {
          id: "option_to_editor",
          text: "💻 Ir al Editor de Código a programar",
          nextStep: "completed" as const
        }
      ])
      setChatDialogueStep("completed")
      setSocraticGrade(existingGrade)
    } else {
      // Initialize Socratic Chat for this week from scratch
      const initialMsgs = getInitialSocraticMessages(activeCourse.code, weekNumToRender, activeWeekLesson)
      setChatHistory(initialMsgs)
      setSuggestedOptions(getInitialOptions(activeCourse.code, weekNumToRender, activeWeekLesson))
      setChatDialogueStep("intro")
      setSocraticConceptIndex(0)
      setChatInputValue("")
      setIsProfessorWriting(false)
      setSocraticGrade(null)
    }
  }, [activeCourseCode, weekNumToRender, activeWeekLesson, activeCourseState.weeklyGrades])

  // Async load detailed Socratic Chat history from Supabase (Persisted Memory)
  useEffect(() => {
    let isMounted = true;
    if (!supabaseReady) return;

    async function loadSocraticHistory() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
          .schema('jtu')
          .from('socratic_chat_history')
          .select('student_thesis, grade, critique')
          .eq('course_code', activeCourse.code)
          .eq('week', weekNumToRender)
          .eq('student_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (isMounted && data && data.length > 0) {
          const evalLog = data[0];
          const grade = typeof evalLog.grade === 'number' ? evalLog.grade : parseFloat(evalLog.grade || "0");
          
          // Reconstruct the exact chat log to make it feel natural and persisted
          const startup = activeWeekLesson.theory.includes("Veggietopia") 
            ? "Veggietopia 🥦" 
            : activeWeekLesson.theory.includes("Paws & Claws") 
              ? "Paws & Claws 🐶" 
              : "EcoGlow Commerce 🌿";

          const reconstructedMsgs = [
            // 1. Initial professor message
            {
              sender: "professor" as const,
              text: `### 🏛️ UNIVERSIDAD DE JOHTO — DIALÉCTICA SOCRÁTICA\n\nEstimado colega, bienvenido a la mesa de debate de la **Semana ${weekNumToRender}** de la cátedra \`${activeCourse.code}\`.\n\nHoy analizaremos el caso crítico de la startup **${startup}**. Como futuro arquitecto de datos e inteligencia artificial de Johto Tech University, tu deber no es escribir código de forma mecánica, sino defender con solidez y rigor académico tus decisiones de diseño de software.\n\n¿Por dónde deseas que comencemos nuestra sesión dialéctica hoy?`,
              timestamp: "08:00 A.M.",
              type: "concept" as const
            },
            // 2. Student chose to go to tech challenge
            {
              sender: "student" as const,
              text: "⚡ Ir directo al grano (Presentación del desafío técnico)",
              timestamp: "08:01 A.M.",
              type: "response" as const
            },
            // 3. Professor's tech challenge prompt
            {
              sender: "professor" as const,
              text: `### ⚡ EL RETO SOCRÁTICO\nExcelente decisión de enfoque, colega. Vamos al corazón del desafío técnico.\n\nPara mitigar el desastre operativo en **${startup}**, tu misión esta semana consiste en estructurar un algoritmo/script defensivo o esquema SQL de alto rendimiento.\n\n**Tu Desafío de Tesis**:\nAntes de que el auditor automático procese tu código, debes defender tu planteamiento lógico. Describe a continuación en la caja de texto:\n1. ¿Cómo estructurarías tu solución para garantizar resiliencia técnica?\n2. ¿Cómo justificarías el uso coordinado de los conceptos clave obligatorios del Oráculo: ${activeWeekLesson.verificationCriteria.keywords.map((k: string) => `\`${k}\``).join(", ")}?\n\n*Escribe tu defensa arquitectónica a continuación para ser evaluada rigurosamente por el Decanato JTU.*`,
              timestamp: "08:01 A.M.",
              type: "concept" as const
            },
            // 4. Student's actual saved thesis!
            {
              sender: "student" as const,
              text: evalLog.student_thesis,
              timestamp: "08:05 A.M.",
              type: "response" as const
            },
            // 5. Professor's actual saved grade and critique!
            {
              sender: "professor" as const,
              text: evalLog.critique,
              timestamp: "08:06 A.M.",
              type: grade >= 7.0 ? ("feedback" as const) : ("challenge" as const)
            }
          ];

          setChatHistory(reconstructedMsgs);
          setSocraticGrade(grade);
          
          if (grade >= 7.0) {
            setChatDialogueStep("completed");
            setSuggestedOptions([
              {
                id: "option_to_editor",
                text: "💻 Ir al Editor de Código a programar",
                nextStep: "completed" as const
              }
            ]);
            // Restore split layout automatically for completed items
            setLayoutMode("split");
          } else {
            setChatDialogueStep("waiting_defense");
            setSuggestedOptions([
              {
                id: "option_hint",
                text: "💡 Solicitar pista conceptual al Catedrático",
                nextStep: "hint" as const
              }
            ]);
          }
        }
      } catch (err) {
        console.warn("Failed to load Socratic Chat history from Supabase:", err);
      }
    }

    loadSocraticHistory();

    return () => {
      isMounted = false;
    };
  }, [activeCourse.code, weekNumToRender, activeWeekLesson, supabaseReady]);

  // Reset reviewed week on course change
  useEffect(() => {
    setViewedWeekNum(null)
  }, [activeCourseCode])

  // Listen for Escape key to close the Compendium Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCompendiumOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Handle Socratic Choices and Decisions
  const handleSelectOption = async (option: any) => {
    if (isProfessorWriting) return;
    
    const studentMsg = {
      sender: "student" as const,
      text: option.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "response" as const
    };
    
    setChatHistory((prev) => [...prev, studentMsg]);
    setSuggestedOptions([]);
    setIsProfessorWriting(true);
    
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    let replyText = "";
    let nextStep: "intro" | "scaffolding" | "scaffolding_check" | "analogy" | "business" | "tech_challenge" | "waiting_defense" | "hint" | "completed" = "intro";
    let nextOptions: any[] = [];
    
    const startup = activeWeekLesson.theory.includes("Veggietopia") 
      ? "Veggietopia 🥦" 
      : activeWeekLesson.theory.includes("Paws & Claws") 
        ? "Paws & Claws 🐶" 
        : "EcoGlow Commerce 🌿";
    
    const keywords = activeWeekLesson.verificationCriteria.keywords;
    
    if (option.nextStep === "scaffolding") {
      const currentIdx = socraticConceptIndex;
      const currentKeyword = keywords[currentIdx] || keywords[0] || "Programación Defensiva";
      const sc = getKeywordScaffolding(currentKeyword);
      
      replyText = `### 🎓 CONCEPTO ${currentIdx + 1}: **${currentKeyword.toUpperCase()}**
#### **${sc.analogyTitle}**
${sc.analogyText}

---

#### 🧠 **Micro-Pregunta de Autoevaluación**:
**${sc.questionText}**`;

      nextStep = "scaffolding_check";
      nextOptions = sc.options.map(opt => ({
        id: `scaff_${currentIdx}_${opt.id}`,
        text: opt.text,
        isCorrect: opt.isCorrect,
        explanation: sc.explanation,
        nextStep: "scaffolding_check" as const
      }));
    } else if (option.nextStep === "scaffolding_check") {
      const currentIdx = socraticConceptIndex;
      const currentKeyword = keywords[currentIdx] || keywords[0] || "Programación Defensiva";
      
      if (option.isCorrect) {
        const nextIdx = currentIdx + 1;
        const hasMore = nextIdx < keywords.length;
        
        if (hasMore) {
          setSocraticConceptIndex(nextIdx);
          const nextKeyword = keywords[nextIdx];
          
          replyText = `### 🎉 ¡RESPUESTA CORRECTA! 🌟
**Explicación del Catedrático**: ${option.explanation || "Excelente razonamiento."}

---

Has dominado el concepto de **${currentKeyword}**. Continuemos ahora con el siguiente concepto de la semana: **${nextKeyword}**.`;
          
          nextStep = "scaffolding";
          nextOptions = [
            {
              id: "option_next_scaffolding",
              text: `🎓 Continuar al Concepto ${nextIdx + 1}: ${nextKeyword}`,
              nextStep: "scaffolding" as const
            }
          ];
        } else {
          replyText = `### 🎉 ¡EXCELENTE TRABAJO! HASTA AQUÍ LA TEORÍA 🏆
**Explicación del Catedrático**: ${option.explanation || "Tu razonamiento técnico es impecable."}

---

Has superado exitosamente el andamiaje del aula interactiva y dominado los pilares de la semana: **${keywords.join(", ")}**.

¡Estamos listos para el reto final! Conectemos tu arsenal teórico con la crisis de la startup **${startup}**.`;
          
          nextStep = "tech_challenge";
          nextOptions = [
            {
              id: "option_go_challenge",
              text: "⚡ Ver el Diagnóstico del Caso y Desafío Técnico",
              nextStep: "tech_challenge" as const
            }
          ];
        }
      } else {
        replyText = `### ⚠️ ESA PROPUESTA TIENE RIESGOS...
El Decanato de JTU te aconseja reconsiderar esa opción. En producción, esa alternativa podría causar fallos silenciosos, inconsistencia de base de datos o colapsos de memoria.

**Pista del Catedrático**: Recuerda el concepto de la analogía. Busca la opción que garantice la integridad y resiliencia total del sistema. ¡Inténtalo de nuevo, colega!`;
        
        nextStep = "scaffolding_check";
        const sc = getKeywordScaffolding(currentKeyword);
        nextOptions = sc.options.map(opt => ({
          id: `scaff_${currentIdx}_${opt.id}`,
          text: opt.text,
          isCorrect: opt.isCorrect,
          explanation: sc.explanation,
          nextStep: "scaffolding_check" as const
        }));
      }
    } else if (option.nextStep === "analogy") {
      const lines = activeWeekLesson.theory.split("\n");
      const analogyIndex = lines.findIndex(l => l.includes("### 💡 C. LA ANALOGÍA"));
      const nextSectionIndex = lines.findIndex(l => l.includes("### 🔬 D. INMERSIÓN"));
      
      let analogyContent = "";
      if (analogyIndex !== -1 && nextSectionIndex !== -1) {
        analogyContent = lines.slice(analogyIndex + 1, nextSectionIndex).join("\n").trim();
      } else {
        analogyContent = `Imagina que tu arquitectura es como construir una casa modular sellada de última generación. Todo componente tiene su rol y no puedes permitir filtraciones ni errores en tiempo de ejecución.`;
      }
      
      replyText = `### 🧠 LA ANALOGÍA DEL DÍA A DÍA
${analogyContent}

¿Qué aspecto de **${startup}** te gustaría analizar a nivel operativo ahora?`;
      nextStep = "analogy";
      nextOptions = [
        {
          id: "option_business",
          text: "💼 Diagnóstico del caso de negocio y ROI operativo",
          nextStep: "business"
        },
        {
          id: "option_challenge",
          text: "⚡ Ir directo al grano (Presentación del desafío técnico)",
          nextStep: "tech_challenge"
        }
      ];
    } else if (option.nextStep === "business") {
      const lines = activeWeekLesson.theory.split("\n");
      const bizIndex = lines.findIndex(l => l.includes("### 🏢 A. EL BRIEF"));
      const nextSectionIndex = lines.findIndex(l => l.includes("### 🧠 B. EL GANCHO"));
      
      let bizContent = "";
      if (bizIndex !== -1 && nextSectionIndex !== -1) {
        bizContent = lines.slice(bizIndex + 1, nextSectionIndex).join("\n").trim();
      } else {
        bizContent = `La startup enfrenta un cuello de botella grave que impacta directamente en sus márgenes de utilidad debido a procesos no controlados y fugas de eficiencia.`;
      }
      
      replyText = `### 💼 EL BRIEF DE CONSULTORÍA DE ALTO TICKET
${bizContent}

¿Deseas profundizar en los conceptos teóricos o pasamos directamente al reto de codificación?`;
      nextStep = "business";
      nextOptions = [
        {
          id: "option_analogy",
          text: "🧠 Explicación conceptual (Analogía del día a día)",
          nextStep: "analogy"
        },
        {
          id: "option_challenge",
          text: "⚡ Ir directo al grano (Presentación del desafío técnico)",
          nextStep: "tech_challenge"
        }
      ];
    } else if (option.nextStep === "tech_challenge") {
      const formattedKeywords = keywords.map(k => `\`${k}\``).join(", ");
      replyText = `### ⚡ EL RETO SOCRÁTICO
Excelente decisión de enfoque, colega. Vamos al corazón del desafío técnico.

Para mitigar el desastre operativo en **${startup}**, tu misión esta semana consiste en estructurar un algoritmo/script defensivo o esquema SQL de alto rendimiento.

**Tu Desafío de Tesis**:
Antes de que el auditor automático procese tu código, debes defender tu planteamiento lógico. Describe a continuación en la caja de texto:
1. ¿Cómo estructurarías tu solución para garantizar resiliencia técnica?
2. ¿Cómo justificarías el uso coordinado de los conceptos clave obligatorios del Oráculo: **${formattedKeywords}**?

*Escribe tu defensa arquitectónica a continuación para ser evaluada rigurosamente por el Decanato JTU.*`;
      nextStep = "waiting_defense";
      nextOptions = [];
    } else if (option.nextStep === "hint") {
      const formattedKeywords = keywords.map(k => `\`${k}\``).join(", ");
      replyText = `### 💡 PISTA DEL CATEDRÁTICO JTU
Veo que estás buscando pulir tu tesis de defensa. Para asegurar una calificación perfecta en la cátedra socrática, asegúrate de mencionar e interconectar estos elementos:

1. **Flujo de Ejecución Seguro**: Explica cómo el código controlará los errores.
2. **Rol de los Conceptos**: Detalla la función exacta de cada palabra clave: **${formattedKeywords}**.
3. **Robustez Financiera**: Justifica el impacto de la automatización en las finanzas de la startup.

*Completa la justificación y envía tu nueva defensa a continuación.*`;
      nextStep = "waiting_defense";
      nextOptions = [];
    } else if (option.nextStep === "completed") {
      replyText = `### 💻 ACCESO CONCEDIDO AL AUDITOR
¡Perfecto! Ya has superado el debate socrático con honores. El Auditor de JTU a la derecha está listo para recibir tu script base. 

¡Adelante y demuestra tu destreza técnica!`;
      nextStep = "completed";
      nextOptions = [];
      setLayoutMode("split");
    }
    
    const profMsg = {
      sender: "professor" as const,
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "concept" as const
    };
    
    setChatHistory((prev) => [...prev, profMsg]);
    setIsProfessorWriting(false);
    setChatDialogueStep(nextStep);
    setSuggestedOptions(nextOptions);
  };

  const handleSendSocraticDefense = async (defenseText: string) => {
    if (!defenseText.trim() || isProfessorWriting) return;
    
    const studentMsg = {
      sender: "student" as const,
      text: defenseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "response" as const
    };
    
    setChatHistory((prev) => [...prev, studentMsg]);
    setChatInputValue("");
    setIsProfessorWriting(true);
    
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    let result;
    const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_ACADEMY_WEBHOOK || "";
    if (n8nWebhookUrl) {
      try {
        const response = await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseCode: activeCourse.code,
            weekNum: weekNumToRender,
            keywords: activeWeekLesson.verificationCriteria.keywords,
            minLength: activeWeekLesson.verificationCriteria.minLength || 60,
            defense: defenseText,
            startupName: activeWeekLesson.theory.includes("Veggietopia") ? "Veggietopia" : activeWeekLesson.theory.includes("Paws & Claws") ? "Paws & Claws" : "EcoGlow Commerce"
          })
        });
        
        if (response.ok) {
          const rawData = await response.json();
          result = {
            success: (rawData.grade || 0) >= 7.0,
            grade: typeof rawData.grade === 'number' ? rawData.grade : parseFloat(rawData.grade || "0"),
            feedback: rawData.critique || rawData.feedback || "Evaluación exitosa pero sin texto descriptivo."
          };
        } else {
          throw new Error("n8n response not ok");
        }
      } catch (err) {
        console.warn("n8n Webhook call failed, falling back to Local Heuristic Evaluator:", err);
        result = generateLocalSocraticCritique(activeCourse.code, weekNumToRender, activeWeekLesson, defenseText);
      }
    } else {
      result = generateLocalSocraticCritique(activeCourse.code, weekNumToRender, activeWeekLesson, defenseText);
    }
    
    // Sync to Supabase Socratic History in background
    if (supabaseReady) {
      try {
        const sb = createClient();
        sb.rpc('fn_save_socratic_evaluation', {
          p_course_code: activeCourse.code,
          p_week: weekNumToRender,
          p_thesis: defenseText,
          p_grade: result.grade,
          p_critique: result.feedback
        }).then(({ data, error }) => {
          if (error) {
            console.warn("Could not save Socratic evaluation log to Supabase:", error.message || error);
          } else {
            console.log("Socratic evaluation log recorded in Supabase history successfully:", data);
          }
        });
      } catch (dbErr) {
        console.warn("Socratic history logging error (non-fatal):", dbErr);
      }
    }
    
    const profMsg = {
      sender: "professor" as const,
      text: result.feedback,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: result.success ? ("feedback" as const) : ("challenge" as const)
    };
    
    setChatHistory((prev) => [...prev, profMsg]);
    setIsProfessorWriting(false);
    
    if (result.success) {
      setSocraticGrade(result.grade);
      setChatDialogueStep("completed");
      setSuggestedOptions([
        {
          id: "option_to_editor",
          text: "💻 Ir al Editor de Código a programar",
          nextStep: "completed" as const
        }
      ]);
      triggerSuccessConfetti();
    } else {
      setChatDialogueStep("waiting_defense");
      setSuggestedOptions([
        {
          id: "option_hint",
          text: "💡 Solicitar pista conceptual al Catedrático",
          nextStep: "hint" as const
        }
      ]);
    }
  };

  // Handle Project Audit
  const handleAudit = async () => {
    if (!submissionCode.trim()) return;
    setIsAuditing(true);
    setAuditResult(null);
    setAuditLogs([]);
  
    const isParcial = activeWeekLesson.isExam === "parcial1" || activeWeekLesson.isExam === "parcial2";
    const isFinal = activeWeekLesson.isExam === "final";
  
    const logs = [
      `[SISTEMA] Iniciando análisis técnico de la Semana ${weekNumToRender}...`,
      isParcial 
        ? `[SISTEMA] ¡MÓDULO DE EVALUACIÓN PARCIAL DETECTADO! Activando validador riguroso...` 
        : isFinal 
          ? `[SISTEMA] ¡MÓDULO DE EXAMEN FINAL DETECTADO! Activando suite integradora JTU...`
          : `[SISTEMA] Cargando criterios de micro-aprendizaje semanal...`,
      `[SISTEMA] Verificando cabeceras y estructura de datos (${activeWeekLesson.expectedType.toUpperCase()})...`,
      `[ORÁCULO] Comparando entrega con especificación del Johto Automation Framework (JAF) 2028...`,
      `[ORÁCULO] Analizando consistencia referencial y buenas prácticas defensivas...`,
      `[ORÁCULO] Compilando reporte socrático final...`
    ];
  
    if (socraticGrade) {
      logs.push(`[ORÁCULO] ¡Bono de Acreditación Socrática JTU Detectado (+1.0 GPA de Examen Oral)!`);
    }
  
    // Simulate real-time logging feedback
    for (let i = 0; i < logs.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 550));
      setAuditLogs((prev) => [...prev, logs[i]]);
    }
  
    await new Promise((resolve) => setTimeout(resolve, 400));
  
    // Perform static heuristics validation
    const submissionLower = submissionCode.toLowerCase();
    const criteria = activeWeekLesson.verificationCriteria;
    const length = submissionCode.trim().length;
    const minLength = criteria.minLength || 60;
  
    let passed = true;
    let missingKeyword = "";
  
    // Length check
    if (length < minLength) {
      passed = false;
    }
  
    // Keyword checks
    if (passed) {
      for (const kw of criteria.keywords) {
        if (!submissionLower.includes(kw.toLowerCase())) {
          passed = false;
          missingKeyword = kw;
          break;
        }
      }
    }
  
    let finalGrade = 0;
    let finalFeedback = "";
  
    if (passed) {
      // Calculate realistic random high grade (8.0 to 10.0)
      const baseVal = 8.0 + Math.random() * 1.0;
      const socraticBonus = socraticGrade ? 1.0 : 0;
      finalGrade = parseFloat(Math.min(10.0, baseVal + socraticBonus).toFixed(1));
      
      // Update store
      const { finishedCourse, gradeCalculated } = await completeWeek(activeCourse.code, finalGrade);
      
      if (finishedCourse) {
        finalFeedback = `¡GRADUACIÓN COMPLETA! Has culminado con éxito todas las 16 semanas de la cátedra "${activeCourse.title}". Tu nota final ponderada (Harvard Weighted) es de **${gradeCalculated || finalGrade} / 10**. Se han depositado +500 PKD atómicamente a tu cuenta y se ha emitido tu diploma oficial.`;
      } else {
        finalFeedback = `Excelente, colega. Tu entrega para la Semana ${weekNumToRender} supera los estándares del Oráculo. Presentas un diseño de arquitectura coherente y limpio (Nota: ${finalGrade}). ¡Avanzas a la Semana ${weekNumToRender + 1}!`;
      }
      
      triggerSuccessConfetti();
    } else {
      // Failed audit
      finalGrade = parseFloat((3.0 + Math.random() * 3.5).toFixed(1));
      if (length < minLength) {
        finalFeedback = `Socrático: Tu entrega es demasiado vaga y carece de madurez técnica (${length} caracteres vs mínimo de ${minLength}). Un consultor sénior debe redactar/programar con suficiente detalle y precisión para convencer a directores corporativos.`;
      } else {
        finalFeedback = `Socrático: Tu entrega carece de un concepto fundamental en esta arquitectura: "**${missingKeyword}**". En JTU enseñamos que omitir este componente de seguridad, integridad relacional o lógica operativa compromete el retorno de inversión y la robustez del sistema. Compleméntalo.`;
      }
    }
  
    setAuditResult({
      success: passed,
      grade: finalGrade,
      feedback: finalFeedback
    });
    setIsAuditing(false);
  };


  // Generate unique holographic Cert ID
  const getCertificateId = (courseCode: string) => {
    let hash = 0
    for (let i = 0; i < courseCode.length; i++) {
      hash = courseCode.charCodeAt(i) + ((hash << 5) - hash)
    }
    return `JLA-${courseCode}-${Math.abs(hash % 9999).toString().padStart(4, "0")}A`
  }

  // Return badge color based on semester
  const getSemesterBadge = (sem: number) => {
    switch (sem) {
      case 1: return "bg-sky-50 text-sky-600 border-sky-200"
      case 2: return "bg-cyan-50 text-cyan-600 border-cyan-200"
      case 3: return "bg-teal-50 text-teal-600 border-teal-200"
      case 4: return "bg-indigo-50 text-indigo-600 border-indigo-200"
      case 5: return "bg-purple-50 text-purple-600 border-purple-200"
      case 6: return "bg-violet-50 text-violet-600 border-violet-200"
      case 7: return "bg-emerald-50 text-emerald-600 border-emerald-200"
      case 8: return "bg-slate-50 text-slate-600 border-slate-200"
      default: return "bg-slate-50 text-slate-600 border-slate-200"
    }
  }

  // Return medal for semester (8 Semesters)
  const getSemesterMedal = (sem: number) => {
    const medals = [
      { name: "Medalla Céfiro", icon: "💎", color: "from-sky-300 to-indigo-400" },
      { name: "Medalla Colmena", icon: "🐝", color: "from-amber-300 to-yellow-500" },
      { name: "Medalla Planicie", icon: "🌸", color: "from-pink-300 to-rose-400" },
      { name: "Medalla Niebla", icon: "👻", color: "from-purple-400 to-indigo-600" },
      { name: "Medalla Tormenta", icon: "⚡", color: "from-yellow-300 to-amber-500" },
      { name: "Medalla Glaciar", icon: "❄️", color: "from-cyan-300 to-blue-400" },
      { name: "Medalla Mineral", icon: "🪨", color: "from-slate-400 to-zinc-500" },
      { name: "Medalla Creciente", icon: "🌙", color: "from-indigo-400 to-slate-900" }
    ]
    return medals[sem - 1] || medals[0]
  }

  // Filter courses by current selected semester
  const currentSemesterCourses = JTU_CURRICULUM.filter(c => c.semester === selectedSemester)
  const gpa = getGPA()
  const credits = getCreditsEarned()

  // Verify if a whole semester is completed to award medal
  const isSemesterCompleted = (sem: number) => {
    const semCourses = JTU_CURRICULUM.filter(c => c.semester === sem)
    return semCourses.every(c => kardex[c.code]?.status === "completed")
  }

  // Handle semester change and auto-select first available course
  const handleSemesterChange = (sem: number) => {
    setSelectedSemester(sem)
    const semCourses = JTU_CURRICULUM.filter(c => c.semester === sem)
    const unlocked = semCourses.find(c => {
      const state = kardex[c.code]
      return state && state.status !== "locked"
    })
    if (unlocked) {
      selectCourse(unlocked.code)
    } else if (semCourses[0]) {
      selectCourse(semCourses[0].code)
    }
    setViewedWeekNum(null)
  }

  // Determine active holographic theme of the selected week lesson
  const examType = activeWeekLesson.isExam
  const isParcialExam = examType === "parcial1" || examType === "parcial2"
  const isFinalExam = examType === "final"

  return (
    <div className="min-h-screen bg-page text-slate-800 relative overflow-hidden px-4 py-8 lg:py-10">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      {/* Glowing Joy-Con Atmosphere Lights */}
      <div className="absolute top-[-150px] left-[-150px] pointer-events-none w-[550px] h-[550px] rounded-full bg-joycon-cyan/10 blur-[120px] animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-[-150px] right-[-150px] pointer-events-none w-[550px] h-[550px] rounded-full bg-nintendo-red/10 blur-[120px] animate-pulse duration-[8000ms]" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        
        {/* ========================================================
            CABECERA PRINCIPAL (PORTAL UNIVERSITARIO)
        ======================================================== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-joycon-cyan before:via-joycon-cyan before:to-nintendo-red">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-joycon-cyan to-nintendo-red rounded-2xl flex items-center justify-center shadow-lg shadow-joycon-cyan/20 relative group overflow-hidden">
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <GraduationCap className="w-8 h-8 text-white relative z-10 drop-shadow-md" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.25em] bg-nintendo-red/15 text-nintendo-red border border-nintendo-red/30 px-2 py-0.5 rounded-md">
                  SWITCH MODE
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  Plan de Estudios 2027 - 2028
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
                Johto Tech University
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Ingeniería en Arquitectura de Automatizaciones y Agentes de IA
              </p>
            </div>
          </div>

          {/* Academic Stats Widgets */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-100/80 border border-slate-200/60 rounded-2xl px-4 py-2 text-center min-w-[70px] shadow-inner">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-0.5">PROMEDIO (GPA)</span>
              <span className={`text-base font-black ${gpa >= 7.0 ? "text-emerald-600 drop-shadow-[0_0_8px_rgba(52,211,153,0.2)]" : gpa > 0 ? "text-amber-600" : "text-slate-500"}`}>
                {gpa > 0 ? `${gpa} / 10` : "—"}
              </span>
            </div>
            <div className="bg-slate-100/80 border border-slate-200/60 rounded-2xl px-4 py-2 text-center min-w-[70px] shadow-inner">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-0.5">CRÉDITOS</span>
              <span className="text-base font-black text-slate-800">
                {credits} <span className="text-[9px] text-joycon-cyan font-bold">/ 96</span>
              </span>
            </div>
            <div className="bg-slate-100/80 border border-slate-200/60 rounded-2xl px-4 py-2 text-center min-w-[70px] shadow-inner">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-0.5">RECOMPENSAS JTU</span>
              <span className="text-base font-black text-amber-700 font-bold flex items-center justify-center gap-1 drop-shadow-[0_0_8px_rgba(250,204,21,0.2)]">
                🪙 {Object.values(kardex).filter(c => c.status === "completed").length * 500}
              </span>
            </div>
            
            {/* Action Buttons */}
            <button 
              onClick={() => router.push("/dashboard")}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-wider px-5 py-3 rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 border border-slate-700 ml-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver al Hub
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-white/85 p-1.5 rounded-2xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.3)] w-fit gap-1">
          <button 
            onClick={() => setActiveTab("study")}
            style={activeTab === "study" ? { backgroundColor: "#00C3E3", color: "#FFFFFF" } : {}}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "study" ? "text-white shadow-lg scale-105 active:scale-95" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <BookMarked className="w-4 h-4" />
            Cátedras de Estudio
          </button>
          <button 
            onClick={() => setActiveTab("kardex")}
            style={activeTab === "kardex" ? { backgroundColor: "#E60012", color: "#FFFFFF" } : {}}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "kardex" ? "text-white shadow-lg scale-105 active:scale-95" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FileSignature className="w-4 h-4" />
            Kardex Universitario
          </button>
        </div>

        {/* ========================================================
            TAB 1: PANEL DE ESTUDIO Y AUDITORÍA
        ======================================================== */}
        <AnimatePresence mode="wait">
          {activeTab === "study" && (
            <motion.div 
              key="study"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* BARRA DE NAVEGACIÓN ACADÉMICA HORIZONTAL */}
              <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl border border-slate-200 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 flex-1 max-w-4xl">
                  {/* Semester Dropdown */}
                  <div className="relative shrink-0">
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block mb-1">Mapa Curricular</span>
                    <button
                      onClick={() => {
                        setIsSemDropdownOpen(!isSemDropdownOpen)
                        setIsCourseDropdownOpen(false)
                        setIsWeekDropdownOpen(false)
                      }}
                      className="w-full sm:w-48 px-4 py-2.5 rounded-2xl border border-slate-200 hover:border-joycon-cyan/50 bg-[#f8fafc] text-[11px] font-black text-slate-800 flex items-center justify-between gap-2 cursor-pointer shadow-sm transition-all hover:bg-slate-100"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm">{getSemesterMedal(selectedSemester).icon}</span>
                        <span>Semestre {selectedSemester}</span>
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    </button>

                    {isSemDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsSemDropdownOpen(false)} />
                        <div className="absolute left-0 mt-2 w-64 bg-[#f8fafc] border border-slate-200 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden">
                          <span className="px-4 py-1 text-[9px] font-black text-slate-600 uppercase tracking-widest block border-b border-slate-200 pb-1.5 mb-1.5">
                            Seleccionar Semestre (1-8)
                          </span>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                            const active = selectedSemester === sem
                            const completedSem = isSemesterCompleted(sem)
                            const medal = getSemesterMedal(sem)
                            return (
                              <button
                                key={sem}
                                onClick={() => {
                                  handleSemesterChange(sem)
                                  setIsSemDropdownOpen(false)
                                }}
                                className={`w-full text-left px-4 py-2.5 text-[11px] flex items-center justify-between transition-colors ${
                                  active 
                                    ? "bg-joycon-cyan text-white font-black shadow-lg shadow-joycon-cyan/20" 
                                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <span className="text-sm">{medal.icon}</span>
                                  <span>Semestre {sem} • <span className={active ? "text-slate-800" : "text-slate-500"}>{medal.name}</span></span>
                                </span>
                                {completedSem && (
                                  <span className="bg-emerald-500 text-white text-[7px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                                    ✓
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Course Dropdown */}
                  <div className="relative flex-1">
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block mb-1">Asignatura Activa</span>
                    <button
                      onClick={() => {
                        setIsCourseDropdownOpen(!isCourseDropdownOpen)
                        setIsSemDropdownOpen(false)
                        setIsWeekDropdownOpen(false)
                      }}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 hover:border-nintendo-red/50 bg-[#f8fafc] text-[11px] font-black text-slate-800 flex items-center justify-between gap-2 cursor-pointer shadow-sm transition-all hover:bg-slate-100"
                    >
                      <span className="flex items-center gap-2.5 overflow-hidden">
                        <span className="text-[9px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-nintendo-red border border-nintendo-red/25 shrink-0">
                          {activeCourse.code}
                        </span>
                        <span className="truncate">{activeCourse.title}</span>
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    </button>

                    {isCourseDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsCourseDropdownOpen(false)} />
                        <div className="absolute left-0 mt-2 w-full max-w-lg bg-[#f8fafc] border border-slate-200 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden">
                          <span className="px-4 py-1 text-[9px] font-black text-slate-600 uppercase tracking-widest block border-b border-slate-200 pb-1.5 mb-1.5">
                            Asignaturas del Semestre {selectedSemester}
                          </span>
                          <div className="space-y-0.5 max-h-80 overflow-y-auto font-sans">
                            {currentSemesterCourses.map((course) => {
                              const state = kardex[course.code] || { status: "locked", currentWeek: 1 }
                              const isSelected = activeCourseCode === course.code
                              const isLocked = state.status === "locked"
                              const isCompleted = state.status === "completed"

                              return (
                                <button
                                  key={course.code}
                                  disabled={isLocked}
                                  onClick={() => {
                                    selectCourse(course.code)
                                    setViewedWeekNum(null)
                                    setIsCourseDropdownOpen(false)
                                  }}
                                  className={`w-full text-left px-4 py-3 flex flex-col gap-1 transition-colors border-b border-slate-200/40 ${
                                    isLocked 
                                      ? "opacity-40 cursor-not-allowed bg-slate-100" 
                                      : isSelected
                                        ? "bg-slate-100 text-nintendo-red font-black border-l-4 border-l-nintendo-red"
                                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                                  }`}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className="text-[9px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">
                                      {course.code}
                                    </span>
                                    {isLocked ? (
                                      <span className="flex items-center gap-1 text-[8px] font-black text-slate-500 uppercase">
                                        <Lock className="w-3 h-3" /> Bloqueada
                                      </span>
                                    ) : isCompleted ? (
                                      <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/25">
                                        Aprobada • {state.grade}
                                      </span>
                                    ) : (
                                      <span className="text-[8px] font-black uppercase text-joycon-cyan bg-joycon-cyan/10 px-2 py-0.5 rounded-full border border-joycon-cyan/25">
                                        Semana {state.currentWeek || 1} / 16
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] font-black uppercase tracking-tight truncate w-full">
                                    {course.title}
                                  </span>
                                  <span className="text-[9px] text-slate-500 line-clamp-1 leading-normal font-medium">
                                    {course.description}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Compact Reset and Presentations Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      if (confirm("¿Estás seguro de reiniciar todo tu Kardex? Perderás el progreso de semanas y notas acumuladas de la academia (las monedas PKD reales ganadas permanecerán intactas en el juego).")) {
                        resetAcademy()
                        confetti({ particleCount: 20, spread: 40 })
                      }
                    }}
                    className="p-2.5 rounded-2xl border border-slate-200 hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-all cursor-pointer shadow-md bg-[#f8fafc] active:scale-95 flex items-center justify-center shrink-0"
                    title="Reiniciar Kardex JTU"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  {/* Layout selector */}
                  <div className="flex bg-[#f8fafc] p-1 rounded-2xl border border-slate-200 shadow-inner w-fit">
                    <button
                      onClick={() => setLayoutMode("split")}
                      style={layoutMode === "split" ? { backgroundColor: "#00C3E3", color: "#FFFFFF" } : {}}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer ${
                        layoutMode === "split" ? "text-white shadow-md scale-105 active:scale-95" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      Split
                    </button>
                    <button
                      onClick={() => setLayoutMode("zen")}
                      style={layoutMode === "zen" ? { backgroundColor: "#E60012", color: "#FFFFFF" } : {}}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer ${
                        layoutMode === "zen" ? "text-white shadow-md scale-105 active:scale-95" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-700 font-bold animate-pulse" />
                      Zen
                    </button>
                  </div>
                </div>
              </div>

              {/* GRID PRINCIPAL */}
              <div className="grid lg:grid-cols-12 gap-6">
                {/* COLUMNA 2: ÁREA DE ESTUDIO (8/12 o 12/12 en Zen) */}
                <div className={`${
                  layoutMode === "zen" 
                    ? "lg:col-span-12 max-w-4xl mx-auto w-full" 
                    : "lg:col-span-8"
                } space-y-4`}>
                  
                  {/* COMPACT PROGRESS DASHBOARD */}
                  <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl border border-slate-200 shadow-lg space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Progreso en la Asignatura</span>
                        <h3 className="text-xs font-black uppercase text-slate-800 flex items-center gap-2">
                          {activeCourse.title}
                          {activeCourseState.status === "completed" && (
                            <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/25 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Completado
                            </span>
                          )}
                        </h3>
                      </div>

                      {/* Compact Pagination and Dropdown Select */}
                      <div className="flex items-center gap-2.5">
                        {/* Back Button */}
                        <button
                          disabled={weekNumToRender <= 1}
                          onClick={() => setViewedWeekNum(weekNumToRender - 1)}
                          className="w-8 h-8 rounded-xl border border-slate-200 hover:border-joycon-cyan/50 bg-[#f8fafc] flex items-center justify-center font-black text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-all cursor-pointer shadow-md active:scale-95"
                          title="Semana Anterior"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Week Selector Dropdown */}
                        <div className="relative">
                          <button
                            onClick={() => setIsWeekDropdownOpen(!isWeekDropdownOpen)}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-joycon-cyan/50 bg-[#f8fafc] text-[11px] font-mono font-black text-slate-800 flex items-center gap-2 cursor-pointer shadow-md hover:bg-slate-100 transition-all"
                          >
                            <span>Semana {weekNumToRender} de 16</span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                          </button>

                          {isWeekDropdownOpen && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setIsWeekDropdownOpen(false)} 
                                
                              />
                              <div className="absolute right-0 mt-1.5 w-48 bg-[#f8fafc] border border-slate-200 rounded-2xl shadow-2xl z-50 py-1.5 overflow-hidden max-h-60 overflow-y-auto">
                                {Array.from({ length: 16 }, (_, i) => {
                                  const wNum = i + 1
                                  const isCompleted = activeCourseState.status === "completed" || wNum < activeWeekNum
                                  const isActive = wNum === activeWeekNum && activeCourseState.status !== "completed"
                                  const isLocked = wNum > activeWeekNum && activeCourseState.status !== "completed"
                                  const isWeekExam = wNum === 6 || wNum === 12 || wNum === 16

                                  return (
                                    <button
                                      key={wNum}
                                      disabled={isLocked}
                                      onClick={() => {
                                        setViewedWeekNum(wNum)
                                        setIsWeekDropdownOpen(false)
                                      }}
                                      className={`w-full text-left px-4 py-2 text-[11px] flex items-center justify-between font-mono ${
                                        wNum === weekNumToRender
                                          ? "bg-joycon-cyan text-white font-black"
                                          : isLocked
                                            ? "text-slate-600 cursor-not-allowed opacity-40 bg-[#f8fafc]"
                                            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                                      }`}
                                    >
                                      <span className="flex items-center gap-1.5 font-bold">
                                        Semana {wNum}
                                        {isWeekExam && <span className="text-[7px] bg-slate-100 text-nintendo-red border border-nintendo-red/35 px-1 rounded font-black">EX</span>}
                                      </span>
                                      {isCompleted ? (
                                        <span className="text-emerald-500 font-bold">✓</span>
                                      ) : isActive ? (
                                        <span className="w-2 h-2 rounded-full bg-joycon-cyan animate-pulse" />
                                      ) : null}
                                    </button>
                                  )
                                })}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Next Button */}
                        <button
                          disabled={weekNumToRender >= 16 || (weekNumToRender >= activeWeekNum && activeCourseState.status !== "completed")}
                          onClick={() => setViewedWeekNum(weekNumToRender + 1)}
                          className="w-8 h-8 rounded-xl border border-slate-200 hover:border-joycon-cyan/50 bg-[#f8fafc] flex items-center justify-center font-black text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-all cursor-pointer shadow-md active:scale-95"
                          title="Siguiente Semana"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Linear Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase font-mono">
                        <span>Barra de Avance Lineal</span>
                        <span>{((weekNumToRender / 16) * 100).toFixed(2)}% Completado</span>
                      </div>
                      <div className="h-2 w-full bg-[#f8fafc] border border-slate-200 rounded-full overflow-hidden relative">
                        <div 
                          className="h-full bg-gradient-to-r from-joycon-cyan to-nintendo-red rounded-full transition-all duration-500"
                          style={{ width: `${(weekNumToRender / 16) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                {/* 📚 COMPENDIO ACADÉMICO / BIBLIOTECA DIGITAL */}
                <div className="bg-white p-5 rounded-3xl text-slate-900 shadow-lg border border-joycon-cyan/45 space-y-3.5 relative overflow-hidden">
                  {/* Decorative background shape */}
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-joycon-cyan/10 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-joycon-cyan/10 rounded-2xl flex items-center justify-center border border-joycon-cyan/20 backdrop-blur-md shadow-sm">
                      <BookOpen className="w-5 h-5 text-joycon-cyan" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-joycon-cyan block">Biblioteca Central JTU</span>
                      <h4 className="text-sm font-black uppercase tracking-tight text-slate-800">Compendio de Cátedra (8 Págs)</h4>
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-slate-700 leading-relaxed font-medium">
                    Explora el libro de texto oficial con fundamentos científicos, casos reales de la industria, y laboratorios prácticos. Totalmente optimizado para lectura digital y exportación en formato PDF A4.
                  </p>
                  
                  <button
                    onClick={() => {
                      setActiveCompendiumPage(0);
                      setIsCompendiumOpen(true);
                    }}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-joycon-cyan to-[#00a8c2] text-slate-900 hover:brightness-110 active:scale-98 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-joycon-cyan/20 font-sans border-0"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Abrir Compendio Académico</span>
                  </button>
                </div>

                {/* 📥 KIT DE DESARROLLO LOCAL */}
                <div className="bg-white p-5 rounded-3xl text-slate-900 shadow-lg border border-nintendo-red/45 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-nintendo-red/10 rounded-2xl flex items-center justify-center border border-nintendo-red/20">
                      <Terminal className="w-5 h-5 text-nintendo-red" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-nintendo-red block">Entorno Local</span>
                      <h4 className="text-sm font-black uppercase tracking-tight text-slate-800">Kit de Desarrollo Local</h4>
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-slate-700 leading-relaxed font-medium">
                    Configura tu entorno de trabajo profesional en tu computadora. Descarga la plantilla de código estructurada con comentarios TODO y el dataset real simulado de la misión.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleDownloadTemplate}
                      className="bg-[#f8fafc] hover:bg-slate-100 border border-slate-200 hover:border-nintendo-red/50 text-left p-3 rounded-2xl transition-all cursor-pointer shadow-sm group active:scale-98 flex items-center gap-2.5 animate-pulse"
                      style={{ animationDuration: '4s' }}
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-500/20 transition-all shrink-0">
                        <Cpu className="w-4 h-4 text-amber-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 block leading-tight">Plantilla</span>
                        <span className="text-[8px] font-bold text-slate-500 block truncate leading-none mt-0.5">Código TODOs</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={handleDownloadDataset}
                      className="bg-[#f8fafc] hover:bg-slate-100 border border-slate-200 hover:border-joycon-cyan/50 text-left p-3 rounded-2xl transition-all cursor-pointer shadow-sm group active:scale-98 flex items-center gap-2.5"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all shrink-0">
                        <Terminal className="w-4 h-4 text-emerald-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 block leading-tight">Dataset</span>
                        <span className="text-[8px] font-bold text-slate-500 block truncate leading-none mt-0.5">Datos Misión</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Main Theory Area with Dynamic exam colors */}
                <div className={`p-6 rounded-3xl border shadow-lg flex flex-col min-h-[500px] transition-all duration-500 ${
                  isParcialExam 
                    ? "bg-amber-50/65 border-amber-300 shadow-md text-slate-800" 
                    : isFinalExam 
                      ? "bg-violet-50/65 border-violet-300 shadow-md text-slate-800"
                      : "bg-white/95 border-slate-200 text-slate-800"
                }`}>
                  
                  {/* Subject Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 pb-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${getSemesterBadge(activeCourse.semester)}`}>
                        Semestre {activeCourse.semester}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {activeCourse.code} • Semana {weekNumToRender} de 16
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isParcialExam && (
                        <span className="bg-amber-500/10 text-amber-600 border border-amber-500/25 text-[8px] font-black px-2 py-0.5 rounded uppercase flex items-center gap-0.5">
                          🏆 Examen Parcial
                        </span>
                      )}
                      {isFinalExam && (
                        <span className="bg-violet-500/10 text-violet-400 border border-violet-500/25 text-[8px] font-black px-2 py-0.5 rounded uppercase flex items-center gap-0.5 animate-pulse">
                          🎓 Examen Final
                        </span>
                      )}
                      {isLoadingSupabase ? (
                        <span className="bg-joycon-cyan/10 text-joycon-cyan text-[8px] font-black px-2 py-0.5 rounded uppercase flex items-center gap-1 border border-joycon-cyan/25">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          Conectando...
                        </span>
                      ) : supabaseLesson ? (
                        <span className="bg-emerald-500/10 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded uppercase flex items-center gap-1 border border-emerald-500/25">
                          <UserCheck className="w-2.5 h-2.5" />
                          Supabase Sync
                        </span>
                      ) : (
                        <span className="bg-violet-500/10 text-violet-400 text-[8px] font-black px-2 py-0.5 rounded uppercase flex items-center gap-1 border border-violet-500/25">
                          <Sparkles className="w-2.5 h-2.5" />
                          Híbrido Local
                        </span>
                      )}
                      <span className={`uppercase font-black text-[9px] px-2 py-0.5 rounded border ${
                        activeWeekLesson.expectedType === "json" 
                          ? "bg-joycon-cyan/10 text-joycon-cyan border-joycon-cyan/20 font-mono" 
                          : activeWeekLesson.expectedType === "python" 
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20 font-mono" 
                            : "bg-purple-500/10 text-purple-400 border-purple-500/20 font-mono"
                      }`}>
                        {activeWeekLesson.expectedType}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-black uppercase text-slate-800 tracking-tight leading-snug">
                    {activeWeekLesson.title}
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 mt-1 mb-5 leading-normal">
                    {activeCourse.title} • {activeCourse.description}
                  </p>

                  {/* Premium Mode Selector Toggle */}
                  <div className="flex items-center justify-between bg-[#f8fafc]/80 border border-slate-200 p-1.5 rounded-2xl mb-5 shadow-inner">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-2">Método de Aprendizaje JTU:</span>
                    <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                      <button
                        onClick={() => setChatMode("text")}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          chatMode === "text"
                            ? "bg-joycon-cyan text-white shadow-md shadow-joycon-cyan/10"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <BookMarked className="w-3.5 h-3.5" />
                        Lectura Directa
                      </button>
                      <button
                        onClick={() => setChatMode("chat")}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          chatMode === "chat"
                            ? "bg-nintendo-red text-white shadow-md shadow-nintendo-red/10"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Socrático RPG
                      </button>
                    </div>
                  </div>

                  {/* Warning if reviewing past week */}
                  {viewedWeekNum && viewedWeekNum !== activeWeekNum && (
                    <div className="bg-[#f8fafc] border border-slate-200 text-slate-500 px-4 py-3 rounded-2xl mb-4 text-xs font-semibold flex items-center gap-2">
                      <Eye className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>Estás revisando una lección pasada. Vuelve a la semana activa ({activeWeekNum}) para auditar tu proyecto actual.</span>
                    </div>
                  )}

                  {chatMode === "chat" ? (
                    <div className="flex-1 flex flex-col gap-4">
                      {/* Scrollable Chat Area */}
                      <div className="flex-1 min-h-[380px] max-h-[500px] overflow-y-auto border border-slate-200 bg-[#f8fafc]/45 rounded-3xl p-4 space-y-4 shadow-inner flex flex-col justify-start">
                        {chatHistory.map((msg, index) => {
                          const isProf = msg.sender === "professor";
                          return (
                            <div
                              key={index}
                              className={`flex gap-2.5 items-start max-w-[85%] ${!isProf ? "ml-auto flex-row-reverse" : ""}`}
                            >
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${
                                isProf 
                                  ? "bg-nintendo-red/10 border-nintendo-red/25 text-nintendo-red" 
                                  : "bg-joycon-cyan/10 border-joycon-cyan/25 text-joycon-cyan"
                              }`}>
                                {isProf ? (
                                  <GraduationCap className="w-4 h-4" />
                                ) : (
                                  <UserCheck className="w-4 h-4" />
                                )}
                              </div>
                              
                              <div className={`p-4 rounded-2xl shadow-sm text-xs border ${
                                isProf 
                                  ? msg.type === "feedback" 
                                    ? "bg-emerald-500/10 border-emerald-500/25 text-slate-800"
                                    : msg.type === "challenge" 
                                      ? "bg-rose-500/10 border-rose-500/25 text-slate-800"
                                      : "bg-slate-100/80 border-slate-200 text-slate-800"
                                  : "bg-slate-100 border-slate-200 text-slate-800"
                              }`}>
                                <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-150">
                                  {parseMarkdown(msg.text)}
                                </div>
                                <span className={`text-[8px] font-bold block mt-2 text-right uppercase tracking-widest ${isProf ? "text-slate-500" : "text-slate-500"}`}>
                                  {isProf ? "Profesor JTU" : "Tesis del Alumno"} • {msg.timestamp}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        
                        {isProfessorWriting && (
                          <div className="flex gap-2.5 items-start">
                            <div className="w-8 h-8 rounded-xl bg-nintendo-red/10 border border-nintendo-red/25 flex items-center justify-center">
                              <GraduationCap className="w-4 h-4 text-nintendo-red animate-pulse" />
                            </div>
                            <div className="bg-[#f8fafc] border border-slate-200 px-4 py-2.5 rounded-2xl flex items-center gap-1 text-slate-500 shadow-sm">
                              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Dialogue Actions / Choices */}
                      {suggestedOptions.length > 0 && (
                        <div className="space-y-2 p-2.5 bg-[#f8fafc]/80 border border-slate-200 rounded-2xl">
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block px-1">
                            Opciones de Debate Dialéctico:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {suggestedOptions.map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => handleSelectOption(opt)}
                                className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 hover:border-joycon-cyan/50 hover:text-slate-900 active:scale-95 text-[10px] font-bold text-slate-700 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                              >
                                <ChevronRight className="w-3.5 h-3.5 text-joycon-cyan shrink-0" />
                                {opt.text}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Open Defense Input Form */}
                      {chatDialogueStep === "waiting_defense" && (
                        <div className="space-y-2 border-t border-slate-200 pt-4">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                            <FileSignature className="w-3.5 h-3.5 text-nintendo-red" />
                            Redacta tu Defensa Lógica (Tesis Técnica):
                          </label>
                          <div className="flex gap-2">
                            <textarea
                              value={chatInputValue}
                              onChange={(e) => setChatInputValue(e.target.value)}
                              placeholder="Describe aquí tu planteamiento arquitectónico. Explica cómo mitigas pérdidas en Veggietopia / Paws & Claws / EcoGlow..."
                              className="flex-1 min-h-[80px] bg-[#f8fafc] hover:bg-slate-50 focus:bg-[#f8fafc] border border-slate-200 focus:border-nintendo-red focus:ring-1 focus:ring-[#e60012]/20 rounded-2xl p-3 text-xs text-slate-700 font-medium placeholder-slate-500 transition-all outline-none resize-none"
                              onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendSocraticDefense(chatInputValue);
                                  }
                                }}
                            />
                            <button
                              onClick={() => handleSendSocraticDefense(chatInputValue)}
                              disabled={!chatInputValue.trim() || isProfessorWriting}
                              style={{ backgroundColor: "#E60012", color: "#FFFFFF" }} className="hover:brightness-110 disabled:opacity-40 font-bold rounded-2xl px-5 flex items-center justify-center shadow-lg shadow-nintendo-red/20 cursor-pointer active:scale-95 transition-all border-0"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-[8px] font-bold text-slate-500 block text-right">
                            Presiona Enter para enviar. Mínimo requerido: {Math.max(activeWeekLesson.verificationCriteria.minLength || 60, 45)} caracteres.
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Rendered Theory Content (Libro Abierto) */}
                      <div className="flex-1 space-y-4 text-slate-600 prose max-w-none">
                        {isLoadingSupabase ? (
                          <div className="space-y-4 animate-pulse py-4">
                            <div className="h-4 bg-slate-800 rounded-md w-3/4"></div>
                            <div className="h-4 bg-slate-800 rounded-md w-5/6"></div>
                            <div className="h-4 bg-slate-800 rounded-md w-2/3"></div>
                            <div className="h-36 bg-[#f8fafc] rounded-2xl border border-slate-200 flex flex-col justify-center items-center gap-2.5 my-6">
                              <RefreshCw className="w-6 h-6 animate-spin text-joycon-cyan" />
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Consultando Base de Datos Supabase...</span>
                              <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Esquema JTU • weeks_metadata</span>
                            </div>
                            <div className="h-4 bg-slate-800 rounded-md w-full"></div>
                            <div className="h-4 bg-slate-800 rounded-md w-4/5"></div>
                          </div>
                        ) : (
                          parseMarkdown(activeWeekLesson.theory)
                        )}
                      </div>

                      {/* Template Card */}
                      <div className="bg-[#f8fafc]/80 border border-slate-200 p-4 rounded-2xl mt-6 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-joycon-cyan" />
                            Código base de Entrega Requerido
                          </span>
                          <button
                            onClick={handleCopyTemplate}
                            className="text-[10px] font-black text-joycon-cyan hover:text-joycon-cyan/80 uppercase tracking-wider flex items-center gap-1 cursor-pointer bg-slate-100 px-2 py-1 rounded border border-slate-200 shadow-sm active:scale-95"
                          >
                            {copySuccess ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                Copiado
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copiar base
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="font-mono text-[10px] bg-white p-3 rounded-xl text-slate-600 border border-slate-200 overflow-x-auto whitespace-pre select-all">
                          {activeWeekLesson.template}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* COLUMNA 3: EL AUDITOR DE PROYECTO (4/12) */}
              {layoutMode !== "zen" && (
                <div className={isExpandedAuditor 
                  ? "fixed inset-0 z-50 p-6 bg-slate-950/98 backdrop-blur-xl flex flex-col w-full h-full" 
                  : "lg:col-span-4 space-y-4 flex flex-col"
                }>
                
                {/* Console Terminal Panel */}
                <div className="bg-white/95 rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex-1 flex flex-col backdrop-blur-md">
                  
                  {/* Console Top Bar */}
                  <div className="bg-white px-5 py-3.5 flex justify-between items-center border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-joycon-cyan animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-900">
                        Auditor de Código JTU
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsExpandedAuditor(!isExpandedAuditor)}
                        className="text-[9px] font-black text-slate-600 hover:text-slate-900 uppercase tracking-wider flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded border border-slate-200 shadow-sm active:scale-95 transition-all"
                      >
                        <Eye className="w-3 h-3 text-joycon-cyan" />
                        <span>{isExpandedAuditor ? "Cerrar" : "Deep Work"}</span>
                      </button>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FF453A]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FFD60A]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#30D158]" />
                      </div>
                    </div>
                  </div>

                  {/* Console Body Area */}
                  <div className="p-5 flex-1 flex flex-col gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
                        <span>Pega tu solución aquí abajo:</span>
                        <span className="text-[9px] font-mono text-joycon-cyan">
                          Mínimo: {activeWeekLesson.verificationCriteria.minLength || 60} chars
                        </span>
                      </label>
                      
                      <div className="relative flex-1 min-h-[220px] flex flex-col rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-inner group focus-within:border-joycon-cyan/80 transition-all">
                        {/* Editor Workspace */}
                        <textarea
                          value={submissionCode}
                          onChange={(e) => setSubmissionCode(e.target.value)}
                          disabled={isAuditing || (viewedWeekNum !== null && viewedWeekNum !== activeWeekNum)}
                          className="w-full flex-1 p-4 bg-transparent text-slate-800 font-mono text-xs focus:outline-none resize-none leading-relaxed overflow-y-auto"
                          placeholder={`Escribe o pega aquí tu código o respuesta esperada en formato ${activeWeekLesson.expectedType.toUpperCase()}...`}
                        />
                      </div>
                    </div>

                    {/* Console Live Activity Logs (during Auditing) */}
                    <AnimatePresence>
                      {(isAuditing || auditLogs.length > 0) && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-white p-4 rounded-2xl border border-slate-200 font-mono text-[9px] text-emerald-600 space-y-1.5 shadow-inner"
                        >
                          {auditLogs.map((log, idx) => (
                            <div key={idx} className="flex items-start gap-1 leading-normal">
                              <span className="text-joycon-cyan font-black select-none">&gt;</span>
                              <span>{log}</span>
                            </div>
                          ))}
                          {isAuditing && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <RefreshCw className="w-3 h-3 animate-spin text-joycon-cyan" />
                              <span>Procesando analíticas de producción...</span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Audit Results Board */}
                    <AnimatePresence>
                      {auditResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-2xl border flex flex-col gap-2.5 ${
                            auditResult.success
                              ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.08)]"
                              : "bg-amber-950/20 border-amber-500/30 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.08)]"
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <div className="flex items-center gap-1.5">
                              {auditResult.success ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <ShieldAlert className="w-4 h-4 text-amber-600" />
                              )}
                              <span className="text-[10px] font-black uppercase tracking-wider">
                                {auditResult.success ? "APROBADO CON ÉLITE" : "REPROBADO - INTENTA NUEVAMENTE"}
                              </span>
                            </div>
                            <span className={`text-base font-black px-2.5 py-0.5 rounded-full ${
                              auditResult.success ? "bg-emerald-500 text-white" : "bg-amber-500 text-slate-900"
                            }`}>
                              Nota: {auditResult.grade}
                            </span>
                          </div>

                          <p className="text-[11px] leading-relaxed italic text-slate-700 font-medium">
                            &quot;{auditResult.feedback}&quot;
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Primary Auditor Action Button */}
                    <button
                      onClick={handleAudit}
                      disabled={
                        isAuditing || 
                        !submissionCode.trim() || 
                        (viewedWeekNum !== null && viewedWeekNum !== activeWeekNum)
                      }
                      className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-md ${
                        !submissionCode.trim() || (viewedWeekNum !== null && viewedWeekNum !== activeWeekNum)
                          ? "bg-[#f8fafc] text-slate-600 border border-slate-200 cursor-not-allowed"
                          : isAuditing
                            ? "bg-joycon-cyan text-white opacity-80"
                            : "bg-gradient-to-r from-joycon-cyan to-[#00a8c2] hover:brightness-110 text-slate-900 shadow-lg shadow-joycon-cyan/20 border-0"
                      }`}
                    >
                      {viewedWeekNum !== null && viewedWeekNum !== activeWeekNum ? (
                        <>
                          <Lock className="w-4 h-4" />
                          Estás revisando lección
                        </>
                      ) : isAuditing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Ejecutando Auditoría JTU...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-white border-0" />
                          Auditar Proyecto Semanal
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              )}
            </div>
            </motion.div>
          )}

          {/* ========================================================
              TAB 2: KARDEX ACADÉMICO (TRANSCRIPT Y MEDALLAS)
          ======================================================== */}
          {activeTab === "kardex" && (
            <motion.div
              key="kardex"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid lg:grid-cols-12 gap-6"
            >
              
              {/* Resumen General Kardex (4/12) */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white/95 p-6 rounded-3xl border border-slate-200 shadow-lg space-y-6 backdrop-blur-md">
                  <div className="border-b border-slate-200 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                      Ficha Académica de Registro
                    </span>
                    <h2 className="text-xl font-black text-slate-800 uppercase">
                      Información del Alumno
                    </h2>
                  </div>

                  {/* Student Card details */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-[#f8fafc] p-3.5 rounded-2xl border border-slate-200">
                      <span className="text-xs text-slate-500 font-bold uppercase">Estado Académico:</span>
                      <span className="text-xs font-black uppercase text-emerald-600 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        Regular Activo
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-[#f8fafc] p-3.5 rounded-2xl border border-slate-200">
                      <span className="text-xs text-slate-500 font-bold uppercase">Asignaturas Aprobadas:</span>
                      <span className="text-sm font-black text-slate-800">
                        {Object.values(kardex).filter(c => c.status === "completed").length} <span className="text-slate-500">/ 32</span>
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-[#f8fafc] p-3.5 rounded-2xl border border-slate-200">
                      <span className="text-xs text-slate-500 font-bold uppercase">Créditos Acumulados:</span>
                      <span className="text-sm font-black text-slate-800">
                        {credits} <span className="text-slate-500">/ 96</span>
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-[#f8fafc] p-3.5 rounded-2xl border border-slate-200">
                      <span className="text-xs text-slate-500 font-bold uppercase">Promedio General (GPA):</span>
                      <span className="text-sm font-black text-slate-800">{gpa} / 10.0</span>
                    </div>
                  </div>

                  {/* Unlocked Badges (Medals - 8 Semesters) */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block border-t border-slate-200 pt-4">
                      Medallas de Semestre Desbloqueadas
                    </span>

                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                        const medal = getSemesterMedal(sem)
                        const completed = isSemesterCompleted(sem)
                        return (
                          <div 
                            key={sem}
                            className={`p-3.5 rounded-2xl border flex flex-col items-center text-center justify-center relative transition-all ${
                              completed 
                                ? `bg-[#f8fafc] text-slate-800 border-joycon-cyan/45 shadow-md shadow-joycon-cyan/5` 
                                : "bg-[#f8fafc] border-slate-200 opacity-25"
                            }`}
                          >
                            <span className="text-3xl mb-1 filter drop-shadow-sm">{medal.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-tight leading-tight block text-slate-800">
                              {medal.name}
                            </span>
                            <span className="text-[8px] font-semibold mt-0.5 opacity-80 uppercase block text-slate-500">
                              Semestre {sem}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* 📊 RADAR DE COMPETENCIAS REAL-WORLD */}
                <div className="bg-white/95 p-6 rounded-3xl border border-slate-200 shadow-lg space-y-5 backdrop-blur-md">
                  <div className="border-b border-slate-200 pb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-nintendo-red block mb-1">
                      Senior Tech Profile
                    </span>
                    <h3 className="text-sm font-black text-slate-800 uppercase">
                      Radar de Competencias
                    </h3>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Métricas de desempeño reales basadas en las cátedras y retos completados en JTU.
                    </p>
                  </div>

                  {/* SVG Radar Chart */}
                  <div className="flex justify-center items-center py-2 bg-[#f8fafc]/80 rounded-2xl border border-slate-200 relative group overflow-hidden">
                    <svg width="270" height="250" className="overflow-visible select-none">
                      <defs>
                        <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#00a8ec" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#e60012" stopOpacity="0" />
                        </radialGradient>
                        <linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#e60012" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#00a8ec" stopOpacity="0.15" />
                        </linearGradient>
                      </defs>

                      {/* Background Glow */}
                      <circle cx="135" cy="120" r="85" fill="url(#radarGlow)" />

                      {/* Concentric grid lines (20, 40, 60, 80, 100) */}
                      {[20, 40, 60, 80, 100].map((val) => {
                        const pts = [0, 1, 2, 3, 4].map((idx) => {
                          const angle = (Math.PI * 2 / 5) * idx - Math.PI / 2;
                          const x = 135 + Math.cos(angle) * 85 * (val / 100);
                          const y = 120 + Math.sin(angle) * 85 * (val / 100);
                          return `${x},${y}`;
                        }).join(" ");
                        return (
                          <polygon
                            key={val}
                            points={pts}
                            fill="none"
                            stroke="#1f242e"
                            strokeWidth={val === 100 ? "1.5" : "1"}
                            strokeDasharray={val !== 100 ? "3 3" : undefined}
                          />
                        );
                      })}

                      {/* Axis lines */}
                      {[0, 1, 2, 3, 4].map((idx) => {
                        const angle = (Math.PI * 2 / 5) * idx - Math.PI / 2;
                        const xOuter = 135 + Math.cos(angle) * 85;
                        const yOuter = 120 + Math.sin(angle) * 85;
                        return (
                          <line
                            key={idx}
                            x1="135"
                            y1="120"
                            x2={xOuter}
                            y2={yOuter}
                            stroke="#1f242e"
                            strokeWidth="1"
                          />
                        );
                      })}

                      {/* Filled Skill Polygon */}
                      <polygon
                        points={[
                          computedSkills.ai,
                          computedSkills.backend,
                          computedSkills.database,
                          computedSkills.automation,
                          computedSkills.strategy
                        ].map((val, idx) => {
                          const angle = (Math.PI * 2 / 5) * idx - Math.PI / 2;
                          const x = 135 + Math.cos(angle) * 85 * (val / 100);
                          const y = 120 + Math.sin(angle) * 85 * (val / 100);
                          return `${x},${y}`;
                        }).join(" ")}
                        fill="url(#radarGrad)"
                        stroke="#e60012"
                        strokeWidth="2"
                        className="transition-all duration-700 ease-out"
                      />

                      {/* Glowing skill dots */}
                      {[
                        computedSkills.ai,
                        computedSkills.backend,
                        computedSkills.database,
                        computedSkills.automation,
                        computedSkills.strategy
                      ].map((val, idx) => {
                        const angle = (Math.PI * 2 / 5) * idx - Math.PI / 2;
                        const x = 135 + Math.cos(angle) * 85 * (val / 100);
                        const y = 120 + Math.sin(angle) * 85 * (val / 100);
                        return (
                          <g key={idx}>
                            <circle cx={x} cy={y} r="5" fill="#e60012" className="transition-all duration-700" />
                            <circle cx={x} cy={y} r="8" fill="none" stroke="#e60012" strokeWidth="1.5" className="animate-ping opacity-60" />
                          </g>
                        );
                      })}

                      {/* Typography labels */}
                      {[
                        { text: "IA & LLMs", anchor: "middle", dy: "-8", dx: "0" },
                        { text: "Backend", anchor: "start", dy: "4", dx: "6" },
                        { text: "SQL & DB", anchor: "start", dy: "12", dx: "4" },
                        { text: "n8n Workflows", anchor: "end", dy: "12", dx: "-4" },
                        { text: "CTO / Biz", anchor: "end", dy: "4", dx: "-6" }
                      ].map((lbl, idx) => {
                        const angle = (Math.PI * 2 / 5) * idx - Math.PI / 2;
                        const x = 135 + Math.cos(angle) * 98;
                        const y = 120 + Math.sin(angle) * 98;
                        return (
                          <text
                            key={idx}
                            x={x + parseFloat(lbl.dx)}
                            y={y + parseFloat(lbl.dy)}
                            textAnchor={lbl.anchor as any}
                            className="font-sans font-black text-[9px] uppercase tracking-wide text-slate-500 fill-current"
                          >
                            {lbl.text}
                          </text>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Numeric breakdown with dynamic progress bars */}
                  <div className="space-y-3.5">
                    {[
                      { name: "Inteligencia Artificial & LLMOps", value: computedSkills.ai, color: "bg-nintendo-red", txtColor: "text-nintendo-red" },
                      { name: "Sistemas & Backend Moderno", value: computedSkills.backend, color: "bg-joycon-cyan", txtColor: "text-joycon-cyan" },
                      { name: "Bases de Datos & SQL Avanzado", value: computedSkills.database, color: "bg-joycon-cyan", txtColor: "text-joycon-cyan" },
                      { name: "Integración & n8n Workflows", value: computedSkills.automation, color: "bg-nintendo-red", txtColor: "text-nintendo-red" },
                      { name: "CTO Strategy & Cloud Costs", value: computedSkills.strategy, color: "bg-nintendo-red", txtColor: "text-nintendo-red" },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-slate-600">{item.name}</span>
                          <span className={`font-mono font-black ${item.txtColor}`}>{item.value}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#f8fafc] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full transition-all duration-700 ease-out`}
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>


              {/* Transcript list and Digital Certificate Generator (8/12) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Visual History of Courses */}
                <div className="bg-white/95 p-6 rounded-3xl border border-slate-200 shadow-lg space-y-4 backdrop-blur-md">
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="text-lg font-black text-slate-800 uppercase">
                      Historial Académico Completo
                    </h3>
                    <p className="text-xs text-slate-500">
                      Listado oficial de asignaturas cursadas, estado de aprobación y notas expedidas.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-600 uppercase tracking-widest font-black text-[9px]">
                          <th className="py-3 px-2">CÓDIGO</th>
                          <th className="py-3 px-2">ASIGNATURA</th>
                          <th className="py-3 px-2">SEMESTRE</th>
                          <th className="py-3 px-2">CALIFICACIÓN</th>
                          <th className="py-3 px-2">ESTADO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-250/60 text-slate-700 font-medium">
                        {JTU_CURRICULUM.map((course) => {
                          const state = kardex[course.code] || { status: "locked", currentWeek: 1 }
                          const isCompleted = state.status === "completed"
                          const isUnlocked = state.status === "unlocked"

                          return (
                            <tr key={course.code} className="hover:bg-[#f8fafc]/50 transition-colors">
                              <td className="py-3.5 px-2 font-mono font-bold text-slate-500">{course.code}</td>
                              <td className="py-3.5 px-2 font-black text-slate-800 uppercase">{course.title}</td>
                              <td className="py-3.5 px-2 text-slate-500">Semestre {course.semester}</td>
                              <td className="py-3.5 px-2 font-mono text-sm font-bold text-slate-800">
                                {isCompleted ? state.grade : "—"}
                              </td>
                              <td className="py-3.5 px-2">
                                {isCompleted ? (
                                  <span className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                                    Aprobado
                                  </span>
                                ) : isUnlocked ? (
                                  <span className="bg-joycon-cyan/10 border border-joycon-cyan/25 text-joycon-cyan text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                                    En curso (Sem. {state.currentWeek || 1})
                                  </span>
                                ) : (
                                  <span className="bg-[#f8fafc] border border-slate-200 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5 w-fit">
                                    <Lock className="w-2.5 h-2.5" />
                                    Bloqueada
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Digital Certificate Section (8 Semesters) */}
                <div className="bg-white/95 p-6 rounded-3xl border border-slate-200 shadow-lg space-y-4 backdrop-blur-md">
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="text-lg font-black text-slate-800 uppercase flex items-center gap-2">
                      <Award className="w-5.5 h-5.5 text-nintendo-red" />
                      Diplomas y Certificaciones JTU
                    </h3>
                    <p className="text-xs text-slate-500">
                      Al completar y aprobar al 100% las materias de un semestre, desbloqueas tu diploma holográfico y la medalla oficial de la liga JTU.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                      const completed = isSemesterCompleted(sem)
                      const medal = getSemesterMedal(sem)
                      
                      return (
                        <motion.div 
                          key={sem}
                          whileHover={completed ? { scale: 1.02, rotateY: 5, rotateX: -5 } : {}}
                          style={{ perspective: 1000 }}
                          className={`p-5 rounded-3xl border transition-all relative flex flex-col gap-3 ${
                            completed 
                              ? "bg-[#f8fafc] border-slate-200 shadow-md hover:shadow-xl hover:shadow-joycon-cyan/5" 
                              : "bg-[#f8fafc]/40 border-slate-900 opacity-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-3xl filter drop-shadow-sm">{medal.icon}</span>
                            <div>
                              <h4 className="text-sm font-black uppercase text-slate-800 leading-tight">
                                Certificado de Especialidad {sem}
                              </h4>
                              <p className="text-[10px] text-slate-500">
                                {completed ? "Emitido el " + new Date().toLocaleDateString() : "Estado: Bloqueado (Completa el Semestre)"}
                              </p>
                            </div>
                          </div>

                          {completed ? (
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-inner flex flex-col gap-2 relative overflow-hidden">
                              {/* Holographic Watermark lines */}
                              <div className="absolute inset-0 bg-gradient-to-r from-joycon-cyan/5 via-[#e60012]/5 to-purple-500/5 pointer-events-none opacity-40 animate-pulse" />
                              
                              <div className="flex justify-between items-center text-[8px] font-mono font-bold text-slate-500 border-b border-slate-200 pb-1.5">
                                <span>JOHTO TECH UNIVERSITY</span>
                                <span className="text-joycon-cyan">{getCertificateId(`SEM-${sem}`)}</span>
                              </div>

                              <div className="text-center py-2 space-y-1 z-10">
                                <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block">DIPLOMA ACADÉMICO</span>
                                <span className="text-[13px] font-black uppercase text-slate-800 tracking-tight block">
                                  {medal.name}
                                </span>
                                <span className="text-[9px] text-slate-600 block">
                                  Otorgado al estudiante de JTU por culminar exitosamente el Semestre {sem} del plan de estudios en Automatización e IA.
                                </span>
                              </div>

                              <div className="flex justify-between items-end border-t border-slate-200 pt-2 text-[8px] font-mono font-bold text-slate-500">
                                <span>Verificación JTU</span>
                                <span className="text-emerald-600 font-bold">✓ AUTÉNTICO</span>
                              </div>

                              <button
                                onClick={() => {
                                  confetti({ particleCount: 30, spread: 50 })
                                  window.print()
                                }}
                                className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                              >
                                Imprimir / Descargar PDF
                              </button>
                            </div>
                          ) : (
                            <div className="bg-[#f8fafc]/20 p-4 rounded-2xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center py-8 gap-2">
                              <Lock className="w-5 h-5 text-slate-600" />
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                Requiere cursar todas las materias del Semestre {sem}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 📡 MONITOR DE TELEMETRÍA ASÍNCRONA JTU */}
        <div className="mt-8 bg-white border border-slate-200 text-slate-500 p-4 rounded-3xl font-mono text-[9px] flex flex-wrap items-center justify-between gap-4 shadow-xl shadow-slate-950/20 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-joycon-cyan animate-ping" />
            <span className="text-slate-900 font-bold uppercase tracking-wider text-[10px]">Consola de Telemetría JTU:</span>
            <span className="text-slate-500">v2028.1.0-alpha</span>
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <span className="text-slate-500">BASE DE DATOS:</span>{" "}
              <span className={supabaseReady ? "text-joycon-cyan font-bold" : "text-nintendo-red font-bold"}>
                {supabaseReady ? "SUPABASE_ACTIVE (jtu)" : "LOCAL_FALLBACK (hybrid)"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">LATENCIA ESTIMADA:</span>{" "}
              <span className="text-joycon-cyan font-bold">{supabaseReady ? "48ms (us-east-1)" : "0ms (local)"}</span>
            </div>
            <div>
              <span className="text-slate-500">SSL_SECURE:</span>{" "}
              <span className="text-emerald-600 font-bold">SHA-256</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200 text-[8px] text-slate-500">
              <RefreshCw className="w-2.5 h-2.5 animate-spin text-nintendo-red" style={{ animationDuration: '6s' }} />
              <span>POOL_STATUS: CONNECTED</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📚 MODAL: COMPENDIO ACADÉMICO JTU */}
      {isCompendiumOpen && (() => {
        const chapters = getWeeklyCompendiumChapters(activeCourse, weekNumToRender, activeWeekLesson);
        const activeChapter = chapters[activeCompendiumPage] || chapters[0];
        
        return (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsCompendiumOpen(false);
              }
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn cursor-pointer"
          >
            {/* Print-Only stylesheet */}
            <style>{`
              @media print {
                /* Hide standard UI elements */
                body * {
                  visibility: hidden !important;
                }
                /* Show print container */
                #jtu-pdf-print-area, #jtu-pdf-print-area * {
                  visibility: visible !important;
                }
                #jtu-pdf-print-area {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  background: white !important;
                  color: #000 !important;
                  display: block !important;
                }
                .page-break {
                  page-break-before: always !important;
                  break-before: page !important;
                }
              }
            `}</style>

            {/* Hidden 8-page Print Container for perfect A4 PDF export */}
            <div id="jtu-pdf-print-area" className="hidden">
              {chapters.map((ch, idx) => (
                <div key={idx} className={`p-12 max-w-[210mm] mx-auto bg-white text-slate-900 font-serif ${idx > 0 ? "page-break" : ""}`} style={{ fontSize: '13pt', lineHeight: '1.7' }}>
                  <div className="border-b border-slate-900 pb-3 mb-6 flex justify-between items-center text-xs font-sans font-bold text-slate-600 uppercase tracking-widest">
                    <span>Johto Tech University — Cátedra Oficial</span>
                    <span>Lección Semanal {weekNumToRender}</span>
                  </div>
                  
                  <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:font-black prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-lg">
                    {parseMarkdown(ch.content)}
                  </div>
                  
                  <div className="border-t border-slate-200 pt-3 mt-8 flex justify-between items-center text-[10px] font-sans font-bold text-slate-600 uppercase tracking-widest">
                    <span>Página {idx + 1} de {chapters.length}</span>
                    <span>Cátedra: {activeCourse.code}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Glassmorphic Modal Box */}
            <div className="relative w-full max-w-6xl h-[90vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden backdrop-blur-xl animate-scaleUp cursor-default">
              
              {/* Left Chapter Index Panel */}
              <div className="w-full md:w-80 bg-white/95 border-r border-slate-200 flex flex-col h-1/3 md:h-full shrink-0">
                {/* Header */}
                <div className="p-5 border-b border-slate-200 bg-white flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-900" style={{ backgroundColor: '#e60012' }}>
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Compendio de Cátedra
                    </h3>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">
                      Curso: {activeCourse.code} • Sem. {weekNumToRender}
                    </p>
                  </div>
                </div>
                
                {/* Index List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
                  {chapters.map((ch, idx) => {
                    const isActive = activeCompendiumPage === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveCompendiumPage(idx)}
                        className={`w-full p-3 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer ${
                          isActive 
                            ? "text-slate-900 shadow-md shadow-joycon-cyan/10" 
                            : "bg-[#f8fafc] border border-slate-200 hover:bg-slate-100 text-slate-600"
                        }`}
                        style={isActive ? { backgroundColor: '#00C3E3', color: '#ffffff' } : {}}
                      >
                        <span className="text-xl shrink-0">{ch.icon}</span>
                        <div className="min-w-0 flex-1">
                          <span 
                            className={`text-[10px] font-black uppercase tracking-tight block ${isActive ? "" : "text-slate-500"}`}
                            style={isActive ? { color: '#e0f7fc' } : {}}
                          >
                            Pág. {idx + 1} de 8
                          </span>
                          <h5 className={`text-[11px] font-extrabold tracking-tight truncate leading-normal ${isActive ? "text-white font-black" : "text-slate-800 font-bold"}`}>
                            {ch.title}
                          </h5>
                          <p 
                            className={`text-[8px] font-medium truncate ${isActive ? "" : "text-slate-500"}`}
                            style={isActive ? { color: '#e0f7fc' } : {}}
                          >
                            {ch.subtitle}
                          </p>
                        </div>
                        {isActive && <Check className="w-3.5 h-3.5 text-white shrink-0 font-black" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Reading & Content Area */}
              <div className="flex-1 flex flex-col h-2/3 md:h-full bg-white">
                
                {/* Top Control Bar */}
                <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-between bg-white/95">
                  {/* Left Nav */}
                  <div className="flex items-center gap-1">
                    <button
                      disabled={activeCompendiumPage === 0}
                      onClick={() => setActiveCompendiumPage(prev => Math.max(0, prev - 1))}
                      className="w-8 h-8 rounded-lg hover:bg-[#f8fafc] text-slate-700 disabled:opacity-30 cursor-pointer flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {activeCompendiumPage + 1} / 8
                    </span>
                    <button
                      disabled={activeCompendiumPage === 7}
                      onClick={() => setActiveCompendiumPage(prev => Math.min(7, prev + 1))}
                      className="w-8 h-8 rounded-lg hover:bg-[#f8fafc] text-slate-700 disabled:opacity-30 cursor-pointer flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Right Tools */}
                  <div className="flex items-center gap-3">
                    {/* Font Settings */}
                    <div className="flex bg-[#f8fafc] border border-slate-200 p-1 rounded-xl gap-0.5">
                      <button
                        onClick={() => setCompendiumFontFamily("sans")}
                        className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                          compendiumFontFamily === "sans" 
                            ? "bg-slate-100 text-joycon-cyan border border-slate-200 shadow-sm" 
                            : "text-slate-500 hover:text-slate-600"
                        }`}
                      >
                        Sans
                      </button>
                      <button
                        onClick={() => setCompendiumFontFamily("serif")}
                        className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                          compendiumFontFamily === "serif" 
                            ? "bg-slate-100 text-joycon-cyan border border-slate-200 shadow-sm" 
                            : "text-slate-500 hover:text-slate-600"
                        }`}
                      >
                        Serif
                      </button>
                    </div>

                    {/* Font Size Adjusters */}
                    <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                      <button
                        disabled={compendiumFontSize <= 12}
                        onClick={() => setCompendiumFontSize(prev => Math.max(12, prev - 2))}
                        className="w-7 h-7 rounded-lg bg-[#f8fafc] hover:bg-slate-100 text-slate-700 disabled:opacity-30 cursor-pointer flex items-center justify-center transition-colors font-bold text-xs border border-slate-200"
                      >
                        A-
                      </button>
                      <button
                        disabled={compendiumFontSize >= 24}
                        onClick={() => setCompendiumFontSize(prev => Math.min(24, prev + 2))}
                        className="w-7 h-7 rounded-lg bg-[#f8fafc] hover:bg-slate-100 text-slate-700 disabled:opacity-30 cursor-pointer flex items-center justify-center transition-colors font-bold text-xs border border-slate-200"
                      >
                        A+
                      </button>
                    </div>

                    {/* Save PDF Action */}
                    <button
                      onClick={() => {
                        triggerSuccessConfetti();
                        setTimeout(() => {
                          window.print();
                        }, 300);
                      }}
                      style={{ backgroundColor: "#00C3E3", color: "#FFFFFF" }} className="hover:bg-[#00d7fb] font-black shadow-[0_0_15px_rgba(0,195,227,0.3)] py-1.5 px-3 rounded-xl text-[9px] uppercase tracking-widest cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Exportar PDF</span>
                    </button>

                    {/* Close Modal */}
                    <button
                      onClick={() => setIsCompendiumOpen(false)}
                      className="w-8 h-8 rounded-xl bg-[#f8fafc] border border-slate-200 hover:bg-nintendo-red/10 hover:text-nintendo-red text-slate-700 cursor-pointer flex items-center justify-center transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Reading Canvas */}
                <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar bg-white/80">
                  <div 
                    className={`max-w-3xl mx-auto py-4 rounded-3xl transition-all duration-300 select-text selection:bg-joycon-cyan/30`}
                    style={{ 
                      fontSize: `${compendiumFontSize}px`, 
                      fontFamily: compendiumFontFamily === "serif" ? "Georgia, serif" : "Outfit, sans-serif",
                      lineHeight: 1.85
                    }}
                  >
                    {/* Header inside textbook */}
                    <div className="border-b border-slate-200 pb-4 mb-6 flex justify-between items-center text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono">
                      <span>Lección de Cátedra JTU</span>
                      <span>Página {activeCompendiumPage + 1} de 8</span>
                    </div>

                    <div className="prose prose-slate dark: max-w-none prose-headings:font-black prose-p:leading-relaxed prose-pre:bg-slate-950 prose-pre:text-slate-800 prose-pre:rounded-2xl prose-pre:border prose-pre:border-slate-200">
                      {parseMarkdown(activeChapter.content)}
                    </div>

                    {/* Footer inside textbook */}
                    <div className="border-t border-slate-200 pt-6 mt-12 flex flex-col md:flex-row justify-between items-center gap-3 text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono">
                      <span>Semana {weekNumToRender} de {activeCourse.title}</span>
                      <span>© Decanato de Johto Tech University</span>
                    </div>
                  </div>
                </div>

                {/* Reader Progress indicator footer */}
                <div className="h-10 px-6 border-t border-slate-200 flex items-center justify-between text-[9px] font-black uppercase text-slate-500 tracking-widest bg-white/95">
                  <span>Visualizando: {activeChapter.title}</span>
                  <div className="flex gap-1">
                    {[...Array(8)].map((_, i) => (
                      <div 
                        key={i} 
                        style={i === activeCompendiumPage ? { backgroundColor: '#e60012' } : {}}
                        className={`w-2.5 h-1 rounded-full transition-all duration-300 ${
                          i === activeCompendiumPage ? "w-6 bg-nintendo-red" : "bg-slate-200"
                        }`} 
                      />
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* Global CSS transition and page print styling override */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .bg-white.p-4.rounded-2xl.border.border-slate-200.shadow-inner,
          .bg-white.p-4.rounded-2xl.border.border-slate-200.shadow-inner * {
            visibility: visible;
          }
          .bg-white.p-4.rounded-2xl.border.border-slate-200.shadow-inner {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: 2px solid #000 !important;
            padding: 40px !important;
          }
          button {
            display: none !important;
          }
        }
        .animate-spin-hover:hover {
          transform: rotate(180deg);
        }
      `}</style>
    </div>
  )
}
