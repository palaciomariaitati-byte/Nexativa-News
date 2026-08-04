import nodemailer from 'nodemailer';

/**
 * Servicio de envío de correos profesionales para Nexativa News
 * Configurado mediante variables de entorno en .env.local (SMTP de Brevo / Resend / Mailgun / Google)
 */
interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendProfessionalEmail(payload: SendEmailPayload): Promise<{ success: boolean; message: string }> {
  const smtpHost = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER || '';
  const smtpPass = process.env.SMTP_PASS || '';
  const fromEmail = process.env.EMAIL_FROM || 'prensa@nexativanews.com.ar';

  console.log(`[Email Service] Preparando envío de correo a: ${payload.to} desde: ${fromEmail}`);

  if (!smtpUser || !smtpPass) {
    console.warn('[Email Service] Advertencia: Faltan credenciales SMTP (SMTP_USER / SMTP_PASS). El correo fue simulado en servidor.');
    return {
      success: true,
      message: 'Simulación de envío realizada. Agregá SMTP_USER y SMTP_PASS en .env.local para despacho real.',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const info = await transporter.sendMail({
      from: `"Nexativa News Prensa" <${fromEmail}>`,
      to: payload.to,
      replyTo: payload.replyTo || fromEmail,
      subject: payload.subject,
      html: payload.html,
      text: payload.text || payload.html.replace(/<[^>]*>?/gm, ''),
    });

    console.log('[Email Service] ✅ Correo enviado exitosamente ID:', info.messageId);
    return { success: true, message: `Correo enviado a ${payload.to}` };
  } catch (err: any) {
    console.error('[Email Service] Error al enviar correo:', err.message);
    return { success: false, message: err.message };
  }
}
