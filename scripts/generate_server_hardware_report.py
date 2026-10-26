import os
import sys
import shutil

# ==============================================================================
# SCRIPT DE GENERACIÓN MAESTRA DE DOCUMENTACIÓN TÉCNICA (DOCX Y PDF)
# PROYECTO: NORA ITU IA & SUSY BOT - DIMENSIONAMIENTO DE SERVIDOR Y HARDWARE
# AUTOR: MyJNexoraVisual
# ==============================================================================

import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle, PageBreak, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

# Paleta Ejecutiva
NAVY_PRIMARY = colors.HexColor('#0F172A')     # Azul Marino Profundo (Títulos)
EMERALD_ACCENT = colors.HexColor('#047857')   # Verde Esmeralda (Acentos / Éxito)
SLATE_TEXT = colors.HexColor('#334155')       # Texto Gris Pizarra
LIGHT_BG = colors.HexColor('#F8FAFC')         # Fondo Suave
BORDER_COLOR = colors.HexColor('#CBD5E1')     # Bordes de Tabla
CRIMSON_WARN = colors.HexColor('#B91C1C')     # Alertas de Seguridad
AMBER_NOTE = colors.HexColor('#B45309')       # Notas de Atención

class NumberedCanvas(canvas.Canvas):
    """Generador de cabeceras y pies de página dinámicos con numeración 'Página X de Y'"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor('#64748B'))

        # Header (A partir de la página 2)
        if self._pageNumber > 1:
            self.drawString(36, 810, "INFORME TÉCNICO: DIMENSIONAMIENTO DE SERVIDOR Y HARDWARE | NORA ITU & SUSY BOT")
            self.drawRightString(559, 810, "CONFIDENCIALIDAD: INFRAESTRUCTURA")
            self.setStrokeColor(colors.HexColor('#CBD5E1'))
            self.setLineWidth(0.5)
            self.line(36, 804, 559, 804)

        # Footer (Todas las páginas)
        self.setFont("Helvetica", 8)
        self.drawString(36, 25, "MyJNexoraVisual - Ecosistema de Inteligencia Artificial Soberana On-Premise")
        page_text = f"Página {self._pageNumber} de {page_count}"
        self.drawRightString(559, 25, page_text)
        self.setStrokeColor(colors.HexColor('#CBD5E1'))
        self.setLineWidth(0.5)
        self.line(36, 35, 559, 35)

        self.restoreState()


def set_cell_background(cell, hex_color):
    """Aplica color de fondo a una celda de Word (.docx)"""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Establece padding interno en una celda de Word (.docx)"""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)


