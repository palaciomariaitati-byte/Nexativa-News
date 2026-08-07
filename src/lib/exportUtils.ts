/**
 * Módulo de Exportación Institucional e Higiene Tipográfica
 * Ubicación: /src/lib/exportUtils.ts
 * 
 * Limpia la sintaxis markdown cruda (***, ###, ---, etc.) y genera 
 * documentos corporativos descargables en formato Word (.doc) y PDF.
 */

/**
 * Convierte Markdown crudo a HTML limpio sin símbolos visibles de formato
 */
export function formatMarkdownToCleanHtml(markdown: string): string {
  if (!markdown) return "";

  let html = markdown;

  // 1. Reemplazar encabezados H1, H2, H3
  html = html.replace(/^### (.*$)/gim, '<h3 style="color:#4338ca; font-size:16px; font-weight:700; margin-top:16px; margin-bottom:8px;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="color:#312e81; font-size:18px; font-weight:800; margin-top:20px; margin-bottom:10px;">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 style="color:#1e1b4b; font-size:22px; font-weight:900; margin-top:24px; margin-bottom:12px; border-bottom:2px solid #6366f1; padding-bottom:6px;">$1</h1>');

  // 2. Reemplazar negritas **texto** o __texto__
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:700; color:#ffffff;">$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong style="font-weight:700; color:#ffffff;">$1</strong>');

  // 3. Reemplazar cursivas *texto* o _texto_
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // 4. Reemplazar viñetas (- item o * item)
  html = html.replace(/^\s*[\-\*]\s+(.*$)/gim, '<li style="margin-bottom:6px; list-style-type:disc; margin-left:20px;">$1</li>');

  // 5. Reemplazar separadores horizizontales --- o ___
  html = html.replace(/^[\-\*_]{3,}\s*$/gim, '<hr style="border:0; border-top:1px solid #334155; margin:16px 0;" />');

  // 6. Convertir párrafos limpios
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map(p => {
      const trimmed = p.trim();
      if (trimmed.startsWith('<h') || trimmed.startsWith('<li') || trimmed.startsWith('<hr')) {
        return trimmed;
      }
      return `<p style="margin-bottom:12px; line-height:1.6; text-align:justify;">${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('');

  return html;
}

/**
 * Descarga el contenido en formato Microsoft Word (.doc) institucional
 */
export function downloadAsWord(filename: string, title: string, markdownContent: string) {
  const cleanBodyHtml = formatMarkdownToCleanHtml(markdownContent);

  const documentTemplate = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        body {
          font-family: 'Calibri', 'Arial', sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #1e293b;
          margin: 1in;
        }
        .corporate-header {
          border-bottom: 2px solid #4338ca;
          padding-bottom: 8px;
          margin-bottom: 20px;
          font-size: 9pt;
          font-weight: bold;
          color: #4338ca;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        h1 { font-size: 18pt; color: #0f172a; margin-top: 10px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
        h2 { font-size: 14pt; color: #1e1b4b; margin-top: 18px; margin-bottom: 8px; }
        h3 { font-size: 12pt; color: #312e81; margin-top: 14px; margin-bottom: 6px; }
        p { margin-bottom: 10px; text-align: justify; }
        ul { margin-bottom: 10px; padding-left: 20px; }
        li { margin-bottom: 4px; }
        strong { color: #0f172a; font-weight: bold; }
        .corporate-footer {
          margin-top: 40px;
          border-top: 1px solid #cbd5e1;
          padding-top: 10px;
          font-size: 8pt;
          color: #64748b;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="corporate-header">
        NEXATIVA NEWS — INFORME EJECUTIVO INSTITUCIONAL & ESTRATÉGICO
      </div>
      <h1>${title}</h1>
      <div>${cleanBodyHtml}</div>
      <div class="corporate-footer">
        Nexativa News | Ecosistema Periodístico e Inbound de Alta Velocidad (nexativanews.com.ar)<br/>
        Documento confidencial para uso institucional reservado.
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', documentTemplate], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = url;
  downloadAnchor.download = `${filename.toLowerCase().replace(/[^a-z0-9]/g, '_')}_nexativa.doc`;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
  URL.revokeObjectURL(url);
}

/**
 * Abre ventana de impresión profesional/PDF listo para guardar
 */
export function exportToPdf(title: string, markdownContent: string) {
  const cleanBodyHtml = formatMarkdownToCleanHtml(markdownContent);
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - Nexativa News</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            padding: 40px;
            color: #0f172a;
            line-height: 1.6;
          }
          .corporate-header {
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 12px;
            margin-bottom: 24px;
            font-size: 11px;
            font-weight: bold;
            color: #4338ca;
            letter-spacing: 1px;
            display: flex;
            justify-content: space-between;
          }
          h1 { color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; font-size: 20px; }
          h2 { color: #312e81; font-size: 15px; margin-top: 20px; }
          h3 { color: #4338ca; font-size: 13px; margin-top: 15px; }
          p { text-align: justify; margin-bottom: 12px; font-size: 12px; }
          ul { margin-bottom: 12px; padding-left: 20px; }
          li { margin-bottom: 4px; font-size: 12px; }
          strong { font-weight: bold; color: #000; }
          .corporate-footer {
            margin-top: 40px;
            border-top: 1px solid #cbd5e1;
            padding-top: 12px;
            font-size: 9px;
            color: #64748b;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="corporate-header">
          <span>NEXATIVA NEWS — DOCUMENTO EJECUTIVO DE EXPANSIÓN</span>
          <span>${new Date().toLocaleDateString('es-AR')}</span>
        </div>
        <h1>${title}</h1>
        <div>${cleanBodyHtml}</div>
        <div class="corporate-footer">
          Nexativa News | nexativanews.com.ar — Copia Institucional Verificada
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
