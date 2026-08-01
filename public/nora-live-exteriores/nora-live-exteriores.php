<?php
/**
 * Plugin Name: Nora Live Exteriores - Cadena 4 & Nexativa
 * Plugin URI: https://cadena4.com.ar
 * Description: Cobertura periodística en vivo, creador autónomo de Noticieros Flash (1-5 min) y túnel directo a Estudio Nexativa por MyJNexoraVisual.
 * Version: 1.5.0
 * Author: MyJNexoraVisual & Nexativa News
 */

if (!defined('ABSPATH')) exit; // Exit if accessed directly

// Register Admin Menu
add_action('admin_menu', 'nora_live_register_menu');

function nora_live_register_menu() {
    add_menu_page(
        'Nora Live Exteriores',
        'Nora Live 🔴',
        'publish_posts',
        'nora-live-exteriores',
        'nora_live_admin_page',
        'dashicons-microphone',
        6
    );
}

// Register REST API Endpoint for publishing posts into WordPress from Nora Live JS
add_action('rest_api_init', function () {
    register_rest_route('nora-live/v1', '/publish', array(
        'methods' => 'POST',
        'callback' => 'nora_live_handle_publish',
        'permission_callback' => function () {
            return current_user_can('publish_posts');
        }
    ));
});

function nora_live_handle_publish($request) {
    $params = $request->get_json_params();
    $title = sanitize_text_field($params['title'] ?? '🔴 Noticia en Desarrollo');
    $content = wp_kses_post($params['content'] ?? '');
    $excerpt = sanitize_text_field($params['excerpt'] ?? '');
    $image_url = esc_url_raw($params['image_url'] ?? '');

    if (empty($content)) {
        return new WP_Error('empty_content', 'El contenido de la noticia está vacío', array('status' => 400));
    }

    $post_data = array(
        'post_title'    => $title,
        'post_content'  => $content . '<br><br><p><em>Fuente: Cobertura en vivo con Nora Live (Desarrollado por MyJNexoraVisual para Cadena 4 & Nexativa News)</em></p>',
        'post_excerpt'  => $excerpt,
        'post_status'   => 'publish',
        'post_author'   => get_current_user_id(),
        'post_category' => array(1)
    );

    $post_id = wp_insert_post($post_data);

    if (is_wp_error($post_id)) {
        return new WP_Error('insert_failed', $post_id->get_error_message(), array('status' => 500));
    }

    if (!empty($image_url)) {
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');

        $attachment_id = media_sideload_image($image_url, $post_id, $title, 'id');
        if (!is_wp_error($attachment_id)) {
            set_post_thumbnail($post_id, $attachment_id);
        }
    }

    return array(
        'success' => true,
        'post_id' => $post_id,
        'permalink' => get_permalink($post_id)
    );
}