def build_word_document(docx_path):
    print(f"[*] Generando documento Word profesional en: {docx_path}...")
    doc = Document()

    # Márgenes de 2.0 cm (0.8 pulgadas)
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Portada y Cabecera
    p_pre = doc.add_paragraph()
    r_pre = p_pre.add_run("INFORME TÉCNICO DE INFRAESTRUCTURA, CÓMPUTO Y DESPLIEGUE")
    r_pre.font.name = "Arial"
    r_pre.font.size = Pt(11)
    r_pre.font.bold = True
    r_pre.font.color.rgb = RGBColor(4, 120, 87) # Emerald

    p_title = doc.add_paragraph()
    r_title = p_title.add_run("DIMENSIONAMIENTO DE SERVIDOR, GPU Y GUÍA DE HABILITACIÓN SOBERANA")
    r_title.font.name = "Arial"
    r_title.font.size = Pt(20)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(15, 23, 42) # Navy Dark

    p_sub = doc.add_paragraph()
    r_sub = p_sub.add_run("Análisis Comparativo: NoraItu IA vs. Susy Bot Municipal | Niveles de Recursos (Promedio y Bajo) | Guía de Despliegue sin Exposición de Datos Sensibles")
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(11)
    r_sub.font.italic = True
    r_sub.font.color.rgb = RGBColor(71, 85, 105)

    # Tabla Ficha Técnica
    meta_table = doc.add_table(rows=5, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Proyecto / Ecosistema:", "NoraItu IA & Susy Bot Municipal (MyJNexoraVisual)"),
        ("Jurisdicción y Sede:", "Ituzaingó, Corrientes - República Argentina"),
        ("Propósito del Informe:", "Evaluación y acondicionamiento de servidor físico dedicado para cómputo de IA local"),
        ("Clasificación de Seguridad:", "INFRAESTRUCTURA Y SISTEMAS (Preservación estricta de propiedad intelectual y claves)"),
        ("Marco Normativo y Blindaje:", "Ley 25.326 de Protección de Datos Personales y Ley 11.723 de Propiedad Intelectual")
    ]
    for i, (k, v) in enumerate(meta_data):
        row = meta_table.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.3)
        c1.width = Inches(4.7)
        p0, p1 = c0.paragraphs[0], c1.paragraphs[0]
        r0 = p0.add_run(k)
        r0.font.bold = True
        r0.font.size = Pt(9.5)
        r1 = p1.add_run(v)
        r1.font.size = Pt(9.5)
        set_cell_background(c0, "F1F5F9")
        set_cell_background(c1, "F8FAFC")
        set_cell_margins(c0, 70, 70, 90, 90)
        set_cell_margins(c1, 70, 70, 90, 90)

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # 1. Resumen Ejecutivo
    h1 = doc.add_heading("1. Resumen Ejecutivo y Diagnóstico Técnico", level=1)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "El presente documento técnico responde a la oportunidad estratégica de acondicionar y desplegar "
        "un servidor físico dedicado ofrecido por un colaborador para ejecutar localmente la tecnología de "
        "inteligencia artificial desarrollada en los proyectos NoraItu IA y Susy Bot. El objetivo central es "
        "extraer el 100% del potencial de este ecosistema con soberanía tecnológica absoluta, costo de inferencia "
        "$0 y sin dependencia obligatoria de APIs comerciales extranjeras, garantizando que los datos confidenciales, "
        "documentos vecinales, expedientes y registros escolares no abandonen la infraestructura propia."
    )

    # 2. Análisis Comparativo
    h2 = doc.add_heading("2. Comparativa Arquitectónica: NoraItu IA vs. Susy Bot", level=1)
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "Ambos sistemas constituyen ramas evolutivas del mismo núcleo tecnológico soberano desarrollado por "
        "MyJNexoraVisual, pero han sido calibrados para satisfacer objetivos de dominio específicos:"
    )

    comp_table = doc.add_table(rows=8, cols=3)
    comp_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Componente / Dimensión", "NoraItu IA (Educativo, Multimodal, Cívico)", "Susy Bot (Municipal, Trámites, Inclusivo)"]
    for col_idx, text in enumerate(headers):
        cell = comp_table.cell(0, col_idx)
        p = cell.paragraphs[0]
        run = p.add_run(text)
        run.font.bold = True
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(255, 255, 255)
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, 100, 100, 100, 100)

    rows_data = [
        ("Misión Primaria", "Docente universal en casa, cátedra universitaria, inclusión TEA/DUA y periodismo cívico.", "Directora virtual de atención al vecino, gestión de trámites municipales y ordenanzas."),
        ("Visión Computacional", "Cámara Titán Live (análisis HUD didáctico, lectura de pizarrones, exámenes y libros).", "Lazarillo Espacial Urbano (referencias reloj 12 en punto, lectura de DNI, tasas y desniveles)."),
        ("Módulo de Reclamos y Gestión", "Guía comercial, promociones, clasificados, bolsa de trabajo y portal cívico.", "Sistema de tickets #ITU-XXX (bacheo, luminarias, bromatología, defensa civil con georreferencia)."),
        ("Audio y Voz", "Transcripción Whisper (<200ms) y sintetizador fonético neutro para dictados pedagógicos.", "Sintetizador fonético cálido litoraleño, wake-word local y soporte para gateway de radio/malla."),
        ("Base de Datos y RAG", "PostgreSQL con pgvector (HNSW) sobre contenidos curriculares, guías y noticias.", "PostgreSQL con pgvector + GraphRAG municipal (ordenanzas, áreas comunales y funcionarios)."),
        ("Accesibilidad Especializada", "Modo TEA con pictogramas ARASAAC y adaptaciones curriculares DUA automáticas.", "Modo No Vidente háptico y espacial, orientación táctica en vía pública."),
        ("Estrategia de Despliegue", "Híbrido (PWA offline con WebGPU + Servidor de Alta Capacidad + Red Mesh).", "100% On-Premise dentro de la red municipal protegida / servidor local aislado.")
    ]

    for row_idx, rdata in enumerate(rows_data, start=1):
        for col_idx, text in enumerate(rdata):
            cell = comp_table.cell(row_idx, col_idx)
            p = cell.paragraphs[0]
            run = p.add_run(text)
            run.font.size = Pt(8.5)
            if col_idx == 0:
                run.font.bold = True
            bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
            set_cell_background(cell, bg)
            set_cell_margins(cell, 70, 70, 80, 80)

    comp_table.columns[0].width = Inches(1.8)
    comp_table.columns[1].width = Inches(2.6)
    comp_table.columns[2].width = Inches(2.6)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # 3. Factor Clave: GPU y VRAM
    h3 = doc.add_heading("3. Análisis de Carga de Cómputo: Por qué la GPU y la VRAM son Críticas", level=1)
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "En la inferencia de Inteligencia Artificial moderna basada en modelos de pesos abiertos (Open Weights como "
        "LLaMA 3.3, Qwen 2.5 y Whisper), el factor limitante absoluto es la MEMORIA DE VIDEO DEDICADA (VRAM) de la "
        "tarjeta gráfica (GPU) y su ancho de banda en gigabytes por segundo (GB/s)."
    )

    doc.add_paragraph(
        "• Diferencia de Ancho de Banda (RAM vs VRAM): La memoria RAM principal del servidor (DDR4/DDR5) alcanza tasas de "
        "30 a 80 GB/s. En comparación, la VRAM de una tarjeta gráfica NVIDIA moderna opera entre 500 y 1.000 GB/s. Si un "
        "modelo se ejecuta en CPU/RAM, la velocidad de respuesta cae a 2-4 palabras por segundo (lenta y entrecortada). "
        "En GPU, la respuesta alcanza 35-70 palabras por segundo, permitiendo una experiencia conversacional y visual instantánea.\n"
        "• Coexistencia de Modelos Multimodales: El sistema debe mantener cargados en memoria varios modelos a la vez: "
        "(1) El LLM cognitivo de texto, (2) El modelo de visión para la Cámara Titán / Lazarillo, (3) El modelo Whisper para "
        "transcripción de audio en tiempo real y (4) El modelo de embeddings para búsqueda vectorial. Para evitar que el servidor "
        "tenga que descargar y cargar modelos constantemente (swap que demora 10-30 segundos), la VRAM debe ser suficiente.\n"
        "• Cuantización Inteligente (GGUF / Q4_K_M): Los modelos originales de 70 mil millones de parámetros pesan 140 GB en FP16. "
        "Mediante cuantización moderna a 4 bits (Q4), el peso se reduce a ~42 GB de VRAM reteniendo más del 98% de su precisión y razonamiento."
    )

    # 4. Niveles de Recursos: Promedio y Bajo
    h4 = doc.add_heading("4. Especificaciones Técnicas del Servidor: Nivel Promedio y Nivel Bajo", level=1)
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "Se definen dos escalones de hardware claramente diferenciados para acondicionar el equipo disponible según "
        "el nivel de inversión y la demanda de usuarios esperada:"
    )

    # 4.1 Nivel Bajo
    h41 = doc.add_heading("4.1. Nivel Bajo / Mínimo Viable (Piloto, Desarrollo y Pruebas)", level=2)
    doc.add_paragraph(
        "Orientado a validar el sistema, realizar pruebas funcionales, demostraciones y atender hasta 8 usuarios "
        "concurrentes en una escuela piloto o dependencia municipal con presupuesto acotado."
    )

    table_low = doc.add_table(rows=7, cols=2)
    table_low.alignment = WD_TABLE_ALIGNMENT.CENTER
    low_specs = [
        ("Tarjeta Gráfica (GPU)", "NVIDIA GeForce RTX 3060 (12 GB VRAM) o RTX 4060 Ti (16 GB VRAM).\nPara servidor en rack: NVIDIA Tesla T4 (16 GB VRAM pasiva)."),
        ("VRAM Mínima Dedicada", "12 GB a 16 GB GDDR6 (Imprescindible para albergar modelos de 8B + Visión)."),
        ("Procesador (CPU)", "Intel Core i7 (10ª gen o superior) / AMD Ryzen 7 (8 núcleos / 16 hilos).\nServidor: Intel Xeon Silver / AMD EPYC de 8 a 12 núcleos."),
        ("Memoria RAM del Servidor", "32 GB DDR4 / DDR5 (3200 MHz o superior). Permite offload seguro de memoria."),
        ("Almacenamiento del Sistema", "500 GB a 1 TB SSD NVMe M.2 PCIe 3.0/4.0 (Lectura > 3.000 MB/s)."),
        ("Fuente de Poder (PSU)", "650W a 750W con certificación 80 Plus Gold o Platinum."),
        ("Modelos Soportados y Rendimiento", "• LLM Texto: LLaMA 3.1 8B Instruct (Q4_K_M ~5.5 GB VRAM)\n• Visión: LLaMA 3.2 11B Vision (Q4 ~8 GB) o Moondream2\n• Audio: Whisper Medium / Small (~1.5 GB VRAM)\n• Embeddings: nomic-embed-text (~0.5 GB)\n• Rendimiento: 35-50 tokens/segundo (Fluido para uso individual o grupos chicos).")
    ]
    for i, (k, v) in enumerate(low_specs):
        c0, c1 = table_low.rows[i].cells[0], table_low.rows[i].cells[1]
        c0.width = Inches(2.3)
        c1.width = Inches(4.7)
        p0, p1 = c0.paragraphs[0], c1.paragraphs[0]
        r0 = p0.add_run(k)
        r0.font.bold = True
        r0.font.size = Pt(9)
        r1 = p1.add_run(v)
        r1.font.size = Pt(9)
        set_cell_background(c0, "F1F5F9")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0, 60, 60, 80, 80)
        set_cell_margins(c1, 60, 60, 80, 80)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # 4.2 Nivel Promedio / Recomendado
    h42 = doc.add_heading("4.2. Nivel Promedio / Recomendado (Máximo Potencial y Alta Concurrencia)", level=2)
    doc.add_paragraph(
        "Configuración de alto poder para liberar todo el potencial cognitivo de Nora Itu y Susy Bot. Permite correr "
        "el cerebro LLaMA 3.3 de 70 mil millones de parámetros con razonamiento profundo, cámara en vivo a alta tasa de cuadros, "
        "transcripción en tiempo real y soporte para más de 30 consultas simultáneas sin demoras."
    )

    table_high = doc.add_table(rows=7, cols=2)
    table_high.alignment = WD_TABLE_ALIGNMENT.CENTER
    high_specs = [
        ("Tarjeta Gráfica (GPU)", "Opción A (Recomendada Consumo): 1x NVIDIA GeForce RTX 3090 (24 GB) o RTX 4090 (24 GB).\nOpción B (Óptima 70B Dual): 2x NVIDIA RTX 3090 (Total 48 GB VRAM combinada).\nOpción C (Datacenter / Workstation): NVIDIA RTX A5000 (24 GB), RTX A6000 (48 GB) o NVIDIA L4 (24 GB)."),
        ("VRAM Recomendada", "24 GB (Single GPU para modelos de 32B y 70B híbrido) o 48 GB (Dual GPU para 70B nativo 100% en VRAM)."),
        ("Procesador (CPU)", "AMD Ryzen 9 7900X / 7950X o Intel Core i9 (13ª/14ª gen, 16 a 24 núcleos).\nServidor Enterprise: AMD EPYC 7003/9004 o Intel Xeon Gold (16 a 32 núcleos físicos)."),
        ("Memoria RAM del Servidor", "64 GB a 128 GB DDR5 ECC (4800+ MT/s). Absorbe picos de concurrencia sin riesgo de colapso."),
        ("Almacenamiento del Sistema", "2 TB SSD NVMe PCIe 4.0 / 5.0 (Lectura > 6.500 MB/s). Carga modelos de 40 GB en 6 segundos."),
        ("Fuente de Poder y Protección", "1.000W a 1.200W 80 Plus Platinum + Sistema UPS (SAI) Online 1500VA/2000VA con onda senoidal pura."),
        ("Modelos Soportados y Rendimiento", "• LLM Cognitivo: LLaMA 3.3 70B Instruct (Q4 ~42 GB) o Qwen 2.5 32B Instruct a máxima precisión\n• Visión: Qwen 2.5-VL 7B / LLaMA 3.2 11B Vision a resolución completa\n• Audio: Whisper Large v3 Turbo (<150ms de latencia de transcripción)\n• Embeddings: bge-m3 / nomic-embed-text en GPU con procesamiento por lotes\n• Rendimiento: 45-70 tokens/segundo estables con más de 25 llamadas y cámaras concurrentes.")
    ]
    for i, (k, v) in enumerate(high_specs):
        c0, c1 = table_high.rows[i].cells[0], table_high.rows[i].cells[1]
        c0.width = Inches(2.3)
        c1.width = Inches(4.7)
        p0, p1 = c0.paragraphs[0], c1.paragraphs[0]
        r0 = p0.add_run(k)
        r0.font.bold = True
        r0.font.size = Pt(9)
        r1 = p1.add_run(v)
        r1.font.size = Pt(9)
        set_cell_background(c0, "ECFDF5")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0, 60, 60, 80, 80)
        set_cell_margins(c1, 60, 60, 80, 80)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # 5. Guía de Despliegue en el Servidor
    h5 = doc.add_heading("5. Guía de Despliegue en el Servidor (Blindaje y Cero Exposición)", level=1)
    h5.paragraph_format.space_before = Pt(14)
    h5.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "A continuación se presenta el procedimiento técnico estandarizado para habilitar el servidor sin "
        "exponer código fuente sensible ni claves maestras de producción ante terceros o administradores externos:"
    )

    steps = [
        ("Paso 1: Instalación de Drivers NVIDIA y CUDA", 
         "En el servidor (con Ubuntu Server 24.04 LTS instalado):\n"
         "sudo apt update && sudo apt install -y build-essential dkms\n"
         "sudo apt install -y nvidia-driver-550-server nvidia-utils-550-server\n"
         "Reiniciar y verificar reconocimiento de la GPU ejecutando: nvidia-smi"),

        ("Paso 2: Instalación del Motor Desacoplado Ollama",
         "Ollama gestiona la carga y descarga de modelos en la GPU de manera autónoma:\n"
         "curl -fsSL https://ollama.com/install.sh | sh\n"
         "Configurar inicio automático como servicio del sistema:\n"
         "sudo systemctl enable ollama\n"
         "sudo systemctl start ollama"),

        ("Paso 3: Descarga de Modelos Abiertos Soberanos",
         "Ejecutar según el escalón de hardware disponible:\n"
         "# Configuración Nivel Bajo:\n"
         "ollama pull llama3.1:8b\n"
         "ollama pull llama3.2-vision\n"
         "ollama pull nomic-embed-text\n"
         "# Configuración Nivel Promedio / Recomendado:\n"
         "ollama pull llama3.3:70b\n"
         "ollama pull qwen2.5-vl\n"
         "ollama pull nomic-embed-text"),

        ("Paso 4: Base de Datos Relacional y Vectorial (PostgreSQL + pgvector)",
         "Ejecutar contenedor Docker aislado en red local (127.0.0.1):\n"
         "docker run -d --name nora-db --restart always \\\n"
         "  -e POSTGRES_DB=noraitu_db \\\n"
         "  -e POSTGRES_USER=nora_admin \\\n"
         "  -e POSTGRES_PASSWORD=PASSWORD_SEGURA_GENERADA \\\n"
         "  -p 127.0.0.1:5432:5432 \\\n"
         "  -v nora_pgdata:/var/lib/postgresql/data \\\n"
         "  pgvector/pgvector:pg16"),

        ("Paso 5: Despliegue de la Aplicación (Next.js con PM2)",
         "Compilar previamente la aplicación para proteger el código fuente:\n"
         "npm install -g pm2\n"
         "npm run build\n"
         "pm2 start npm --name 'noraitu-server' -- start -- -p 3000\n"
         "pm2 save && pm2 startup"),

        ("Paso 6: Proxy Inverso Nginx y Certificados SSL",
         "Configurar Nginx para direccionar el tráfico entrante de los puertos 80/443 al puerto local 3000, "
         "con soporte de streaming SSE (proxy_buffering off, proxy_read_timeout 300s) y certificados HTTPS.")
    ]

    for title, desc in steps:
        h_step = doc.add_heading(title, level=2)
        h_step.paragraph_format.space_before = Pt(8)
        h_step.paragraph_format.space_after = Pt(2)
        p_desc = doc.add_paragraph(desc)
        p_desc.paragraph_format.space_after = Pt(6)

    # 6. Protocolo de Blindaje y Seguridad
    h6 = doc.add_heading("6. Protocolo de Blindaje de Seguridad y Protección de Datos", level=1)
    h6.paragraph_format.space_before = Pt(14)
    h6.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "Para salvaguardar la propiedad intelectual de MyJNexoraVisual y dar cumplimiento estricto a la Ley 25.326 de "
        "Protección de Datos Personales de la República Argentina, se deben observar las siguientes directivas:"
    )

    sec_rules = [
        ("Aislamiento Estricto de Puertos (Firewall UFW)", "Los puertos internos de inferencia (11434 de Ollama) y de base de datos (5432) DEBEN estar vinculados a 127.0.0.1. El firewall UFW solo debe permitir acceso a los puertos 80 (HTTP) y 443 (HTTPS) desde la red exterior."),
        ("Gestión Segura de Variables de Entorno", "Todas las credenciales locales deben residir en el archivo .env.production con permisos restringidos (chmod 600 .env.production). Jamás deben comitearse llaves maestras a repositorios Git públicos ni privados."),
        ("Protección de la Propiedad Intelectual", "Si el servidor físico es compartido o administrado por terceros, el código fuente (.ts, .tsx) y los prompts de blindaje constitucional NO deben quedar expuestos. Se debe entregar la aplicación compilada (standalone build de Next.js) o una imagen Docker sellada."),
        ("Respaldo Eléctrico y Térmico", "El servidor debe instalarse en una sala con refrigeración continua (<24°C) y conectado a una UPS senoidal online de 1500VA+ para prevenir cortes abruptos que dañen los sectores de la GPU o la base vectorial.")
    ]

    for title, desc in sec_rules:
        p_sec = doc.add_paragraph()
        r_sec_title = p_sec.add_run(f"🔒 {title}: ")
        r_sec_title.bold = True
        r_sec_title.font.color.rgb = RGBColor(185, 28, 28)
        p_sec.add_run(desc)

    # 7. Checklist para el Amigo del Servidor
    h7 = doc.add_heading("7. Checklist y Preguntas Clave para el Amigo que Ofrece el Servidor", level=1)
    h7.paragraph_format.space_before = Pt(14)
    h7.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "Antes de comprometer o trasladar el equipo físico, realice las siguientes 5 preguntas técnicas al colaborador:"
    )

    questions = [
        "1. ¿Qué formato de chasis tiene el servidor? Si es un rack de 1U o 2U delgado, NO entrará una tarjeta gráfica convencional (RTX 3060/3090/4090) por altura y grosor. Se requiere chasis torre o rack de 4U.",
        "2. ¿Cuántos Watts ofrece la fuente de poder y qué conectores PCIe tiene libres? Se necesitan conectores PCIe de 8 pines dedicados y una fuente de mínimo 650W (nivel bajo) o 1000W (nivel promedio).",
        "3. ¿Qué procesador y qué versión de PCI Express tiene la placa madre? Se requiere ranura PCIe 4.0 x16 con soporte para 'Resizable BAR' (clave para la velocidad de intercambio CPU-GPU).",
        "4. ¿Cuánta memoria RAM física tiene instalada el equipo y si es expandible? El mínimo operativo son 32 GB, siendo recomendable 64 GB o 128 GB para soportar alta concurrencia.",
        "5. ¿Cuenta con bahías para discos NVMe M.2 de alta velocidad? Los discos mecánicos (HDD) son inviables para cargar modelos de IA en frío debido a su lentitud."
    ]

    for q in questions:
        p_q = doc.add_paragraph()
        p_q.add_run(f"✓ {q}")

    # Cierre y Firma
    doc.add_paragraph().paragraph_format.space_after = Pt(20)
    p_sign = doc.add_paragraph()
    p_sign.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_sign1 = p_sign.add_run("MyJNexoraVisual - Dirección de Infraestructura e Innovación en IA\n")
    r_sign1.font.bold = True
    r_sign1.font.size = Pt(10)
    r_sign2 = p_sign.add_run("Ecosistema Soberano NoraItu IA & Susy Bot Municipal | Ituzaingó, Corrientes")
    r_sign2.font.italic = True
    r_sign2.font.size = Pt(9)
    r_sign2.font.color.rgb = RGBColor(100, 116, 139)

    doc.save(docx_path)
    print(f"[+] Documento Word generado con éxito: {docx_path}")


