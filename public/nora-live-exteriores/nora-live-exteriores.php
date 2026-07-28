<?php
/**
 * Plugin Name: Nora Live Exteriores - Cadena 4 & Nexativa
 * Plugin URI: https://cadena4.com.ar
 * Description: Herramienta de cobertura periodística en vivo con Inteligencia Artificial (NORA) para corresponsales y movileros de Cadena 4 y Nexativa News.
 * Version: 1.0.0
 * Author: Nexativa News & Cadena 4
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
        'post_content'  => $content . '<br><br><p><em>Fuente: Cobertura en vivo con Nora Live (Cadena 4 & Nexativa News)</em></p>',
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
        <h1 style="display:flex; align-items:center; gap:10px; margin-bottom: 5px;">
            <span style="color:#e53e3e;">🔴</span> Nora Live Exteriores
            <span style="font-size:12px; background:#2563eb; color:#fff; padding:3px 10px; border-radius:12px; font-weight:bold;">Cadena 4 & Nexativa</span>
        </h1>
        <p style="color:#666; font-size:14px; margin-top:0;">Redactora Jefa con Inteligencia Artificial para movileros y corresponsales en el lugar de los hechos.</p>
        
        <style>
            #nora-live-container {
                display: flex;
                gap: 20px;
                margin-top: 20px;
                max-width: 1200px;
            }
            @media (max-width: 768px) {
                #nora-live-container {
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
            .nora-draft-area:focus {
                border-color: #3b82f6;
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
            .nora-btn-publish:hover {
                background: #b91c1c !important;
            }
            .nora-btn-publish:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
        </style>

        <div id="nora-live-container">
            <!-- Columna Izquierda: Reporte del Movilero -->
            <div class="nora-box">
                <h2 style="margin-top:0; font-size:16px; display:flex; align-items:center; gap:8px;">
                    🎤 Reporte desde la calle (Movil / Corresponsal)
                </h2>
                
                <div class="nora-chat-messages" id="noraChat">
                    <div class="nora-msg nora">
                        <strong>Nora (Redactora Jefa IA):</strong> Hola corresponsal. Envíame lo que esté sucediendo (texto, fotos o audios de voz) y redactaré la noticia inmediatamente.
                    </div>
                </div>

                <div style="display:flex; gap:10px; margin-bottom:12px;">
                    <input type="text" id="noraInput" placeholder="Escribe el suceso aquí..." style="flex:1; padding:10px; border-radius:6px; border:1px solid #cbd5e1;" />
                    <button type="button" class="button button-primary" id="btnSend" style="padding:0 18px;">Enviar</button>
                </div>
                
                <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                    <label class="button" style="display:flex; align-items:center; gap:5px; cursor:pointer;">
                        📷 Subir Foto
                        <input type="file" id="noraImage" accept="image/*" style="display:none;" />
                    </label>
                    <button type="button" class="button" id="btnAudioRec" style="display:flex; align-items:center; gap:5px;">
                        🎙️ Grabar Audio
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

        <script>
        (function() {
            const apiEndpoint = '<?php echo esc_js($api_url); ?>/api/nora-live';
            const wpRestEndpoint = '/wp-json/nora-live/v1/publish';
            const wpNonce = '<?php echo esc_js($nonce); ?>';
            
            let currentDraft = '';
            let isProcessing = false;

            const chatEl = document.getElementById('noraChat');
            const inputEl = document.getElementById('noraInput');
            const draftEl = document.getElementById('noraDraft');
            const btnSend = document.getElementById('btnSend');
            const btnPublish = document.getElementById('btnPublish');
            const imageInput = document.getElementById('noraImage');
            const btnAudioRec = document.getElementById('btnAudioRec');

            function addMessage(role, text) {
                const div = document.createElement('div');
                div.className = 'nora-msg ' + role;
                div.innerHTML = '<strong>' + (role === 'user' ? 'Movilero' : 'Nora IA') + ':</strong> ' + text;
                chatEl.appendChild(div);
                chatEl.scrollTop = chatEl.scrollHeight;
            }

            async function sendToNora(messageText, imageBase64, audioBase64) {
                if (isProcessing) return;
                isProcessing = true;
                btnSend.disabled = true;

                addMessage('user', messageText || (imageBase64 ? '[Imagen de la calle adjunta]' : '[Reporte de voz enviado]'));

                try {
                    const res = await fetch(apiEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: messageText,
                            currentDraft: currentDraft,
                            image: imageBase64,
                            audio: audioBase64
                        })
                    });
                    const data = await res.json();
                    if (data.newDraft) {
                        currentDraft = data.newDraft;
                        draftEl.innerHTML = currentDraft;
                    }
                    addMessage('nora', data.reply || 'Borrador de la noticia actualizado.');
                } catch (e) {
                    addMessage('nora', 'Error de comunicación con la IA. Verifica tu conexión a internet.');
                } finally {
                    isProcessing = false;
                    btnSend.disabled = false;
                    inputEl.value = '';
                }
            }

            btnSend.addEventListener('click', function() {
                const text = inputEl.value.trim();
                if (text) sendToNora(text, null, null);
            });

            inputEl.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') btnSend.click();
            });

            imageInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = function(evt) {
                    sendToNora('Imagen adjunta tomada desde el lugar de los hechos', evt.target.result, null);
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
                                sendToNora('Reporte de voz grabado por el movilero', null, reader.result);
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