// Render Admin Page
function nora_live_admin_page() {
    $nonce = wp_create_nonce('wp_rest');
    $api_url = 'https://www.nexativanews.com.ar'; // URL oficial de Nexativa News
    ?>
    <div class="wrap">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #e2e8f0; pb-10px; margin-bottom: 15px;">
            <div>
                <h1 style="display:flex; align-items:center; gap:10px; margin-bottom: 5px; margin-top:0;">
                    <span style="color:#e53e3e;">🔴</span> Nora Live Exteriores & Flash Producer
                    <span style="font-size:12px; background:#2563eb; color:#fff; padding:3px 10px; border-radius:12px; font-weight:bold;">Cadena 4 & Nexativa</span>
                </h1>
                <p style="color:#666; font-size:13px; margin-top:0;">Infraestructura Periodística Digital & IA por <strong>MyJNexoraVisual</strong> © Nexativa News. Todos los derechos reservados.</p>
            </div>
        </div>

        <!-- Navigation Tabs -->
        <div style="display:flex; gap:10px; border-bottom:2px solid #cbd5e1; margin-bottom:20px; padding-bottom:10px;">
            <button type="button" id="tabLiveBtn" class="button button-primary" style="font-weight:bold;">🎤 Cobertura & Redacción en Vivo</button>
            <button type="button" id="tabFlashBtn" class="button" style="font-weight:bold; color:#dc2626;">🔴 Flash de Noticias (1-5 min)</button>
        </div>
        
        <style>
            #nora-live-container, #nora-flashes-container {
                display: flex;
                gap: 20px;
                max-width: 1200px;
            }
            @media (max-width: 768px) {
                #nora-live-container, #nora-flashes-container {
                    flex-direction: column;
                }
            }
            .nora-box {
                background: #fff;
                border: 1px solid #ccd0d4;
                border-radius: 12px;
                padding: 20px;
                flex: 1;
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            }
            .nora-chat-messages {
                height: 320px;
                overflow-y: auto;
                border: 1px solid #e2e8f0;
                padding: 12px;
                border-radius: 8px;
                background: #f8fafc;
                margin-bottom: 15px;
            }
            .nora-msg {
                margin-bottom: 12px;
                padding: 10px 14px;
                border-radius: 8px;
                font-size: 14px;
                line-height: 1.5;
                max-width: 88%;
            }
            .nora-msg.user {
                background: #dbeafe;
                margin-left: auto;
                color: #1e40af;
                border: 1px solid #bfdbfe;
            }
            .nora-msg.nora {
                background: #fef3c7;
                color: #92400e;
                border: 1px solid #fde68a;
            }
            .nora-draft-area {
                min-height: 340px;
                border: 1px solid #e2e8f0;
                padding: 15px;
                border-radius: 8px;
                background: #fff;
                font-size: 15px;
                line-height: 1.6;
                outline: none;
            }
            .nora-btn-publish {
                background: #dc2626 !important;
                color: #fff !important;
                border: none !important;
                padding: 10px 20px !important;
                border-radius: 8px !important;
                font-weight: bold !important;
                font-size: 13px !important;
                cursor: pointer;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .nora-btn-publish:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .flash-card {
                border: 1px solid #cbd5e1;
                border-radius: 10px;
                padding: 15px;
                margin-bottom: 15px;
                background: #f8fafc;
            }
            .partner-send-box {
                background: #f0f9ff;
                border: 1px solid #bae6fd;
                border-radius: 10px;
                padding: 15px;
                margin-bottom: 20px;
            }
            .self-clipper-box {
                background: #fef2f2;
                border: 1px solid #fca5a5;
                border-radius: 10px;
                padding: 15px;
                margin-bottom: 20px;
            }
            .clip-select-item {
                background: #fff;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 10px;
                margin-bottom: 8px;
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 10px;
            }
        </style>

        <!-- SECTION 1: LIVE EDITOR -->
        <div id="nora-live-container">
            <!-- Columna Izquierda: Reporte del Movilero -->
            <div class="nora-box">
                <h2 style="margin-top:0; font-size:16px; display:flex; align-items:center; gap:8px;">
                    🎤 Reporte desde la calle (Movil / Corresponsal)
                </h2>
                
                <div class="nora-chat-messages" id="noraChat">
                    <div class="nora-msg nora">
                        <strong>Nora (Redactora Jefa IA):</strong> Hola corresponsal. Envíame lo que esté sucediendo (texto, fotos o audios de voz grabados o subidos desde tu celular) y redactaré la noticia inmediatamente.
                    </div>
                </div>

                <div style="display:flex; gap:10px; margin-bottom:12px;">
                    <input type="text" id="noraInput" placeholder="Escribe el suceso aquí..." style="flex:1; padding:10px; border-radius:6px; border:1px solid #cbd5e1;" />
                    <button type="button" class="button button-primary" id="btnSend" style="padding:0 18px;">Enviar</button>
                          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                    <label class="button" style="display:flex; align-items:center; gap:5px; cursor:pointer;">
                        📷 Subir Foto
                        <input type="file" id="noraImage" accept="image/*" style="display:none;" />
                    </label>
                    <label class="button" style="display:flex; align-items:center; gap:5px; cursor:pointer;">
                        🎵 Subir Audio
                        <input type="file" id="noraAudioFile" accept="audio/*" style="display:none;" />
                    </label>
                    <button type="button" class="button" id="btnAudioRec" style="display:flex; align-items:center; gap:5px;">
                        🎙️ Grabar Audio
                    </button>
                    <label class="button" style="display:flex; align-items:center; gap:5px; cursor:pointer; border-color:#dc2626; color:#dc2626;">
                        📹 Subir Video (60s)
                        <input type="file" id="noraVideoFile" accept="video/*" style="display:none;" />
                    </label>
                    <button type="button" class="button" id="btnVideoRec" style="display:flex; align-items:center; gap:5px; background:#fef2f2; border-color:#fca5a5; color:#b91c1c; font-weight:bold;">
                        🎥 Filmar Video (60s max)
                    </button>
                </div>
            </div>

            <!-- Columna Derecha: Borrador en Vivo y Publicación -->
            <div class="nora-box">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h2 style="margin:0; font-size:16px;">📝 Borrador Noticioso en Vivo</h2>
                    <button type="button" class="nora-btn-publish" id="btnPublish">¡PUBLICAR EN CADENA 4!</button>
                </div>
                
                <div id="noraDraft" class="nora-draft-area" contenteditable="true">
                    <p style="color:#94a3b8; font-style:italic;">El borrador redactado por Nora aparecerá aquí...</p>
                </div>
            </div>
        </div>

        <!-- SECTION 2: FLASH DE NOTICIAS & CREADOR AUTÓNOMO -->
        <div id="nora-flashes-container" style="display:none;">
            <div class="nora-box" style="max-width:100%;">
                
                <!-- CREADOR AUTÓNOMO DE FLASHES (SELF-SERVICE) -->
                <div class="self-clipper-box">
                    <h3 style="margin-top:0; color:#b91c1c; font-size:15px; display:flex; align-items:center; gap:8px;">
                        ⚡ Analizador & Creador Autónomo de Flashes (Hasta 5 Programas)
                    </h3>
                    <p style="font-size:12px; color:#334155; margin-top:0;">Pega las URLs de tus programas o transmisiones del día. Nora IA analizará el contenido, extraerá los mejores clips y te permitirá elegir cuáles combinar en tu propio Flash Noticioso de 1 a 5 minutos.</p>

                    <div style="display:flex; flex-direction:column; gap:10px; margin-top:10px;">
                        <textarea id="selfAnalyzeUrls" rows="3" placeholder="Pega los enlaces de tus programas (hasta 5 links, 1 por línea):&#10;https://www.youtube.com/watch?v=... (Noticiero Mañana)&#10;https://www.youtube.com/watch?v=... (Noticiero Noche)" style="padding:8px 12px; border-radius:6px; border:1px solid #fca5a5; width:100%; font-size:13px; font-family:monospace; resize:vertical;"></textarea>
                        
                        <button type="button" id="btnAnalyzeSelf" class="button button-primary" style="background:#dc2626; border-color:#dc2626; font-weight:bold; align-self:flex-start;">
                            ⚡ Analizar mis Programas con Nora IA
                        </button>
                    </div>

                    <!-- RESULTADOS Y SELECTOR DE CLIPS -->
                    <div id="selfAnalysisResults" style="display:none; margin-top:15px; pt-15px; border-top:1px solid #fca5a5;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <h4 style="margin:0; font-size:14px; color:#991b1b;">Recortes Encontrados por Nora IA:</h4>
                            <span id="selfCumulativeDuration" style="font-weight:bold; color:#d97706; font-size:12px;">Duración: 0m 0s / 5m 0s</span>
                        </div>

                        <div id="selfClipsContainer" style="max-height:300px; overflow-y:auto; margin-bottom:12px;"></div>

                        <div style="display:flex; flex-direction:column; gap:8px;">
                            <input type="text" id="selfFlashTitle" placeholder="Título de tu Flash Noticioso..." style="padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1; width:100%; font-weight:bold; font-size:13px;" />
                            <button type="button" id="btnPublishSelfFlash" class="nora-btn-publish" style="align-self:flex-start;">
                                🚀 PUBLICAR MI NOTICIERO FLASH EN MI DIARIO
                            </button>
                        </div>
                    </div>
                </div>

                <!-- TÚNEL DIRECTO: Enviar a Estudio Nexativa -->
                <div class="partner-send-box">
                    <h3 style="margin-top:0; color:#0369a1; font-size:14px;">
                        📹 O enviar videos a Estudio Nexativa para que los editemos por ti
                    </h3>
                    <div style="display:flex; gap:10px; margin-top:5px;">
                        <input type="text" id="partnerVideoUrl" placeholder="Link de transmisión..." style="padding:6px 10px; border-radius:6px; border:1px solid #93c5fd; flex:1; font-size:12px;" />
                        <button type="button" id="btnSendPartnerVideo" class="button" style="font-size:12px;">Enviar a Estudio</button>
                    </div>
                    <span id="partnerVideoMsg" style="font-size:11px; font-weight:bold; color:#059669; display:none; margin-top:4px;"></span>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h2 style="margin:0; font-size:16px; color:#dc2626;">🔴 Flashes Emitidos & Sindicados</h2>
                    <button type="button" class="button" id="btnReloadFlashes">🔄 Cargar Lista</button>
                </div>

                <div id="flashesList" style="margin-top:15px;">
                    <p style="color:#94a3b8;">Cargando lista de Flashes...</p>
                </div>

                <div style="margin-top:30px; pt-15px; border-top:1px solid #e2e8f0; text-align:center; font-size:11px; color:#94a3b8;">
                    Desarrollado por <strong>MyJNexoraVisual</strong> para Nexativa News © Todos los derechos reservados.
                </div>
            </div>
        </div>

        <script>
        (function() {
            const apiEndpoint = '<?php echo esc_js($api_url); ?>/api/nora-live';
            const flashesApiEndpoint = '<?php echo esc_js($api_url); ?>/api/flashes?limit=10&partner_only=true';
            const postFlashEndpoint = '<?php echo esc_js($api_url); ?>/api/flashes';
            const clipApiEndpoint = '<?php echo esc_js($api_url); ?>/api/nora-clip';
            const partnerVideosEndpoint = '<?php echo esc_js($api_url); ?>/api/partner-videos';
            const wpRestEndpoint = '/wp-json/nora-live/v1/publish';
            const wpNonce = '<?php echo esc_js($nonce); ?>';
            
            let currentDraft = '';
            let isProcessing = false;
            let currentSelfClips = [];
            let selectedSelfClipIds = [];

            // Tab switching logic
            const tabLiveBtn = document.getElementById('tabLiveBtn');
            const tabFlashBtn = document.getElementById('tabFlashBtn');
            const liveContainer = document.getElementById('nora-live-container');
            const flashesContainer = document.getElementById('nora-flashes-container');

            tabLiveBtn.addEventListener('click', function() {
                tabLiveBtn.className = 'button button-primary';
                tabFlashBtn.className = 'button';
                liveContainer.style.display = 'flex';
                flashesContainer.style.display = 'none';
            });

            tabFlashBtn.addEventListener('click', function() {
                tabFlashBtn.className = 'button button-primary';
                tabLiveBtn.className = 'button';
                liveContainer.style.display = 'none';
                flashesContainer.style.display = 'flex';
                loadFlashes();
            });

            // SELF-SERVICE FLASH CREATOR LOGIC
            const btnAnalyzeSelf = document.getElementById('btnAnalyzeSelf');
            const selfAnalyzeUrlsInput = document.getElementById('selfAnalyzeUrls');
            const selfAnalysisResults = document.getElementById('selfAnalysisResults');
            const selfClipsContainer = document.getElementById('selfClipsContainer');
            const selfCumulativeDuration = document.getElementById('selfCumulativeDuration');
            const selfFlashTitleInput = document.getElementById('selfFlashTitle');
            const btnPublishSelfFlash = document.getElementById('btnPublishSelfFlash');

            btnAnalyzeSelf.addEventListener('click', async function() {
                const urlsText = selfAnalyzeUrlsInput.value.trim();
                const urlsList = urlsText.split('\n').map(u => u.trim()).filter(Boolean);

                if (urlsList.length === 0) {
                    alert('Por favor ingresa al menos 1 enlace de video de YouTube.');
                    return;
                }

                btnAnalyzeSelf.disabled = true;
                btnAnalyzeSelf.innerText = '⚡ Nora IA Analizando Programas...';
                selfAnalysisResults.style.display = 'none';

                try {
                    const res = await fetch(clipApiEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            urls: urlsList,
                            videoTitle: 'Programas de Cadena 4'
                        })
                    });
                    const json = await res.json();
                    if (json.success && json.data && json.data.clips) {
                        currentSelfClips = json.data.clips;
                        selectedSelfClipIds = json.data.suggested_news_flash?.clip_ids || currentSelfClips.slice(0, 5).map(c => c.clip_id);
                        selfFlashTitleInput.value = json.data.suggested_news_flash?.title || '🔴 FLASH NOTICIOSO CADENA 4';
                        
                        renderSelfClips();
                        selfAnalysisResults.style.display = 'block';
                    } else {
                        alert('Error en análisis: ' + (json.error || 'Revisa las URLs enviadas.'));
                    }
                } catch(e) {
                    alert('Error de conexión con la IA de Nora.');
                } finally {
                    btnAnalyzeSelf.disabled = false;
                    btnAnalyzeSelf.innerText = '⚡ Analizar mis Programas con Nora IA';
                }
            });

            function renderSelfClips() {
                selfClipsContainer.innerHTML = '';
                let cumulativeSecs = 0;

                currentSelfClips.forEach(clip => {
                    const isChecked = selectedSelfClipIds.includes(clip.clip_id);
                    if (isChecked) cumulativeSecs += clip.duration_seconds;

                    const div = document.createElement('div');
                    div.className = 'clip-select-item';
                    div.innerHTML = `
                        <div style="flex:1;">
                            <span style="font-size:10px; background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px; font-weight:bold; uppercase">${clip.source_title || 'Programa'}</span>
                            <span style="font-size:11px; color:#d97706; font-weight:bold; margin-left:6px;">${clip.start_timestamp} - ${clip.end_timestamp}</span>
                            <h5 style="margin:4px 0 2px 0; font-size:13px;">${clip.title}</h5>
                            <p style="margin:0; font-size:11px; color:#64748b;">${clip.summary}</p>
                        </div>
                        <input type="checkbox" class="chkSelfClip" data-id="${clip.clip_id}" ${isChecked ? 'checked' : ''} style="transform:scale(1.2); cursor:pointer;" />
                    `;
                    selfClipsContainer.appendChild(div);
                });

                const durationMin = Math.floor(cumulativeSecs / 60);
                const durationSec = cumulativeSecs % 60;
                selfCumulativeDuration.innerText = `Duración: ${durationMin}m ${durationSec}s / 5m 0s`;

                document.querySelectorAll('.chkSelfClip').forEach(chk => {
                    chk.addEventListener('change', function() {
                        const id = parseInt(this.getAttribute('data-id'), 10);
                        if (this.checked) {
                            if (!selectedSelfClipIds.includes(id)) selectedSelfClipIds.push(id);
                        } else {
                            selectedSelfClipIds = selectedSelfClipIds.filter(i => i !== id);
                        }
                        renderSelfClips();
                    });
                });
            }

            function getYouTubeId(url) {
                if (!url) return null;
                const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
                return (match && match[2].length === 11) ? match[2] : null;
            }

            btnPublishSelfFlash.addEventListener('click', async function() {
                const selectedClips = currentSelfClips.filter(c => selectedSelfClipIds.includes(c.clip_id));
                if (selectedClips.length === 0) {
                    alert('Selecciona al menos 1 recorte para publicar.');
                    return;
                }

                const title = selfFlashTitleInput.value.trim() || '🔴 FLASH NOTICIOSO CADENA 4';
                const cumulativeSecs = selectedClips.reduce((acc, c) => acc + c.duration_seconds, 0);
                const firstClip = selectedClips[0];

                btnPublishSelfFlash.disabled = true;
                btnPublishSelfFlash.innerText = 'Publicando...';

                try {
                    const primaryUrl = firstClip.video_url || '';
                    const ytId = getYouTubeId(primaryUrl);
                    const embedUrl = ytId
                        ? `https://www.youtube.com/embed/${ytId}?start=${firstClip.start_time_seconds || 0}&end=${firstClip.end_time_seconds || 0}&autoplay=1`
                        : primaryUrl;
                    const summary = selectedClips.map(c => `• [${c.source_title || 'Programa'}] ${c.title}: ${c.summary}`).join('\n');
                    const summaryHtml = selectedClips.map(c => `<p><strong>[${c.source_title || 'Programa'}] ${c.title}:</strong> ${c.summary}</p>`).join('');

                    // 1. Post to Nexativa Flashes API
                    const apiRes = await fetch(postFlashEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: title,
                            summary: summary,
                            duration_seconds: cumulativeSecs,
                            video_url: primaryUrl,
                            embed_url: embedUrl,
                            segments: selectedClips,
                            category: firstClip.category || 'nacional',
                            partner_visible: true,
                            status: 'published'
                        })
                    });

                    // 2. Post to WP Rest Endpoint
                    const content = `<h2>${title}</h2>${summaryHtml}<br><iframe width="100%" height="450" src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`;
                    const wpRes = await fetch(wpRestEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-WP-Nonce': wpNonce
                        },
                        body: JSON.stringify({
                            title: title,
                            content: content,
                            excerpt: summary.substring(0, 150)
                        })
                    });

                    const wpData = await wpRes.json();
                    if (wpData.success) {
                        alert('🎉 ¡Flash Noticioso publicado con éxito en tu WordPress!\n\nLink: ' + wpData.permalink);
                        selfAnalysisResults.style.display = 'none';
                        selfAnalyzeUrlsInput.value = '';
                        loadFlashes();
                    } else {
                        alert('Error publicando en WordPress: ' + (wpData.message || 'Error en servidor'));
                    }
                } catch(e) {
                    alert('Error en la publicación.');
                } finally {
                    btnPublishSelfFlash.disabled = false;
                    btnPublishSelfFlash.innerText = '🚀 PUBLICAR MI NOTICIERO FLASH EN MI DIARIO';
                }
            });

            // Handle Partner Video Upload / Submit to Nexativa Studio
            const btnSendPartnerVideo = document.getElementById('btnSendPartnerVideo');
            const partnerVideoUrlInput = document.getElementById('partnerVideoUrl');
            const partnerVideoMsg = document.getElementById('partnerVideoMsg');

            btnSendPartnerVideo.addEventListener('click', async function() {
                const videoUrl = partnerVideoUrlInput.value.trim();
                if (!videoUrl) return;

                btnSendPartnerVideo.disabled = true;
                btnSendPartnerVideo.innerText = 'Enviando...';

                try {
                    const res = await fetch(partnerVideosEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            partner_name: 'Cadena 4',
                            title: 'Cobertura Enviada por Cliente',
                            video_url: videoUrl
                        })
                    });
                    const json = await res.json();
                    if (json.success) {
                        partnerVideoMsg.innerText = '🎉 ¡Video recibido en Estudio!';
                        partnerVideoMsg.style.display = 'block';
                        partnerVideoUrlInput.value = '';
                    }
                } catch(e) {} finally {
                    btnSendPartnerVideo.disabled = false;
                    btnSendPartnerVideo.innerText = 'Enviar a Estudio';
                }
            });

            const btnReloadFlashes = document.getElementById('btnReloadFlashes');
            btnReloadFlashes.addEventListener('click', loadFlashes);

            async function loadFlashes() {
                const listEl = document.getElementById('flashesList');
                listEl.innerHTML = '<p style="color:#94a3b8;">Cargando últimos Flashes de Noticias...</p>';
                try {
                    const res = await fetch(flashesApiEndpoint);
                    const json = await res.json();
                    if (json.success && json.flashes && json.flashes.length > 0) {
                        listEl.innerHTML = '';
                        json.flashes.forEach(flash => {
                            const durationMin = Math.floor(flash.duration_seconds / 60);
                            const durationSec = flash.duration_seconds % 60;
                            const embedUrl = flash.embed_url || flash.video_url;

                            const card = document.createElement('div');
                            card.className = 'flash-card';
                            card.innerHTML = `
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                    <span style="font-weight:bold; color:#dc2626; text-transform:uppercase; font-size:12px;">🔴 FLASH (${durationMin}m ${durationSec}s)</span>
                                    <span style="font-size:11px; color:#64748b;">${new Date(flash.created_at).toLocaleDateString()}</span>
                                </div>
                                <h3 style="margin:0 0 8px 0; font-size:16px;">${flash.title}</h3>
                                <p style="font-size:13px; color:#334155; margin-bottom:12px;">${flash.summary}</p>
                                <div style="margin-bottom:12px; background:#000; border-radius:8px; overflow:hidden; aspect-ratio:16/9;">
                                    <iframe src="${embedUrl}" width="100%" height="280" frameborder="0" allowfullscreen></iframe>
                                </div>
                                <button type="button" class="nora-btn-publish btnPublishFlash" data-title="${encodeURIComponent(flash.title)}" data-summary="${encodeURIComponent(flash.summary)}" data-embed="${encodeURIComponent(embedUrl)}">
                                    ¡PUBLICAR ESTE FLASH EN MI DIARIO!
                                </button>
                            `;
                            listEl.appendChild(card);
                        });

                        document.querySelectorAll('.btnPublishFlash').forEach(btn => {
                            btn.addEventListener('click', async function() {
                                const title = decodeURIComponent(this.getAttribute('data-title'));
                                const summary = decodeURIComponent(this.getAttribute('data-summary'));
                                const embed = decodeURIComponent(this.getAttribute('data-embed'));
                                
                                this.disabled = true;
                                this.innerText = 'Publicando...';

                                const content = `<h2>${title}</h2><p>${summary}</p><br><iframe width="100%" height="450" src="${embed}" frameborder="0" allowfullscreen></iframe>`;

                                try {
                                    const res = await fetch(wpRestEndpoint, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'X-WP-Nonce': wpNonce
                                        },
                                        body: JSON.stringify({
                                            title: title,
                                            content: content,
                                            excerpt: summary.substring(0, 150)
                                        })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                        alert('🎉 ¡Flash de Noticias publicado con éxito en tu WordPress!\n\nLink: ' + data.permalink);
                                    } else {
                                        alert('Error al publicar: ' + (data.message || 'Error en servidor'));
                                    }
                                } catch(e) {
                                    alert('Error de comunicación con WordPress.');
                                } finally {
                                    this.disabled = false;
                                    this.innerText = '¡PUBLICAR ESTE FLASH EN MI DIARIO!';
                                }
                            });
                        });
                    } else {
                        listEl.innerHTML = '<p style="color:#64748b;">No hay Flashes de noticias disponibles por el momento.</p>';
                    }
                } catch(e) {
                    listEl.innerHTML = '<p style="color:#dc2626;">Error cargando Flashes de Noticias desde la API de Nexativa.</p>';
                }
            }

            const chatEl = document.getElementById('noraChat');
            const inputEl = document.getElementById('noraInput');
            const draftEl = document.getElementById('noraDraft');
            const btnSend = document.getElementById('btnSend');
            const btnPublish = document.getElementById('btnPublish');
            const imageInput = document.getElementById('noraImage');
            const audioFileInput = document.getElementById('noraAudioFile');
            const videoFileInput = document.getElementById('noraVideoFile');
            const btnAudioRec = document.getElementById('btnAudioRec');
            const btnVideoRec = document.getElementById('btnVideoRec');

            function addMessage(role, text) {
                const div = document.createElement('div');
                div.className = 'nora-msg ' + role;
                div.innerHTML = '<strong>' + (role === 'user' ? 'Movilero' : 'Nora IA') + ':</strong> ' + text;
                chatEl.appendChild(div);
                chatEl.scrollTop = chatEl.scrollHeight;
            }

            async function sendToNora(messageText, imageBase64, audioBase64, videoBase64) {
                if (isProcessing) return;
                isProcessing = true;
                btnSend.disabled = true;

                addMessage('user', messageText || (videoBase64 ? '[Filmación de video (hasta 60s) enviada]' : imageBase64 ? '[Imagen de la calle adjunta]' : '[Reporte de voz enviado]'));

                try {
                    const res = await fetch(apiEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: messageText,
                            currentDraft: currentDraft,
                            image: imageBase64,
                            audio: audioBase64,
                            video: videoBase64
                        })
                    });
                    const data = await res.json();
                    if (data.newDraft) {
                        currentDraft = data.newDraft;
                        draftEl.innerHTML = currentDraft;
                    }
                    addMessage('nora', data.reply || 'Borrador de la noticia actualizado con el video.');
                } catch (e) {
                    addMessage('nora', 'Error de conexión con la IA. Detalle: ' + (e.message || e));
                } finally {
                    isProcessing = false;
                    btnSend.disabled = false;
                    inputEl.value = '';
                }
            }

            btnSend.addEventListener('click', function() {
                const text = inputEl.value.trim();
                if (text) sendToNora(text, null, null, null);
            });

            inputEl.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') btnSend.click();
            });

            imageInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = function(evt) {
                    sendToNora('Imagen adjunta tomada desde el lugar de los hechos (' + file.name + ')', evt.target.result, null, null);
                };
                reader.readAsDataURL(file);
            });

            audioFileInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = function(evt) {
                    sendToNora('Audio de voz adjunto desde dispositivo (' + file.name + ')', null, evt.target.result, null);
                };
                reader.readAsDataURL(file);
            });

            videoFileInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 25 * 1024 * 1024) {
                    alert('El video supera los 25MB. Por favor sube una filmación más corta de hasta 60 segundos.');
                    return;
                }
                const reader = new FileReader();
                reader.onload = function(evt) {
                    sendToNora('Filmación de video subida desde la calle por siniestro/evento (' + file.name + ')', null, null, evt.target.result);
                };
                reader.readAsDataURL(file);
            });

            let mediaRecorder = null;
            let audioChunks = [];
            let isRecording = false;

            btnAudioRec.addEventListener('click', async function() {
                if (!isRecording) {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        mediaRecorder = new MediaRecorder(stream);
                        audioChunks = [];
                        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
                        mediaRecorder.onstop = async () => {
                            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                            const reader = new FileReader();
                            reader.onloadend = function() {
                                sendToNora('Reporte de voz grabado por el movilero', null, reader.result, null);
                            };
                            reader.readAsDataURL(audioBlob);
                        };
                        mediaRecorder.start();
                        isRecording = true;
                        btnAudioRec.style.background = '#dc2626';
                        btnAudioRec.style.color = '#fff';
                        btnAudioRec.innerText = '🔴 Grabando (Clic para enviar)';
                    } catch(err) {
                        alert('No se pudo acceder al micrófono del dispositivo');
                    }
                } else {
                    mediaRecorder.stop();
                    isRecording = false;
                    btnAudioRec.style.background = '';
                    btnAudioRec.style.color = '';
                    btnAudioRec.innerText = '🎙️ Grabar Audio';
                }
            });

            // 60-Second Video Filming Handler
            let videoMediaRecorder = null;
            let videoChunks = [];
            let isVideoRecording = false;
            let videoTimerInterval = null;
            let videoSecondsLeft = 60;

            btnVideoRec.addEventListener('click', async function() {
                if (!isVideoRecording) {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                        videoMediaRecorder = new MediaRecorder(stream);
                        videoChunks = [];
                        videoMediaRecorder.ondataavailable = e => videoChunks.push(e.data);
                        videoMediaRecorder.onstop = async () => {
                            if (videoTimerInterval) clearInterval(videoTimerInterval);
                            stream.getTracks().forEach(track => track.stop());

                            const videoBlob = new Blob(videoChunks, { type: 'video/webm' });
                            const reader = new FileReader();
                            reader.onloadend = function() {
                                sendToNora('Video filmado en el lugar del siniestro (hasta 60s)', null, null, reader.result);
                            };
                            reader.readAsDataURL(videoBlob);
                        };

                        videoMediaRecorder.start();
                        isVideoRecording = true;
                        videoSecondsLeft = 60;

                        btnVideoRec.style.background = '#dc2626';
                        btnVideoRec.style.color = '#fff';
                        btnVideoRec.innerText = '🔴 Filmando (60s)... Clic para terminar';

                        videoTimerInterval = setInterval(() => {
                            videoSecondsLeft--;
                            if (videoSecondsLeft <= 0) {
                                if (videoMediaRecorder && isVideoRecording) {
                                    videoMediaRecorder.stop();
                                    isVideoRecording = false;
                                    btnVideoRec.style.background = '#fef2f2';
                                    btnVideoRec.style.color = '#b91c1c';
                                    btnVideoRec.innerText = '🎥 Filmar Video (60s max)';
                                }
                            } else {
                                btnVideoRec.innerText = `🔴 Filmando (${videoSecondsLeft}s restantes)... Clic para terminar`;
                            }
                        }, 1000);

                    } catch(err) {
                        alert('No se pudo acceder a la cámara y micrófono para filmar el video: ' + err.message);
                    }
                } else {
                    if (videoTimerInterval) clearInterval(videoTimerInterval);
                    videoMediaRecorder.stop();
                    isVideoRecording = false;
                    btnVideoRec.style.background = '#fef2f2';
                    btnVideoRec.style.color = '#b91c1c';
                    btnVideoRec.innerText = '🎥 Filmar Video (60s max)';
                }
            });

            btnPublish.addEventListener('click', async function() {
                const content = draftEl.innerHTML.trim();
                if (!content || content.includes('aparecerá aquí')) {
                    alert('El borrador está vacío. Envía un reporte a Nora primero.');
                    return;
                }

                btnPublish.disabled = true;
                btnPublish.innerText = 'Publicando...';

                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = content;
                const firstP = tempDiv.querySelector('p') || tempDiv;
                const rawTitle = firstP.innerText.split('\n')[0].substring(0, 90);
                const title = rawTitle.length > 5 ? rawTitle : '🔴 Noticia en Desarrollo';

                try {
                    const res = await fetch(wpRestEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-WP-Nonce': wpNonce
                        },
                        body: JSON.stringify({
                            title: title,
                            content: content,
                            excerpt: tempDiv.innerText.substring(0, 160) + '...'
                        })
                    });
                    const data = await res.json();
                    if (data.success) {
                        alert('🎉 ¡Noticia publicada con éxito en Cadena 4!\n\nLink: ' + data.permalink);
                    } else {
                        alert('Error al publicar: ' + (data.message || 'Error en el servidor de WordPress'));
                    }
                } catch(e) {
                    alert('Error al enviar la publicación a WordPress.');
                } finally {
                    btnPublish.disabled = false;
                    btnPublish.innerText = '¡PUBLICAR EN CADENA 4!';
                }
            });

        })();
        </script>
    </div>
    <?php
}