def build_pdf_document(pdf_path):
    print(f"[*] Generando documento PDF profesional en: {pdf_path}...")
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=17,
        leading=21,
        textColor=NAVY_PRIMARY,
        fontName='Helvetica-Bold',
        alignment=TA_LEFT,
        spaceAfter=3
    )

    pretitle_style = ParagraphStyle(
        'DocPreTitle',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=EMERALD_ACCENT,
        fontName='Helvetica-Bold',
        alignment=TA_LEFT,
        spaceAfter=2
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=SLATE_TEXT,
        fontName='Helvetica-Oblique',
        alignment=TA_LEFT,
        spaceAfter=8
    )

    h1_style = ParagraphStyle(
        'Heading1Custom',
        parent=styles['Heading1'],
        fontSize=11.5,
        leading=15,
        textColor=NAVY_PRIMARY,
        fontName='Helvetica-Bold',
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontSize=9.5,
        leading=13,
        textColor=EMERALD_ACCENT,
        fontName='Helvetica-Bold',
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontSize=8,
        leading=11,
        textColor=SLATE_TEXT,
        fontName='Helvetica',
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontSize=8,
        leading=11,
        textColor=SLATE_TEXT,
        fontName='Helvetica',
        leftIndent=12,
        spaceAfter=3
    )

    tbl_header = ParagraphStyle(
        'TblHeader',
        parent=styles['Normal'],
        fontSize=8,
        leading=10,
        textColor=colors.white,
        fontName='Helvetica-Bold',
        alignment=TA_LEFT
    )

    tbl_cell = ParagraphStyle(
        'TblCell',
        parent=styles['Normal'],
        fontSize=7.2,
        leading=9.5,
        textColor=SLATE_TEXT,
        fontName='Helvetica'
    )

    story = []

    # =========================================================================
    # PÁGINA 1: PORTADA, RESUMEN EJECUTIVO Y COMPARATIVA ARQUITECTÓNICA
    # =========================================================================
    story.append(Paragraph("INFORME TÉCNICO DE INFRAESTRUCTURA Y HARDWARE", pretitle_style))
    story.append(Paragraph("DIMENSIONAMIENTO DE SERVIDOR, GPU Y GUÍA DE HABILITACIÓN", title_style))
    story.append(Paragraph("Ecosistema Soberano NoraItu IA & Susy Bot | Análisis Promedio y Bajo | Blindaje y Seguridad", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=EMERALD_ACCENT, spaceAfter=8, spaceBefore=0))

    meta_table_data = [
        [Paragraph("<b>Proyecto / Ecosistema:</b>", tbl_cell), Paragraph("NoraItu IA & Susy Bot Municipal (MyJNexoraVisual - Ituzaingó, Corrientes)", tbl_cell)],
        [Paragraph("<b>Propósito del Documento:</b>", tbl_cell), Paragraph("Evaluación y dimensionamiento de servidor físico dedicado para cómputo local de IA", tbl_cell)],
        [Paragraph("<b>Nivel de Seguridad:</b>", tbl_cell), Paragraph("TÉCNICA DE INFRAESTRUCTURA (Preservación estricta de propiedad intelectual y claves)", tbl_cell)],
        [Paragraph("<b>Marco Normativo:</b>", tbl_cell), Paragraph("Ley 25.326 de Protección de Datos Personales y Ley 11.723 de Propiedad Intelectual", tbl_cell)]
    ]
    t_meta = Table(meta_table_data, colWidths=[130, 393])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F1F5F9')),
        ('BACKGROUND', (1,0), (1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 8))

    story.append(Paragraph("1. Resumen Ejecutivo y Diagnóstico Técnico", h1_style))
    story.append(Paragraph(
        "El presente informe establece las especificaciones de hardware, tarjeta gráfica (GPU) y directivas técnicas "
        "para acondicionar un servidor físico dedicado ofrecido por un colaborador. El objetivo es correr localmente "
        "el ecosistema de IA integrado por <b>NoraItu IA</b> y <b>Susy Bot</b> con <b>soberanía tecnológica total, costo $0 "
        "y estricta privacidad</b>, impidiendo que datos sensibles de estudiantes y ciudadanos salgan de la infraestructura propia.",
        body_style
    ))

    story.append(Paragraph("2. Comparativa Arquitectónica: NoraItu IA vs. Susy Bot", h1_style))
    story.append(Paragraph(
        "Ambos proyectos derivan del mismo núcleo soberano desacoplado, pero responden a propósitos especializados:",
        body_style
    ))

    comp_data = [
        [Paragraph("Dimensión", tbl_header), Paragraph("NoraItu IA (Educativo & Multimodal)", tbl_header), Paragraph("Susy Bot (Municipal & Ciudadano)", tbl_header)],
        [Paragraph("<b>Propósito Central</b>", tbl_cell), Paragraph("Docente universal, cátedra universitaria, inclusión TEA/DUA y periodismo cívico.", tbl_cell), Paragraph("Directora virtual de atención al vecino, trámites municipales y ordenanzas.", tbl_cell)],
        [Paragraph("<b>Visión en Vivo</b>", tbl_cell), Paragraph("Cámara Titán Live (pizarrones, textos didácticos, análisis hud interactivo).", tbl_cell), Paragraph("Lazarillo Espacial Urbano (referencias reloj 12 en punto, lectura de DNI y tasas).", tbl_cell)],
        [Paragraph("<b>Reclamos y Servicios</b>", tbl_cell), Paragraph("Guía comercial local, clasificados, promociones y bolsa de trabajo.", tbl_cell), Paragraph("Módulo de tickets #ITU-XXX (luminarias, bacheo, bromatología, defensa civil).", tbl_cell)],
        [Paragraph("<b>Audio y Fonética</b>", tbl_cell), Paragraph("Whisper cuántico (<200ms) y sintetizador fonético neutro.", tbl_cell), Paragraph("Sintetizador cálido litoraleño, wake-word local y soporte gateway radio/mesh.", tbl_cell)],
        [Paragraph("<b>Base de Datos / RAG</b>", tbl_cell), Paragraph("pgvector sobre artículos, guías y secuencias didácticas.", tbl_cell), Paragraph("pgvector + GraphRAG municipal (ordenanzas, áreas comunales).", tbl_cell)],
        [Paragraph("<b>Despliegue</b>", tbl_cell), Paragraph("Híbrido (PWA offline WebGPU + Servidor de Alta Capacidad).", tbl_cell), Paragraph("100% On-Premise dentro de la red municipal protegida.", tbl_cell)]
    ]
    t_comp = Table(comp_data, colWidths=[85, 219, 219])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY_PRIMARY),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, LIGHT_BG])
    ]))
    story.append(t_comp)

    # SALTO DE PÁGINA PARA LA SECCIÓN DE CÓMPUTO Y HARDWARE
    story.append(PageBreak())

    # =========================================================================
    # PÁGINA 2: ANÁLISIS DE CÓMPUTO Y ESPECIFICACIONES DE HARDWARE (PROMEDIO Y BAJO)
    # =========================================================================
    story.append(Paragraph("3. Por qué la GPU y la VRAM son el Factor Determinante", h1_style))
    story.append(Paragraph(
        "En la ejecución de IA generativa con modelos de pesos abiertos (LLaMA 3.3, Qwen 2.5, Whisper), el componente "
        "crítico es la <b>VRAM (Memoria de Video Dedicada)</b> de la tarjeta gráfica y su ancho de banda en GB/s. "
        "La memoria RAM estándar del servidor transfiere entre 30 y 80 GB/s, mientras que la VRAM de una tarjeta NVIDIA "
        "opera entre 500 y 1.000 GB/s (15x a 25x más veloz). Si un modelo corre en CPU/RAM, la velocidad se reduce a "
        "2-4 palabras por segundo; en GPU, alcanza 35-70 palabras por segundo con fluidez humana instantánea. "
        "Asimismo, se requiere suficiente VRAM para que coexistan el LLM de texto, el modelo de visión y Whisper "
        "sin demoras de swap en disco.",
        body_style
    ))

    story.append(Paragraph("4. Dimensionamiento del Servidor: Nivel Promedio y Nivel Bajo", h1_style))

    # Nivel Bajo
    story.append(Paragraph("4.1. Nivel Bajo / Mínimo Viable (Piloto, Pruebas y Desarrollo)", h2_style))
    low_data = [
        [Paragraph("<b>Tarjeta Gráfica (GPU)</b>", tbl_cell), Paragraph("NVIDIA GeForce RTX 3060 (12 GB VRAM) o RTX 4060 Ti (16 GB VRAM). Servidor Rack: Tesla T4 (16 GB).", tbl_cell)],
        [Paragraph("<b>VRAM Mínima Dedicada</b>", tbl_cell), Paragraph("12 GB a 16 GB GDDR6 dedicada (imprescindible para modelos de 8B + Visión).", tbl_cell)],
        [Paragraph("<b>CPU y Memoria RAM</b>", tbl_cell), Paragraph("Intel Core i7 (10ª gen+) / AMD Ryzen 7 (8 núcleos / 16 hilos) | 32 GB RAM DDR4/DDR5.", tbl_cell)],
        [Paragraph("<b>Almacenamiento</b>", tbl_cell), Paragraph("500 GB a 1 TB SSD NVMe M.2 (Lectura > 3.000 MB/s). Evitar discos mecánicos.", tbl_cell)],
        [Paragraph("<b>Fuente de Poder (PSU)</b>", tbl_cell), Paragraph("650W a 750W con certificación 80 Plus Gold.", tbl_cell)],
        [Paragraph("<b>Modelos Soportados y Capacidad</b>", tbl_cell), Paragraph("LLaMA 3.1 8B (Q4 ~5.5 GB) + LLaMA 3.2 11B Vision (Q4) + Whisper Medium + nomic-embed-text. "
                                                                               "Capacidad: 3 a 8 usuarios simultáneos a 35-50 tokens/segundo.", tbl_cell)]
    ]
    t_low = Table(low_data, colWidths=[125, 398])
    t_low.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F1F5F9')),
        ('BACKGROUND', (1,0), (1,-1), colors.white),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_low)
    story.append(Spacer(1, 8))

    # Nivel Promedio / Recomendado
    story.append(Paragraph("4.2. Nivel Promedio / Recomendado (Máximo Potencial y Producción Real)", h2_style))
    high_data = [
        [Paragraph("<b>Tarjeta Gráfica (GPU)</b>", tbl_cell), Paragraph("Opción A: 1x NVIDIA RTX 3090 / 4090 (24 GB VRAM) | Opción B (Óptima 70B): 2x RTX 3090 (48 GB VRAM combinada) | Enterprise: NVIDIA RTX A5000 / A6000.", tbl_cell)],
        [Paragraph("<b>VRAM Recomendada</b>", tbl_cell), Paragraph("24 GB (Single GPU para 32B y 70B híbrido) o 48 GB (Dual GPU para 70B nativo 100% en VRAM).", tbl_cell)],
        [Paragraph("<b>CPU y Memoria RAM</b>", tbl_cell), Paragraph("AMD Ryzen 9 7900X / Core i9 (16 a 24 núcleos) o AMD EPYC / Xeon Gold | 64 GB a 128 GB DDR5 ECC.", tbl_cell)],
        [Paragraph("<b>Almacenamiento</b>", tbl_cell), Paragraph("2 TB SSD NVMe PCIe 4.0 (Lectura > 6.500 MB/s). Permite cargar modelos de 40 GB en 6 segundos.", tbl_cell)],
        [Paragraph("<b>Fuente y Respaldo</b>", tbl_cell), Paragraph("1.000W a 1.200W 80 Plus Platinum + Sistema UPS (SAI) 1500VA/2000VA con onda senoidal pura.", tbl_cell)],
        [Paragraph("<b>Modelos Soportados y Capacidad</b>", tbl_cell), Paragraph("LLaMA 3.3 70B Instruct (Q4 ~42 GB) o Qwen 2.5 32B + Qwen 2.5-VL 7B / LLaMA 3.2 Vision + Whisper Large v3 Turbo + bge-m3. "
                                                                                "Capacidad: 25 a 50 usuarios concurrentes a 45-70 tokens/segundo sin cortes.", tbl_cell)]
    ]
    t_high = Table(high_data, colWidths=[125, 398])
    t_high.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#ECFDF5')),
        ('BACKGROUND', (1,0), (1,-1), colors.white),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_high)

    # SALTO DE PÁGINA PARA GUÍA DE DESPLIEGUE, BLINDAJE Y CHECKLIST
    story.append(PageBreak())

    # =========================================================================
    # PÁGINA 3: GUÍA DE DESPLIEGUE, BLINDAJE Y CHECKLIST DE EVALUACIÓN
    # =========================================================================
    story.append(Paragraph("5. Guía de Despliegue en el Servidor (Blindaje y Cero Exposición)", h1_style))
    story.append(Paragraph(
        "Comandos estandarizados para configurar el servidor de tu amigo sin comprometer código fuente ni claves maestras:",
        body_style
    ))

    steps_pdf = [
        ("Paso 1: Drivers NVIDIA y CUDA", 
         "sudo apt update && sudo apt install -y build-essential dkms nvidia-driver-550-server nvidia-utils-550-server\n"
         "Verificar reconocimiento ejecutando: nvidia-smi"),
        ("Paso 2: Motor de Inferencia Ollama", 
         "curl -fsSL https://ollama.com/install.sh | sh && sudo systemctl enable --now ollama"),
        ("Paso 3: Descarga de Modelos Abiertos Soberanos", 
         "# Nivel Bajo:  ollama pull llama3.1:8b && ollama pull llama3.2-vision && ollama pull nomic-embed-text\n"
         "# Nivel Alto:  ollama pull llama3.3:70b && ollama pull qwen2.5-vl && ollama pull nomic-embed-text"),
        ("Paso 4: Base de Datos pgvector (Docker Aislado en Localhost)", 
         "docker run -d --name nora-db --restart always -e POSTGRES_DB=noraitu_db -e POSTGRES_USER=nora_admin \\\n"
         "  -e POSTGRES_PASSWORD=PASSWORD_SEGURA -p 127.0.0.1:5432:5432 -v nora_pgdata:/var/lib/postgresql/data pgvector/pgvector:pg16"),
        ("Paso 5: Despliegue de la Aplicación (Next.js con PM2)", 
         "npm install -g pm2 && npm run build && pm2 start npm --name 'noraitu-server' -- start -- -p 3000 && pm2 save")
    ]

    for stitle, scode in steps_pdf:
        story.append(Paragraph(f"<b>{stitle}</b>", h2_style))
        story.append(Paragraph(f"<font face='Courier' color='#0F172A'>{scode.replace(chr(10), '<br/>')}</font>", body_style))

    story.append(Spacer(1, 4))

    story.append(Paragraph("6. Protocolo de Blindaje de Seguridad y Protección de Datos", h1_style))
    rules_text = [
        "<b>• Aislamiento de Puertos (UFW):</b> Ollama (11434) y PostgreSQL (5432) deben escuchar únicamente en 127.0.0.1. El firewall solo debe abrir los puertos 80 y 443 al exterior.",
        "<b>• Variables de Entorno Seguras:</b> Las credenciales residen en .env.production local con permisos restringidos (chmod 600). Prohibido comitear llaves a repositorios Git.",
        "<b>• Secreto de Propiedad Intelectual:</b> En servidores compartidos con terceros, desplegar la aplicación pre-compilada (.next build o Docker container) sin transferir los archivos TypeScript (.ts, .tsx) originales ni las directivas de blindaje constitucional.",
        "<b>• Cumplimiento Normativo:</b> Se respeta la Ley 25.326 de Protección de Datos Personales; ningún dato de estudiantes o vecinos sale del servidor."
    ]
    for r in rules_text:
        story.append(Paragraph(r, bullet_style))

    story.append(Spacer(1, 4))

    story.append(Paragraph("7. Checklist y Preguntas Clave para el Amigo del Servidor", h1_style))
    questions_pdf = [
        "1. ¿El chasis es tipo torre o rack 4U? (Racks 1U/2U delgados no admiten tarjetas gráficas estándar por falta de altura).",
        "2. ¿La fuente tiene conectores PCIe de 8 pines libres y cuántos Watts ofrece? (Mínimo 650W para 3060, 1000W para 3090/4090).",
        "3. ¿La placa madre tiene ranura PCIe 4.0 x16 y soporte de Resizable BAR en el BIOS?",
        "4. ¿Cuánta memoria RAM física tiene instalada el equipo y si es expandible? (Piso mínimo 32 GB, ideal 64 GB).",
        "5. ¿Tiene ranuras para almacenamiento SSD NVMe M.2 de alta velocidad?"
    ]
    for q in questions_pdf:
        story.append(Paragraph(f"<b>[ ]</b> {q}", bullet_style))

    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=4, spaceBefore=4))
    story.append(Paragraph("<b>MyJNexoraVisual</b> | Dirección de Tecnología e Infraestructura de IA Soberana | Ituzaingó, Corrientes", subtitle_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[+] Documento PDF generado con éxito: {pdf_path}")


if __name__ == "__main__":
    os.makedirs("docs", exist_ok=True)
    os.makedirs("public", exist_ok=True)

    docx_out = os.path.join("docs", "INFORME_TECNICO_SERVIDOR_Y_HARDWARE_NORA_ITU.docx")
    pdf_out = os.path.join("docs", "INFORME_TECNICO_SERVIDOR_Y_HARDWARE_NORA_ITU.pdf")

    build_word_document(docx_out)
    build_pdf_document(pdf_out)

    # Copias en carpeta pública para descarga directa
    shutil.copy(docx_out, os.path.join("public", "INFORME_TECNICO_SERVIDOR_Y_HARDWARE_NORA_ITU.docx"))
    shutil.copy(pdf_out, os.path.join("public", "INFORME_TECNICO_SERVIDOR_Y_HARDWARE_NORA_ITU.pdf"))

    # Copia a la carpeta de artefactos de la conversación
    artifact_dir = r"C:\Users\Javier López Gómez\.gemini\antigravity-ide\brain\9bd6b8b8-32e4-4269-8d2a-78898a0bd6c6"
    if os.path.exists(artifact_dir):
        shutil.copy(docx_out, os.path.join(artifact_dir, "INFORME_TECNICO_SERVIDOR_Y_HARDWARE_NORA_ITU.docx"))
        shutil.copy(pdf_out, os.path.join(artifact_dir, "INFORME_TECNICO_SERVIDOR_Y_HARDWARE_NORA_ITU.pdf"))
        print(f"[+] Copias guardadas en el directorio de artefactos: {artifact_dir}")

    print("[***] Generación de documentación técnica completada exitosamente.")
