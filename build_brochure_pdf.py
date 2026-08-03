import os
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle, PageBreak, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

def generate_brochure():
    pdf_path = os.path.join("public", "BROCHURE_COMERCIAL_NEXATIVA_NEWS_2026.pdf")
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Brand Palette
    NAVY_DARK = colors.HexColor('#0F172A')
    EMERALD_BRAND = colors.HexColor('#059669')
    EMERALD_LIGHT = colors.HexColor('#D1FAE5')
    GOLD_ACCENT = colors.HexColor('#D97706')
    TEXT_MAIN = colors.HexColor('#334155')
    BG_CARD = colors.HexColor('#F8FAFC')

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'BrochureTitle',
        parent=styles['Heading1'],
        fontSize=24,
        leading=28,
        textColor=NAVY_DARK,
        alignment=TA_LEFT,
        fontName='Helvetica-Bold',
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'BrochureSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        leading=16,
        textColor=EMERALD_BRAND,
        alignment=TA_LEFT,
        fontName='Helvetica-Bold',
        spaceAfter=15
    )

    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=NAVY_DARK,
        fontName='Helvetica-Bold',
        spaceBefore=14,
        spaceAfter=8
    )

    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=TEXT_MAIN,
        alignment=TA_LEFT,
        fontName='Helvetica',
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontSize=9.5,
        leading=13.5,
        textColor=TEXT_MAIN,
        fontName='Helvetica',
        leftIndent=12,
        spaceAfter=4
    )

    card_header_style = ParagraphStyle(
        'CardHeader',
        parent=styles['Normal'],
        fontSize=12,
        leading=15,
        textColor=colors.white,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    )

    story = []

    # PAGE 1: PORTADA Y PRESENTACIÓN EJECUTIVA
    story.append(Paragraph("NEXATIVA NEWS & IA NORA", title_style))
    story.append(Paragraph("Dossier Comercial de Alianzas, Publicidad & Transformación Digital Regional", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=3, color=EMERALD_BRAND, spaceAfter=15))

    # Executive Overview
    story.append(Paragraph("📌 1. La Plataforma de Mayor Impacto y Crecimiento en la Región", h2_style))
    story.append(Paragraph(
        "<b>Nexativa News</b> (<code>nexativanews.com.ar</code>) combina el alcance de un portal de noticias moderno de alta frecuencia con un <b>Marketplace PyME</b>, la guía comercial geolocalizada y el primer motor periodístico impulsado por <b>Inteligencia Artificial (IA Nora)</b>.",
        body_style
    ))
    story.append(Paragraph(
        "Nuestra tecnología <i>Bootstrap Omnipresence</i> garantiza la distribución automática en <b>Google Discover</b>, historias virales de WhatsApp, Instagram y X, alcanzando a miles de ciudadanos diarios con <b>alto nivel de atención y conversión comercial</b>.",
        body_style
    ))

    story.append(Spacer(1, 10))

    # Metric Highlights Table
    metric_data = [
        [
            Paragraph("<b>+50.000</b><br/><font size=8 textcolor='#475569'>Lectores Mensuales</font>", ParagraphStyle('M1', parent=body_style, alignment=TA_CENTER)),
            Paragraph("<b>< 14 min</b><br/><font size=8 textcolor='#475569'>Resp. Comercial Nora IA</font>", ParagraphStyle('M2', parent=body_style, alignment=TA_CENTER)),
            Paragraph("<b>⭐ 98.4%</b><br/><font size=8 textcolor='#475569'>Conformidad NoraScore™</font>", ParagraphStyle('M3', parent=body_style, alignment=TA_CENTER)),
            Paragraph("<b>100% Organico</b><br/><font size=8 textcolor='#475569'>Alcance en Celulares</font>", ParagraphStyle('M4', parent=body_style, alignment=TA_CENTER))
        ]
    ]
    t_metrics = Table(metric_data, colWidths=[125, 125, 125, 125])
    t_metrics.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_CARD),
        ('BOX', (0,0), (-1,-1), 1, EMERALD_BRAND),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_metrics)

    story.append(Spacer(1, 15))

    # PAGE 1 - SECTION 2: SOLUCIONES PARA COMERCIOS Y EMPRESAS
    story.append(Paragraph("🛠️ 2. Propuestas de Valor Comercial para Marcas y Comercios", h2_style))

    plan_table_data = [
        [
            Paragraph("<b>MODALIDAD / ESPACIO</b>", ParagraphStyle('H1', parent=body_style, fontName='Helvetica-Bold', textColor=NAVY_DARK)),
            Paragraph("<b>BENEFICIOS EXCLUSIVOS</b>", ParagraphStyle('H2', parent=body_style, fontName='Helvetica-Bold', textColor=NAVY_DARK)),
            Paragraph("<b>IMPACTO DE MARCA</b>", ParagraphStyle('H3', parent=body_style, fontName='Helvetica-Bold', textColor=NAVY_DARK))
        ],
        [
            Paragraph("<b>1. Sponsor ORO Nexativa</b>", body_style),
            Paragraph("Banner Principal en Portada + Presencia en Noticias Destacadas + Espacio en Noticieros Flash.", bullet_style),
            Paragraph("<font color='#059669'><b>Máxima Visibilidad</b></font>", body_style)
        ],
        [
            Paragraph("<b>2. Guía Comercial & NoraScore™</b>", body_style),
            Paragraph("Ficha destacada en Páginas Amarillas 2.0 + Sello de Confianza 'Nora Verified' + Botón WhatsApp.", bullet_style),
            Paragraph("<font color='#059669'><b>Leads Directos</b></font>", body_style)
        ],
        [
            Paragraph("<b>3. Nora Pro Agent (Atención IA)</b>", body_style),
            Paragraph("Agente de IA exclusivo para tu negocio que atiende consultas y califica prospectos 24/7.", bullet_style),
            Paragraph("<font color='#059669'><b>Automatización 24/7</b></font>", body_style)
        ],
        [
            Paragraph("<b>4. Certificados de Excelencia</b>", body_style),
            Paragraph("Acreditación física imprimible en A4 con QR de validación en vivo para colocar en tu local.", bullet_style),
            Paragraph("<font color='#D97706'><b>Prestigio Local</b></font>", body_style)
        ]
    ]

    t_plans = Table(plan_table_data, colWidths=[140, 240, 120])
    t_plans.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), EMERALD_LIGHT),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_plans)

    story.append(Spacer(1, 20))

    # PAGE BREAK FOR BACK COVER / CONTACT
    story.append(PageBreak())

    # PAGE 2: TECNOLOGÍA NORA IA Y CONTACTO DIRECTO
    story.append(Paragraph("🤖 3. Nora IA: La Ventaja Tecnológica Exclusiva", h2_style))
    story.append(Paragraph(
        "A diferencia de los medios tradicionales, Nexativa News cuenta con **Nora**, la Inteligencia Artificial periodística y comercial desarrollada por <b>MyJNexoraVisual</b>. Nora no solo publica contenido, sino que interactúa con la audiencia, recomienda comercios locales y pre-califica a los mejores prestadores de servicios de la región.",
        body_style
    ))

    story.append(Paragraph("<b>Atributos Exclusivos de Nora:</b>", h2_style))
    story.append(Paragraph("• <b>Respuestas Instantáneas:</b> Bajamos el tiempo de espera del cliente a menos de 14 minutos.", bullet_style))
    story.append(Paragraph("• <b>NoraScore™ Comunitario:</b> Sistema anti-spam que valida calificaciones de clientes reales vía WhatsApp.", bullet_style))
    story.append(Paragraph("• <b>Omnipresencia en Redes:</b> Transformación de noticias y promociones en formatos virales para WhatsApp, Instagram Stories, X y TikTok.", bullet_style))

    story.append(Spacer(1, 20))

    # Contact Box & Call to Action
    contact_data = [
        [
            Paragraph("<b>💼 DIRECCIÓN COMERCIAL & ALIANZAS STRATEGICAS</b>", card_header_style)
        ],
        [
            Paragraph(
                "<br/><b>Portal Oficial:</b> <code>https://www.nexativanews.com.ar</code><br/>"
                "<b>WhatsApp Comercial:</b> +54 9 3786 40-1122<br/>"
                "<b>Mail de Alianzas:</b> <code>contacto@nexativanews.com.ar</code><br/>"
                "<b>Sede Central:</b> Ituzaingó, Corrientes, Argentina<br/><br/>"
                "<i>Agendá una reunión con nuestro equipo y sumá tu marca a la red regional de mayor crecimiento.</i><br/>",
                ParagraphStyle('CBody', parent=body_style, alignment=TA_CENTER)
            )
        ]
    ]

    t_contact = Table(contact_data, colWidths=[500])
    t_contact.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY_DARK),
        ('BACKGROUND', (0,1), (-1,1), BG_CARD),
        ('BOX', (0,0), (-1,-1), 1.5, NAVY_DARK),
        ('PADDING', (0,0), (-1,-1), 12),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    story.append(t_contact)

    # Footer
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceAfter=8))
    story.append(Paragraph(
        "Nexativa News © 2026 | Impulsado por MyJNexoraVisual & IA Nora | Todos los derechos reservados",
        ParagraphStyle('FooterText', parent=body_style, fontSize=8, alignment=TA_CENTER, textColor=colors.HexColor('#64748B'))
    ))

    doc.build(story)
    print("Brochure Comercial PDF generado exitosamente en:", pdf_path)

if __name__ == "__main__":
    generate_brochure()
