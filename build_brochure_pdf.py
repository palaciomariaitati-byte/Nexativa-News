import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle, PageBreak, Image as RLImage
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

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

    # Palette
    NAVY_DARK = colors.HexColor('#0F172A')
    EMERALD_BRAND = colors.HexColor('#047857')
    EMERALD_LIGHT = colors.HexColor('#D1FAE5')
    TEXT_MAIN = colors.HexColor('#334155')
    BG_CARD = colors.HexColor('#F8FAFC')

    title_style = ParagraphStyle(
        'BrochureTitle',
        parent=styles['Heading1'],
        fontSize=22,
        leading=26,
        textColor=NAVY_DARK,
        alignment=TA_LEFT,
        fontName='Helvetica-Bold',
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'BrochureSubtitle',
        parent=styles['Normal'],
        fontSize=11,
        leading=15,
        textColor=EMERALD_BRAND,
        alignment=TA_LEFT,
        fontName='Helvetica-Bold',
        spaceAfter=15
    )

    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontSize=13,
        leading=17,
        textColor=NAVY_DARK,
        fontName='Helvetica-Bold',
        spaceBefore=12,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontSize=9.5,
        leading=13.5,
        textColor=TEXT_MAIN,
        alignment=TA_LEFT,
        fontName='Helvetica',
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=TEXT_MAIN,
        fontName='Helvetica',
        leftIndent=10,
        spaceAfter=4
    )

    story = []

    # PAGE 1: PORTADA Y DECLARACIÓN DE PROPÓSITO HUMANO
    story.append(Paragraph("NEXATIVA NEWS & IA NORA", title_style))
    story.append(Paragraph("Dossier de Impacto Social, Desarrollo Humano & Alianzas Comerciales", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=3, color=EMERALD_BRAND, spaceAfter=12))

    story.append(Paragraph("🌱 Tecnología al Servicio de Nuestra Gente y el Comercio Local", h2_style))
    story.append(Paragraph(
        "En un escenario saturado de tecnologías frías y contenido artificial sin alma, <b>Nexativa News</b> (<code>nexativanews.com.ar</code>) fue concebido con una misión humana clara: poner la innovación al servicio del <b>desarrollo comunitario de la región</b>.",
        body_style
    ))
    story.append(Paragraph(
        "Conectamos de forma directa a trabajadores independientes (plomeros, electricistas, costureras) con familias que necesitan sus servicios sin comisiones. Impulsamos a los comercios de barrio y llevamos la información sin intermediarios a más de 50.000 ciudadanos mensuales.",
        body_style
    ))

    story.append(Spacer(1, 10))

    # Metric Highlights Table
    metric_data = [
        [
            Paragraph("<b>+50.000</b><br/><font size=7.5 textcolor='#475569'>Lectores Mensuales</font>", ParagraphStyle('M1', parent=body_style, alignment=TA_CENTER)),
            Paragraph("<b>< 14 min</b><br/><font size=7.5 textcolor='#475569'>Resp. Comercial Nora IA</font>", ParagraphStyle('M2', parent=body_style, alignment=TA_CENTER)),
            Paragraph("<b>⭐ 98.4%</b><br/><font size=7.5 textcolor='#475569'>Conformidad NoraScore™</font>", ParagraphStyle('M3', parent=body_style, alignment=TA_CENTER)),
            Paragraph("<b>100% Organico</b><br/><font size=7.5 textcolor='#475569'>Alcance en Celulares</font>", ParagraphStyle('M4', parent=body_style, alignment=TA_CENTER))
        ]
    ]
    t_metrics = Table(metric_data, colWidths=[125, 125, 125, 125])
    t_metrics.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_CARD),
        ('BOX', (0,0), (-1,-1), 1, EMERALD_BRAND),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_metrics)

    story.append(Spacer(1, 12))

    # Incorporar Imágenes Fotográficas
    img_tradesman_path = os.path.join("public", "images", "brochure_tradesman.png")
    img_merchant_path = os.path.join("public", "images", "brochure_merchant.png")
    img_journalist_path = os.path.join("public", "images", "brochure_journalist.png")

    if os.path.exists(img_tradesman_path) and os.path.exists(img_merchant_path):
        img_t = RLImage(img_tradesman_path, width=235, height=130)
        img_m = RLImage(img_merchant_path, width=235, height=130)

        img_table_data = [
            [img_t, img_m],
            [
                Paragraph("<b>Trabajo & Dignidad:</b> Oficios verificados y certificados para trabajadores locales.", ParagraphStyle('Cap1', parent=body_style, fontSize=8.5, alignment=TA_CENTER)),
                Paragraph("<b>Comercio Local:</b> Conexión directa entre comercios y vecinos vía WhatsApp.", ParagraphStyle('Cap2', parent=body_style, fontSize=8.5, alignment=TA_CENTER))
            ]
        ]
        t_imgs = Table(img_table_data, colWidths=[245, 245])
        t_imgs.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_imgs)

    story.append(PageBreak())

    # PAGE 2: SOLUCIONES COMERCIALES Y CONTACTO CON TELÉFONO OFICIAL
    story.append(Paragraph("💼 Propuestas de Integración & Alianzas Comerciales", h2_style))

    plan_table_data = [
        [
            Paragraph("<b>MODALIDAD DE PAUTA</b>", ParagraphStyle('H1', parent=body_style, fontName='Helvetica-Bold', textColor=NAVY_DARK)),
            Paragraph("<b>VALOR PARA TU EMPRESA</b>", ParagraphStyle('H2', parent=body_style, fontName='Helvetica-Bold', textColor=NAVY_DARK)),
            Paragraph("<b>IMPACTO COMUNITARIO</b>", ParagraphStyle('H3', parent=body_style, fontName='Helvetica-Bold', textColor=NAVY_DARK))
        ],
        [
            Paragraph("<b>1. Sponsor ORO Nexativa</b>", body_style),
            Paragraph("Banner Principal Header + Presencia en Noticias Top + Mención en Noticiero Flash.", bullet_style),
            Paragraph("<font color='#047857'><b>Visibilidad 24/7</b></font>", body_style)
        ],
        [
            Paragraph("<b>2. Guía Comercial & NoraScore™</b>", body_style),
            Paragraph("Ficha destacada en Páginas Amarillas 2.0 + Sello 'Nora Verified' + Botón WhatsApp Directo.", bullet_style),
            Paragraph("<font color='#047857'><b>Leads Directos</b></font>", body_style)
        ],
        [
            Paragraph("<b>3. Nora Pro Agent (Empresas)</b>", body_style),
            Paragraph("Agente de IA dedicado que atiende a tus clientes en menos de 14 minutos.", bullet_style),
            Paragraph("<font color='#047857'><b>Atención 24/7</b></font>", body_style)
        ],
        [
            Paragraph("<b>4. Certificados de Excelencia</b>", body_style),
            Paragraph("Patrocinio de la acreditación enmarcable para trabajadores destacados de la comunidad.", bullet_style),
            Paragraph("<font color='#D97706'><b>Prestigio Social</b></font>", body_style)
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

    # Contact Box con el número real del cliente
    contact_data = [
        [
            Paragraph("<b>🤝 DIRECCIÓN COMERCIAL & ALIANZAS REGIONALES</b>", ParagraphStyle('CH', parent=body_style, textColor=colors.white, fontName='Helvetica-Bold', alignment=TA_CENTER))
        ],
        [
            Paragraph(
                "<br/><b>Portal Oficial:</b> <code>https://www.nexativanews.com.ar</code><br/>"
                "<b>WhatsApp Comercial:</b> +54 9 3786 41-4533<br/>"
                "<b>Mail de Alianzas:</b> <code>contacto@nexativanews.com.ar</code><br/>"
                "<b>Sede Central:</b> Ituzaingó, Corrientes, Argentina<br/><br/>"
                "<i>Agendá una reunión presencial con nuestro equipo para sumar tu marca a la red regional de mayor crecimiento.</i><br/>",
                ParagraphStyle('CBody', parent=body_style, alignment=TA_CENTER)
            )
        ]
    ]

    t_contact = Table(contact_data, colWidths=[490])
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
        "Nexativa News © 2026 | Tecnología con Propósito Humano por MyJNexoraVisual & IA Nora Engine",
        ParagraphStyle('FooterText', parent=body_style, fontSize=8, alignment=TA_CENTER, textColor=colors.HexColor('#64748B'))
    ))

    doc.build(story)
    print("Brochure Comercial PDF actualizado con éxito en:", pdf_path)

if __name__ == "__main__":
    generate_brochure()
