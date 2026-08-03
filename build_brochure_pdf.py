import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle, PageBreak, Image as RLImage
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT

def generate_brochure():
    pdf_path = os.path.join("public", "BROCHURE_COMERCIAL_NEXATIVA_NEWS_2026.pdf")
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=25,
        bottomMargin=25
    )

    styles = getSampleStyleSheet()

    # Brand Colors
    NAVY_DARK = colors.HexColor('#0F172A')
    EMERALD_PRIMARY = colors.HexColor('#047857')
    EMERALD_BG = colors.HexColor('#F0FDF4')
    GOLD_ACCENT = colors.HexColor('#D97706')
    TEXT_DARK = colors.HexColor('#1E293B')
    TEXT_MUTED = colors.HexColor('#475569')
    BORDER_COLOR = colors.HexColor('#E2E8F0')
    BG_CARD = colors.HexColor('#F8FAFC')

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=23,
        textColor=NAVY_DARK,
        fontName='Helvetica-Bold',
        spaceAfter=2
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=9.5,
        leading=13,
        textColor=EMERALD_PRIMARY,
        fontName='Helvetica-Bold',
        spaceAfter=8
    )

    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontSize=11.5,
        leading=15,
        textColor=NAVY_DARK,
        fontName='Helvetica-Bold',
        spaceBefore=8,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=11.5,
        textColor=TEXT_DARK,
        alignment=TA_LEFT,
        fontName='Helvetica',
        spaceAfter=4
    )

    body_justify = ParagraphStyle(
        'BodyJustify',
        parent=body_style,
        alignment=TA_JUSTIFY
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontSize=8,
        leading=11,
        textColor=TEXT_MUTED,
        fontName='Helvetica',
        leftIndent=8,
        spaceAfter=3
    )

    caption_style = ParagraphStyle(
        'CaptionStyle',
        parent=styles['Normal'],
        fontSize=7.5,
        leading=10,
        textColor=TEXT_MUTED,
        alignment=TA_CENTER,
        fontName='Helvetica-Oblique'
    )

    story = []

    # =========================================================================
    # PAGE 1: DOSSIER DE IMPRESIÓN EDITORIAL (PORTADA COMPLETA 100% LLENA)
    # =========================================================================

    # Header Banner Table
    header_data = [
        [
            Paragraph("<b>NEXATIVA NEWS & IA NORA</b>", title_style),
            Paragraph("<b>EDICIÓN COMERCIAL 2026</b><br/><font size=7 color='#047857'>Página 1 de 2</font>", ParagraphStyle('HRight', parent=styles['Normal'], alignment=TA_RIGHT, fontName='Helvetica-Bold', leading=10))
        ]
    ]
    t_header = Table(header_data, colWidths=[380, 155])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_header)
    story.append(Paragraph("Plataforma Periodística, Marketplace PyME y Ecosistema de Inteligencia Artificial Regional", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=EMERALD_PRIMARY, spaceAfter=8))

    # Declaración de Manifiesto
    story.append(Paragraph("🌱 Manifiesto Institucional: Tecnología con Propósito Humano y Desarrollo Social", h2_style))
    story.append(Paragraph(
        "En un entorno mediático saturado de contenido automatizado distante, <b>Nexativa News</b> (<code>nexativanews.com.ar</code>) se consolidó como el motor digital y comunitario de mayor impacto en la región. Nuestra misión es poner la tecnología más avanzada al servicio del <b>desarrollo humano integral</b>: conectamos trabajadores independientes con vecinos que necesitan sus servicios, democratizamos la visibilidad para las PyMEs locales y garantizamos periodismo veraz sin intermediarios a más de 50.000 lectores mensuales.",
        body_justify
    ))

    story.append(Spacer(1, 4))

    # Indicadores de Crecimiento (4 Bloques)
    metric_data = [
        [
            Paragraph("<b>+50.000</b><br/><font size=7 color='#475569'>Lectores Mensuales</font>", ParagraphStyle('M1', parent=body_style, alignment=TA_CENTER)),
            Paragraph("<b>< 14 MIN</b><br/><font size=7 color='#475569'>Resp. Nora IA</font>", ParagraphStyle('M2', parent=body_style, alignment=TA_CENTER)),
            Paragraph("<b>⭐ 98.4%</b><br/><font size=7 color='#475569'>Conformidad NoraScore™</font>", ParagraphStyle('M3', parent=body_style, alignment=TA_CENTER)),
            Paragraph("<b>100% ORGÁNICO</b><br/><font size=7 color='#475569'>Alcance en Celulares</font>", ParagraphStyle('M4', parent=body_style, alignment=TA_CENTER))
        ]
    ]
    t_metrics = Table(metric_data, colWidths=[133, 134, 134, 134])
    t_metrics.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), EMERALD_BG),
        ('BOX', (0,0), (-1,-1), 1, EMERALD_PRIMARY),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_metrics)

    story.append(Spacer(1, 8))

    # Tríptico de Pilares Fundamentales
    pilares_data = [
        [
            Paragraph("<b>🛠️ 1. Trabajo & Dignidad</b>", h2_style),
            Paragraph("<b>🏢 2. Comercio Local</b>", h2_style),
            Paragraph("<b>🎤 3. Periodismo Real</b>", h2_style)
        ],
        [
            Paragraph("Permitimos a plomeros, electricistas y artesanos publicar su oficio 100% gratis. Reciben reseñas comunitarias verificadas y su Certificado Oficial A4 para enmarcar.", body_style),
            Paragraph("Las PyMEs y comercios se integran a la Guía Comercial 2.0 y cuentan con la IA Nora respondiendo consultas de clientes en menos de 14 minutos vía WhatsApp.", body_style),
            Paragraph("Nuestros corresponsales y vecinos reportan los hechos en vivo desde la calle. Noticias de impacto positivo que impulsan la cultura y la economía de Corrientes.", body_style)
        ]
    ]
    t_pilares = Table(pilares_data, colWidths=[175, 180, 180])
    t_pilares.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_pilares)

    story.append(Spacer(1, 6))

    # Galería Fotográfica de Impacto Real (3 Fotografías Completas)
    story.append(Paragraph("📸 Galería de Historias Reales de Nuestra Comunidad", h2_style))

    img_tradesman_path = os.path.join("public", "images", "brochure_tradesman.png")
    img_merchant_path = os.path.join("public", "images", "brochure_merchant.png")
    img_journalist_path = os.path.join("public", "images", "brochure_journalist.png")

    if os.path.exists(img_tradesman_path) and os.path.exists(img_merchant_path) and os.path.exists(img_journalist_path):
        img_t = RLImage(img_tradesman_path, width=170, height=115)
        img_m = RLImage(img_merchant_path, width=170, height=115)
        img_j = RLImage(img_journalist_path, width=170, height=115)

        img_table_data = [
            [img_t, img_m, img_j],
            [
                Paragraph("<b>Don Pedro (Plomero):</b> Orgulloso con su Certificado de Excelencia A4 en su taller.", caption_style),
                Paragraph("<b>Comercio de Barrio:</b> Atención cercana y directa con clientes vía WhatsApp.", caption_style),
                Paragraph("<b>Movileros en Vivo:</b> Cobertura transparente desde las calles de Corrientes.", caption_style)
            ]
        ]
        t_imgs = Table(img_table_data, colWidths=[175, 180, 180])
        t_imgs.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('PADDING', (0,0), (-1,-1), 2),
        ]))
        story.append(t_imgs)

    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=2))
    story.append(Paragraph("Nexativa News © 2026 | Dossier Comercial Oficial - Continúa en Página 2", ParagraphStyle('F1', parent=caption_style, alignment=TA_CENTER)))

    # PAGE BREAK PERFECTO
    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: PROPUESTAS COMERCIALES, TECNOLOGÍA NORA Y CONTACTO (COMPLETA)
    # =========================================================================

    header_data2 = [
        [
            Paragraph("<b>SOLUCIONES DE PATROCINIO & ALIANZAS</b>", title_style),
            Paragraph("<b>DOSSIER COMERCIAL 2026</b><br/><font size=7 color='#047857'>Página 2 de 2</font>", ParagraphStyle('HRight2', parent=styles['Normal'], alignment=TA_RIGHT, fontName='Helvetica-Bold', leading=10))
        ]
    ]
    t_header2 = Table(header_data2, colWidths=[380, 155])
    t_header2.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_header2)
    story.append(Paragraph("Estrategia Omnipresente: Google Discover, Redes Sociales e Inteligencia Artificial", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=EMERALD_PRIMARY, spaceAfter=8))

    # Sección: Tecnología Nora IA & Ingenieria de Tráfico
    story.append(Paragraph("🤖 4. La Ventaja Tecnológica: Motor Nora IA & Distribución Omnipresente", h2_style))
    story.append(Paragraph(
        "A diferencia de los medios tradicionales, Nexativa News cuenta con **Nora**, la Inteligencia Artificial periodística desarrollada por <b>MyJNexoraVisual</b>. Cuando tu marca o negocio se anuncia en Nexativa, nuestro algoritmo no se limita a mostrar un aviso estático; activa una red de distribución inteligente:",
        body_justify
    ))
    story.append(Paragraph("• <b>Google Discover Optimization:</b> Noticias e imágenes de marcas optimizadas para aparecer gratis en el feed principal de celulares Android e iOS.", bullet_style))
    story.append(Paragraph("• <b>Inyección en Estados de WhatsApp e IG Stories:</b> Nora genera gráficos dinámicos de encuestas en formato 9:16 vertical de alta curiosidad.", bullet_style))
    story.append(Paragraph("• <b>NoraScore™ Anti-Spam:</b> Sistema de verificación de opiniones reales por WhatsApp que construye prestigio legítimo para los comercios participantes.", bullet_style))

    story.append(Spacer(1, 6))

    # Matriz Completa de Soluciones Comerciales (Tabla Ropa De Borde a Borde)
    story.append(Paragraph("💼 5. Matriz de Propuestas de Auspicio y Servicios para Empresas", h2_style))

    plan_table_data = [
        [
            Paragraph("<b>MODALIDAD DE PAUTA</b>", ParagraphStyle('H1', parent=body_style, fontName='Helvetica-Bold', textColor=NAVY_DARK)),
            Paragraph("<b>VALOR EXCLUSIVO PARA TU MARCA</b>", ParagraphStyle('H2', parent=body_style, fontName='Helvetica-Bold', textColor=NAVY_DARK)),
            Paragraph("<b>RETORNO E IMPACTO</b>", ParagraphStyle('H3', parent=body_style, fontName='Helvetica-Bold', textColor=NAVY_DARK))
        ],
        [
            Paragraph("<b>1. Sponsor ORO Nexativa</b>", body_style),
            Paragraph("Banner Principal Header + Mención en Noticieros Flash + Coberturas de Prensa Exclusivas.", bullet_style),
            Paragraph("<font color='#047857'><b>Visibilidad Masiva 24/7</b></font>", body_style)
        ],
        [
            Paragraph("<b>2. Guía Comercial 2.0</b>", body_style),
            Paragraph("Ficha destacada en Páginas Amarillas + Sello 'Nora Verified' + Enlace directo a tu WhatsApp.", bullet_style),
            Paragraph("<font color='#047857'><b>Leads Directos a Venta</b></font>", body_style)
        ],
        [
            Paragraph("<b>3. Nora Pro Agent (Empresas)</b>", body_style),
            Paragraph("Asistente de IA dedicado que atiende a tus clientes en menos de 14 minutos las 24 horas del día.", bullet_style),
            Paragraph("<font color='#047857'><b>Automatización 24/7</b></font>", body_style)
        ],
        [
            Paragraph("<b>4. Certificados de Excelencia</b>", body_style),
            Paragraph("Patrocinio de la acreditación enmarcable A4 otorgada a los mejores trabajadores de la zona.", bullet_style),
            Paragraph("<font color='#D97706'><b>Prestigio RSE Local</b></font>", body_style)
        ],
        [
            Paragraph("<b>5. Búsquedas Laborales PyME</b>", body_style),
            Paragraph("Publicación destacada de solicitudes de empleo con recepción de candidaturas directas.", bullet_style),
            Paragraph("<font color='#047857'><b>Reclutamiento Rápido</b></font>", body_style)
        ]
    ]

    t_plans = Table(plan_table_data, colWidths=[140, 260, 135])
    t_plans.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), EMERALD_BG),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_plans)

    story.append(Spacer(1, 8))

    # Preguntas Frecuentes / FAQ Corto
    story.append(Paragraph("❓ Preguntas Frecuentes para Auspiciantes", h2_style))
    story.append(Paragraph("<b>• ¿Cómo recibo los contactos de clientes?</b> Llegan directamente a tu celular de WhatsApp sin intermediarios ni comisiones de terceros.", bullet_style))
    story.append(Paragraph("<b>• ¿Puedo cambiar mis promociones durante el mes?</b> Sí, el equipo comercial y Nora actualizan tus avisos en tiempo real.", bullet_style))

    story.append(Spacer(1, 8))

    # Caja Oficial de Contacto Directo (Con los dos números de teléfono correctos)
    contact_data = [
        [
            Paragraph("<b>🤝 CONTACTO DIRECTO & ALIANZAS COMERCIALES REGIONALES</b>", ParagraphStyle('CH', parent=body_style, textColor=colors.white, fontName='Helvetica-Bold', alignment=TA_CENTER))
        ],
        [
            Paragraph(
                "<br/>"
                "<b>📱 WhatsApp Comercial (Atención Anunciantes):</b> +54 9 3786 61-1250<br/>"
                "<b>⚙️ MyJNexoraVisual (Soporte Técnico & IA Nora):</b> +54 9 3786 41-4533<br/>"
                "<b>🌐 Portal Oficial:</b> <code>https://www.nexativanews.com.ar</code> | <b>Sede:</b> Ituzaingó, Corrientes, Argentina<br/><br/>"
                "<i>Agendá una reunión presencial con nuestro equipo y sumá tu marca a la red regional de mayor crecimiento.</i><br/>",
                ParagraphStyle('CBody', parent=body_style, alignment=TA_CENTER)
            )
        ]
    ]

    t_contact = Table(contact_data, colWidths=[535])
    t_contact.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY_DARK),
        ('BACKGROUND', (0,1), (-1,1), BG_CARD),
        ('BOX', (0,0), (-1,-1), 1.5, NAVY_DARK),
        ('PADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    story.append(t_contact)

    # Footer Final
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=4))
    story.append(Paragraph(
        "Nexativa News © 2026 | Tecnología con Propósito Humano por MyJNexoraVisual & IA Nora Engine | Todos los derechos reservados",
        ParagraphStyle('FooterText', parent=caption_style, alignment=TA_CENTER)
    ))

    doc.build(story)
    print("Brochure Comercial PDF perfeccionado de 2 Páginas Generado en:", pdf_path)

if __name__ == "__main__":
    generate_brochure()
