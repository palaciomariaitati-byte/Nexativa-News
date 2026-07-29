import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

def generate_pdf():
    pdf_path = os.path.join("public", "MANUAL_INSTALACION_Y_USO_NORA_LIVE.pdf")
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#DC2626'),
        alignment=TA_LEFT,
        fontName='Helvetica-Bold',
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#475569'),
        alignment=TA_LEFT,
        fontName='Helvetica-Bold',
        spaceAfter=15
    )

    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#0F172A'),
        fontName='Helvetica-Bold',
        spaceBefore=12,
        spaceAfter=6
    )

    h3_style = ParagraphStyle(
        'Heading3Custom',
        parent=styles['Heading3'],
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#DC2626'),
        fontName='Helvetica-Bold',
        spaceBefore=8,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#334155'),
        alignment=TA_LEFT,
        fontName='Helvetica',
        spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#1E293B'),
        fontName='Helvetica',
        leftIndent=15,
        spaceAfter=4
    )

    alert_style = ParagraphStyle(
        'AlertCustom',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#78350F'),
        fontName='Helvetica',
        backColor=colors.HexColor('#FEF3C7'),
        borderColor=colors.HexColor('#F59E0B'),
        borderWidth=1,
        borderPadding=8,
        spaceBefore=8,
        spaceAfter=8,
        borderRadius=6
    )

    story = []

    # Title Banner
    story.append(Paragraph("🔴 Manual Oficial de Instalación y Uso: Nora Live Exteriores (v1.3.0)", title_style))
    story.append(Paragraph("Infraestructura de Inteligencia Artificial Periodística por <b>MyJNexoraVisual</b> para Cadena 4 & Nexativa News", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#EF4444'), spaceAfter=15))

    # Section 1
    story.append(Paragraph("📌 1. ¿Qué es Nora Live Exteriores?", h2_style))
    story.append(Paragraph("Es una plataforma periodística con Inteligencia Artificial (Redactora Jefa IA) desarrollada por <b>MyJNexoraVisual</b> para que los corresponsales, movileros, vecinos y redactores de <b>Cadena 4</b> puedan convertir reportes de voz, fotos de la calle, notas de texto, audios guardados o noticieros en artículos periodísticos terminados y listos para publicar en su diario digital en segundos.", body_style))

    # Section 2
    story.append(Paragraph("🛠️ 2. Guía de Instalación Rápida (Para el Administrador del sitio)", h2_style))
    story.append(Paragraph("<b>Step 1: Descargar el Plugin</b><br/>Archivo comprimido oficial: <code>nora-live-exteriores.zip</code> (Versión 1.3.0)", bullet_style))
    story.append(Paragraph("<b>Step 2: Subir a WordPress</b><br/>1. Inicia sesión en tu panel: <code>https://cadena4.com.ar/wp-admin</code><br/>2. Ve a <b>Plugins</b> &gt; <b>Añadir nuevo</b> &gt; <b>Subir plugin</b>.<br/>3. Selecciona el archivo <code>nora-live-exteriores.zip</code> y presiona <b>Instalar ahora</b>.", bullet_style))
    story.append(Paragraph("<b>Step 3: Activar el Plugin</b><br/>Haz clic en el botón azul <b>Activar plugin</b>. Aparecerá en el menú lateral la opción <b>Nora Live 🔴</b>.", bullet_style))

    # Section 3
    story.append(Paragraph("📱 3. Guía de Uso para Movileros y Periodistas de Calle", h2_style))
    story.append(Paragraph("Pestaña 1: 🎤 Cobertura & Redacción en Vivo", h3_style))
    story.append(Paragraph("• <b>Enviar por Texto:</b> Escribe los datos clave y presiona Enviar.<br/>• <b>Enviar por Foto:</b> Toca 📷 Subir Foto para que Nora analice la escena visualmente.<br/>• <b>Enviar por Grabación de Voz:</b> Toca 🎙️ Grabar Audio para dictar el reporte directo desde la calle.<br/>• <b>Enviar por Archivo de Audio:</b> Toca 🎵 Subir Audio para seleccionar audios grabados en el dispositivo (.mp3, .wav, .m4a, .aac, .ogg). Nora los escuchará e integrará.", bullet_style))
    story.append(Paragraph("• <b>Publicación Instantánea:</b> Revisa el borrador en vivo en la columna derecha y presiona el botón rojo <b>¡PUBLICAR EN CADENA 4!</b>.", bullet_style))

    # Section 4
    story.append(Paragraph("🔴 4. Noticieros Rápidos (Flash de Noticias 1 a 5 min)", h2_style))
    story.append(Paragraph("Pestaña 2: 🔴 Flash de Noticias (1-5 min)", h3_style))
    story.append(Paragraph("• <b>Explorar Flashes:</b> Revisa en tiempo real los noticieros rápidos de 1 a 5 minutos emitidos por Nora AI.<br/>• <b>Publicar con 1 Clic:</b> Presiona <i>'¡PUBLICAR ESTE FLASH EN MI DIARIO!'</i> para insertarlo en la portada con el reproductor limpio Nexativa Clean Player.<br/>• <b>Túnel Directo de Video:</b> En la caja <i>'Enviar Video de Cobertura a Estudio Nexativa'</i>, pega enlaces de transmisiones largas para que el equipo edite tu Flash.", bullet_style))

    # Section 5
    story.append(Paragraph("📱 5. Periodismo Ciudadano (Periodista Vecino & Código QR)", h2_style))
    story.append(Paragraph("• <b>Código QR Imprimible:</b> Descarga o imprime el Código QR de Periodismo Ciudadano para afiches o pantallas.<br/>• <b>Reportes del Público:</b> Cualquier vecino en la calle puede escanear el QR y enviar fotos/audios de sucesos en <b>Modo Reporte Ciudadano Anónimo</b>.", bullet_style))

    # Section 6
    story.append(Paragraph("⚖️ 6. Términos Legales & Deslinde de Responsabilidad", h2_style))
    story.append(Paragraph("<b>Aviso Legal (MyJNexoraVisual & Nexativa News):</b> MyJNexoraVisual y Nexativa News actúan únicamente como soporte tecnológico de recepción. Los reportes anónimos enviados por vecinos carecen de presunción de veracidad inmediata y serán sometidos a verificación previa antes de su difusión. El emisor asume la responsabilidad legal por la veracidad del material enviado.", alert_style))

    # Footer banner
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceAfter=8))
    story.append(Paragraph("Desarrollado por <b>MyJNexoraVisual</b> para Nexativa News © Todos los derechos reservados | Licencia Oficial Cadena 4", ParagraphStyle('FooterText', parent=body_style, fontSize=8, alignment=TA_CENTER, textColor=colors.HexColor('#64748B'))))

    doc.build(story)
    print("PDF generado exitosamente en:", pdf_path)

if __name__ == "__main__":
    generate_pdf()
