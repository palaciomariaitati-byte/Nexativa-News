/**
 * Servicio de Notificaciones de WhatsApp para Nexativa News
 * Destino Principal: +54 3786 611250 (Nexativa News Redacción)
 */

interface WhatsAppReportPayload {
  reportId?: string;
  senderName: string;
  senderType: "corresponsal" | "ciudadano";
  location?: string;
  excerpt: string;
  mediaUrls?: string[];
  stagingUrl?: string;
}

export async function sendWhatsAppNotification(payload: WhatsAppReportPayload): Promise<{ success: boolean; message: string; waLink?: string }> {
  const targetPhone = process.env.WHATSAPP_ALERT_PHONE || "5493786611250";
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nexativanews.digital";
  const adminUrl = `${baseUrl}/admin/news/live`;

  const emojiType = payload.senderType === "corresponsal" ? "🎤 *CORRESPONSA MÓVIL*" : "🟢 *REPORTE CIUDADANO*";
  
  const textMessage = `🚨 *NUEVA COBERTURA EN ENTRADA* 🚨
━━━━━━━━━━━━━━━━━━━━
${emojiType}: ${payload.senderName}
📍 *Ubicación:* ${payload.location || "Ituzaingó / Corrientes"}
⏰ *Recibido:* ${new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} hs

📝 *Extracto del Reporte:*
"${payload.excerpt.length > 250 ? payload.excerpt.substring(0, 250) + "..." : payload.excerpt}"

${payload.mediaUrls && payload.mediaUrls.length > 0 ? `📷 *Multimedia:* ${payload.mediaUrls.length} archivo(s) adjunto(s)` : ""}

👉 *Procesar Noticia en el Panel:*
${adminUrl}
━━━━━━━━━━━━━━━━━━━━`;

  const encodedText = encodeURIComponent(textMessage);
  const waLink = `https://wa.me/${targetPhone}?text=${encodedText}`;

  console.log(`[WhatsApp Service] Preparando envío de alerta a +${targetPhone}`);
  console.log(textMessage);

  try {
    // 1. Si existe una API de Callmebot configurada (Gratuita)
    const callmebotApiKey = process.env.CALLMEBOT_API_KEY;
    if (callmebotApiKey) {
      const callmebotUrl = `https://api.callmebot.com/whatsapp.php?phone=+${targetPhone}&text=${encodedText}&apikey=${callmebotApiKey}`;
      const res = await fetch(callmebotUrl);
      if (res.ok) {
        console.log("[WhatsApp Service] ✅ Notificación enviada exitosamente vía Callmebot API.");
        return { success: true, message: "Enviado vía WhatsApp API", waLink };
      }
    }

    // 2. Si existe un Webhook genérico de WhatsApp (UltraMsg / Evolution / GreenAPI / Meta)
    const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: targetPhone,
          message: textMessage,
          link: waLink,
          data: payload
        })
      });
      if (res.ok) {
        console.log("[WhatsApp Service] ✅ Notificación enviada vía Webhook de WhatsApp.");
        return { success: true, message: "Enviado vía Webhook", waLink };
      }
    }

    console.log("[WhatsApp Service] ℹ️ Enlace asistido de WhatsApp listo:", waLink);
    return { success: true, message: "Enlace de WhatsApp generado correctamente", waLink };

  } catch (err: any) {
    console.error("[WhatsApp Service] Error en envío de WhatsApp:", err.message);
    return { success: false, message: err.message, waLink };
  }
}
