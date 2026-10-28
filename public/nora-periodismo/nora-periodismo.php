<?php
/**
 * Plugin Name: Nora Periodismo Pro - Cadena 4 & Nexativa
 * Plugin URI: https://cadena4.com.ar
 * Description: Suite completa de periodismo digital con IA: Nora Live Editor, Auto-Clipper Pro, Flashes Noticiosos y Móvil de Exteriores PWA para Cadena 4 y Nexativa News.
 * Version: 2.1.0
 * Author: MyJNexoraVisual & Nexativa News
 * License: GPLv2 or later
 */

if (!defined('ABSPATH')) exit; // Exit if accessed directly

// ==============================================================================
// 1. REGISTRO DE MENÚS Y SUBMENÚS EN EL PANEL DE WORDPRESS
// ==============================================================================
add_action('admin_menu', 'nora_live_register_menus');

function nora_live_register_menus() {
    // Menú Principal
    add_menu_page(
        'Nora Periodismo Pro',
        'Nora Periodismo 🔴',
        'edit_posts',
        'nora-live-exteriores',
        'nora_live_main_admin_page',
        'dashicons-microphone',
        6
    );

    // Submenús
    add_submenu_page(
        'nora-live-exteriores',
        'Nora Live Editor',
        '🎤 Live Editor',
        'edit_posts',
        'nora-live-exteriores',
        'nora_live_main_admin_page'
    );

    add_submenu_page(
        'nora-live-exteriores',
        'Nora Auto-Clipper Pro',
        '🎬 Auto-Clipper & Clips',
        'edit_posts',
        'nora-live-clipper',
        'nora_live_clipper_admin_page'
    );

    add_submenu_page(
        'nora-live-exteriores',
        'Flashes Noticiosos',
        '🔴 Flashes (1-5 min)',
        'edit_posts',
        'nora-live-flashes',
        'nora_live_flashes_admin_page'
    );

    add_submenu_page(
        'nora-live-exteriores',
        'Móvil de Exteriores PWA & QR',
        '📱 Móvil PWA & QR',
        'edit_posts',
        'nora-live-movil',
        'nora_live_movil_admin_page'
    );
}

// ==============================================================================
// 1.B: SISTEMA DE AUTO-ACTUALIZACIÓN REMOTA AUTOMÁTICA DESDE NEXATIVA NEWS
// ==============================================================================
if (!defined('NORA_LIVE_PLUGIN_VERSION')) {
    define('NORA_LIVE_PLUGIN_VERSION', '2.1.0');
}
if (!defined('NORA_LIVE_PLUGIN_BASENAME')) {
    define('NORA_LIVE_PLUGIN_BASENAME', plugin_basename(__FILE__));
}
if (!defined('NORA_LIVE_PLUGIN_SLUG')) {
    define('NORA_LIVE_PLUGIN_SLUG', dirname(plugin_basename(__FILE__)));
}
if (!defined('NORA_LIVE_UPDATE_URL')) {
    define('NORA_LIVE_UPDATE_URL', 'https://www.nexativanews.com.ar/api/plugin-update?slug=' . NORA_LIVE_PLUGIN_SLUG);
}

// Interceptar chequeo de actualizaciones de plugins de WordPress
add_filter('pre_set_site_transient_update_plugins', 'nora_live_check_for_plugin_update');
function nora_live_check_for_plugin_update($transient) {
    if (empty($transient) || !is_object($transient)) {
        return $transient;
    }

    $response = wp_remote_get(NORA_LIVE_UPDATE_URL, array('timeout' => 8, 'headers' => array('Accept' => 'application/json')));

    if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
        $info = json_decode(wp_remote_retrieve_body($response));
        if ($info && isset($info->version) && version_compare(NORA_LIVE_PLUGIN_VERSION, $info->version, '<')) {
            $obj = new stdClass();
            $obj->slug = NORA_LIVE_PLUGIN_SLUG;
            $obj->plugin = NORA_LIVE_PLUGIN_BASENAME;
            $obj->new_version = $info->version;
            $obj->url = $info->homepage ?? 'https://cadena4.com.ar';
            $obj->package = $info->package ?? ('https://www.nexativanews.com.ar/' . NORA_LIVE_PLUGIN_SLUG . '.zip');
            $obj->tested = $info->tested ?? '6.7';
            $obj->requires_php = $info->requires_php ?? '7.4';

            $transient->response[$obj->plugin] = $obj;
        }
    }
    return $transient;
}

// Modal de información de actualización en el panel de plugins
add_filter('plugins_api', 'nora_live_plugin_info_popup', 20, 3);
function nora_live_plugin_info_popup($res, $action, $args) {
    if ($action !== 'plugin_information' || !isset($args->slug) || ($args->slug !== NORA_LIVE_PLUGIN_SLUG && $args->slug !== 'nora-live-exteriores' && $args->slug !== 'nora-periodismo')) {
        return $res;
    }

    $response = wp_remote_get(NORA_LIVE_UPDATE_URL, array('timeout' => 8, 'headers' => array('Accept' => 'application/json')));

    if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
        $info = json_decode(wp_remote_retrieve_body($response), true);
        if ($info) {
            $res = (object) $info;
            $res->sections = (array) ($info['sections'] ?? array());
            return $res;
        }
    }
    return $res;
}

// Activar auto-actualizaciones desatendidas en segundo plano
add_filter('auto_update_plugin', 'nora_live_auto_update_filter', 10, 2);
function nora_live_auto_update_filter($update, $item) {
    if (isset($item->slug) && ($item->slug === NORA_LIVE_PLUGIN_SLUG || $item->slug === 'nora-live-exteriores' || $item->slug === 'nora-periodismo')) {
        return true;
    }
    return $update;
}

// Endpoint AJAX para chequear y forzar actualización en 1 clic
add_action('wp_ajax_nora_live_check_update_now', 'nora_live_ajax_check_update_now');
function nora_live_ajax_check_update_now() {
    check_ajax_referer('nora_live_nonce_action', 'security');
    delete_site_transient('update_plugins');

    $response = wp_remote_get(NORA_LIVE_UPDATE_URL, array('timeout' => 10));
    if (is_wp_error($response)) {
        wp_send_json_error(array('message' => 'Error de conexión con Nexativa News.'));
    }

    $info = json_decode(wp_remote_retrieve_body($response), true);
    if (!$info || !isset($info['version'])) {
        wp_send_json_error(array('message' => 'Respuesta no válida del servidor central.'));
    }

    $has_update = version_compare(NORA_LIVE_PLUGIN_VERSION, $info['version'], '<');
    $update_url = wp_nonce_url(
        self_admin_url('update.php?action=upgrade-plugin&plugin=' . urlencode(NORA_LIVE_PLUGIN_BASENAME)),
        'upgrade-plugin_' . NORA_LIVE_PLUGIN_BASENAME
    );

    wp_send_json_success(array(
        'current_version' => NORA_LIVE_PLUGIN_VERSION,
        'latest_version'  => $info['version'],
        'has_update'      => $has_update,
        'update_url'      => $update_url,
        'changelog'       => $info['sections']['changelog'] ?? ''
    ));
}

// ==============================================================================
// 2. MOTOR DE PUBLICACIÓN DUAL: REST API + ADMIN-AJAX (ALTA DISPONIBILIDAD)
// ==============================================================================

// Función central de inserción de posts (compartida por REST y AJAX)
function nora_live_insert_post_core($title, $content, $excerpt = '', $image_url = '') {
    $title = sanitize_text_field(!empty($title) ? $title : '🔴 Cobertura en Vivo');
    $excerpt = sanitize_text_field($excerpt);

    // Permitir etiquetas HTML completas, incluyendo iframes para video y reproductores limpios
    $allowed_html = wp_kses_allowed_html('post');
    $allowed_html['iframe'] = array(
        'src'             => true,
        'width'           => true,
        'height'          => true,
        'frameborder'     => true,
        'allowfullscreen' => true,
        'allow'           => true,
        'style'           => true,
        'loading'         => true,
        'title'           => true,
    );
    $allowed_html['div']['style'] = true;
    $allowed_html['div']['class'] = true;

    $clean_content = wp_kses($content, $allowed_html);
    if (empty(trim(strip_tags($clean_content, '<iframe><video><audio><img>')))) {
        return new WP_Error('empty_content', 'El contenido de la noticia está vacío.');
    }

    $post_data = array(
        'post_title'    => $title,
        'post_content'  => $clean_content . "\n\n" . '<p style="margin-top:20px; font-size:12px; color:#64748b; font-style:italic; border-top:1px solid #e2e8f0; padding-top:8px;">Cobertura procesada por Nora IA Periodismo — Cadena 4 & Nexativa News.</p>',
        'post_excerpt'  => $excerpt,
        'post_status'   => 'publish',
        'post_author'   => get_current_user_id() ? get_current_user_id() : 1,
    );

    $post_id = wp_insert_post($post_data, true);
    if (is_wp_error($post_id)) {
        return $post_id;
    }

    // Sideload de imagen destacada si se provee una URL válida
    if (!empty($image_url) && filter_var($image_url, FILTER_VALIDATE_URL)) {
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');

        $attachment_id = media_sideload_image($image_url, $post_id, $title, 'id');
        if (!is_wp_error($attachment_id)) {
            set_post_thumbnail($post_id, $attachment_id);
        }
    }

    return array(
        'success'   => true,
        'post_id'   => $post_id,
        'permalink' => get_permalink($post_id),
        'title'     => $title
    );
}

// 2.A: Endpoint REST API (/wp-json/nora-live/v1/publish)
add_action('rest_api_init', function () {
    register_rest_route('nora-live/v1', '/publish', array(
        'methods'             => 'POST',
        'callback'            => 'nora_live_rest_publish_handler',
        'permission_callback' => function () {
            return current_user_can('edit_posts') || current_user_can('publish_posts');
        }
    ));
});

function nora_live_rest_publish_handler($request) {
    $params = $request->get_json_params();
    $title = $params['title'] ?? '';
    $content = $params['content'] ?? '';
    $excerpt = $params['excerpt'] ?? '';
    $image_url = $params['image_url'] ?? '';

    $res = nora_live_insert_post_core($title, $content, $excerpt, $image_url);
    if (is_wp_error($res)) {
        return new WP_Error('publish_failed', $res->get_error_message(), array('status' => 500));
    }
    return $res;
}

// 2.B: Endpoint Fallback admin-ajax.php (action: nora_live_publish)
add_action('wp_ajax_nora_live_publish', 'nora_live_ajax_publish_handler');

function nora_live_ajax_publish_handler() {
    check_ajax_referer('nora_live_nonce_action', 'security');

    if (!current_user_can('edit_posts') && !current_user_can('publish_posts')) {
        wp_send_json_error(array('message' => 'Permisos insuficientes para publicar en WordPress.'));
    }

    $title = isset($_POST['title']) ? wp_unslash($_POST['title']) : '';
    $content = isset($_POST['content']) ? wp_unslash($_POST['content']) : '';
    $excerpt = isset($_POST['excerpt']) ? wp_unslash($_POST['excerpt']) : '';
    $image_url = isset($_POST['image_url']) ? esc_url_raw($_POST['image_url']) : '';

    $res = nora_live_insert_post_core($title, $content, $excerpt, $image_url);
    if (is_wp_error($res)) {
        wp_send_json_error(array('message' => $res->get_error_message()));
    } else {
        wp_send_json_success($res);
    }
}

// 2.C: Almacenamiento local de clips en WordPress (wp_options) - 100% independiente de bases de datos externas
add_action('wp_ajax_nora_live_save_local_clip', 'nora_live_ajax_save_local_clip');
function nora_live_ajax_save_local_clip() {
    check_ajax_referer('nora_live_nonce_action', 'security');
    $clip_json = isset($_POST['clip']) ? wp_unslash($_POST['clip']) : '';
    $clip = json_decode($clip_json, true);
    if (!$clip || !is_array($clip)) {
        wp_send_json_error(array('message' => 'Clip inválido'));
    }

    $clips = get_option('nora_cadena4_local_clips', array());
    if (!is_array($clips)) $clips = array();

    $sig = ($clip['video_url'] ?? '') . '_' . ($clip['start_time_seconds'] ?? 0);
    $filtered = array_values(array_filter($clips, function($c) use ($sig) {
        $s = ($c['video_url'] ?? '') . '_' . ($c['start_time_seconds'] ?? 0);
        return $s !== $sig;
    }));

    array_unshift($filtered, $clip);
    $filtered = array_slice($filtered, 0, 100);

    update_option('nora_cadena4_local_clips', $filtered, false);
    wp_send_json_success(array('clips' => $filtered, 'total' => count($filtered)));
}

add_action('wp_ajax_nora_live_get_local_clips', 'nora_live_ajax_get_local_clips');
function nora_live_ajax_get_local_clips() {
    check_ajax_referer('nora_live_nonce_action', 'security');
    $clips = get_option('nora_cadena4_local_clips', array());
    wp_send_json_success(array('clips' => is_array($clips) ? $clips : array()));
}

// ==============================================================================
// 3. PÁGINAS DE ADMINISTRACIÓN
// ==============================================================================

function nora_live_clipper_admin_page() {
    nora_live_render_page_with_tab('clipper');
}

function nora_live_flashes_admin_page() {
    nora_live_render_page_with_tab('flashes');
}

function nora_live_movil_admin_page() {
    nora_live_render_page_with_tab('movil');
}

function nora_live_main_admin_page() {
    nora_live_render_page_with_tab('live');
}

function nora_live_render_page_with_tab($initial_tab = 'live') {
    $rest_nonce = wp_create_nonce('wp_rest');
    $ajax_nonce = wp_create_nonce('nora_live_nonce_action');
    $rest_url   = esc_url_raw(rest_url('nora-live/v1/publish'));
    $ajax_url   = admin_url('admin-ajax.php');
    $nexativa_url = 'https://www.nexativanews.com.ar';
    ?>
    <div class="wrap nora-wrap" style="max-width:1300px; margin:20px auto; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif;">
        <!-- Banner de Encabezado -->
        <div style="background:linear-gradient(135deg, #450a0a 0%, #09090b 50%, #020617 100%); border:1px solid rgba(239,68,68,0.3); border-radius:16px; padding:24px 28px; color:#fff; box-shadow:0 12px 30px rgba(0,0,0,0.3); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:24px;">
            <div style="display:flex; align-items:center; gap:16px;">
                <div style="width:48px; height:48px; border-radius:12px; background:linear-gradient(135deg, #dc2626, #b91c1c); display:flex; align-items:center; justify-content:center; font-size:24px; box-shadow:0 4px 15px rgba(220,38,38,0.5);">
                    🔴
                </div>
                <div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="background:rgba(220,38,38,0.2); border:1px solid rgba(239,68,68,0.4); color:#fca5a5; font-size:10px; font-weight:800; padding:2px 8px; border-radius:20px; text-transform:uppercase; letter-spacing:1px;">
                            Panel de Periodismo IA
                        </span>
                        <span style="background:#2563eb; color:#fff; font-size:10px; font-weight:800; padding:2px 8px; border-radius:20px;">
                            Cadena 4 & Nexativa News
                        </span>
                    </div>
                    <h1 style="font-size:24px; font-weight:900; margin:6px 0 0 0; color:#fff; letter-spacing:-0.5px;">
                        Nora Periodismo Pro — Terminal Integral
                    </h1>
                </div>
            </div>

            <div style="text-align:right;">
                <div style="display:inline-flex; align-items:center; gap:6px; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); color:#34d399; font-size:11px; font-weight:700; padding:4px 12px; border-radius:8px;">
                    <span style="width:7px; height:7px; border-radius:50%; background:#10b981; display:inline-block; animation:pulse 2s infinite;"></span>
                    WordPress Dual-Engine Activo (REST + AJAX)
                </div>
                <div style="margin-top:6px; display:flex; gap:6px; justify-content:flex-end; align-items:center;">
                    <button type="button" id="btnCheckUpdateNow" class="button button-small" style="background:#1e293b; color:#38bdf8; border:1px solid #334155; font-size:11px; font-weight:700; cursor:pointer;">
                        🔄 Buscar Actualizaciones
                    </button>
                    <span style="font-size:10px; color:#94a3b8; font-family:monospace;">v<?php echo NORA_LIVE_PLUGIN_VERSION; ?></span>
                </div>
                <div style="font-size:11px; color:#94a3b8; margin-top:4px; font-family:monospace;">
                    Desarrollado por <strong style="color:#fff;">Nexora One</strong>
                </div>
            </div>
        </div>

        <!-- Barra de Navegación de Pestañas (Suite Completa) -->
        <div style="display:flex; gap:8px; border-bottom:2px solid #e2e8f0; margin-bottom:24px; padding-bottom:8px; flex-wrap:wrap;">
            <button type="button" class="nora-tab-btn <?php echo $initial_tab === 'live' ? 'active' : ''; ?>" data-tab="live">
                🎤 Nora Live Editor
            </button>
            <button type="button" class="nora-tab-btn <?php echo $initial_tab === 'clipper' ? 'active' : ''; ?>" data-tab="clipper">
                🎬 Auto-Clipper & Clips
            </button>
            <button type="button" class="nora-tab-btn <?php echo $initial_tab === 'flashes' ? 'active' : ''; ?>" data-tab="flashes">
                🔴 Flashes Noticiosos (1-5m)
            </button>
            <button type="button" class="nora-tab-btn <?php echo $initial_tab === 'movil' ? 'active' : ''; ?>" data-tab="movil">
                📱 Móvil Exteriores PWA & QR
            </button>
            <button type="button" class="nora-tab-btn" data-tab="status" style="margin-left:auto;">
                ⚙️ Estado & Diagnóstico
            </button>
        </div>

        <!-- Notificación Global Flotante -->
        <div id="noraNotice" style="display:none; padding:12px 18px; border-radius:10px; margin-bottom:20px; font-size:13px; font-weight:600;"></div>

        <!-- ========================================================================= -->
        <!-- PESTAÑA 1: NORA LIVE EDITOR (COBERTURA EN VIVO)                           -->
        <!-- ========================================================================= -->
        <div id="tab-live" class="nora-tab-content" style="<?php echo $initial_tab === 'live' ? '' : 'display:none;'; ?>">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px;">
                <!-- Chat con Nora -->
                <div class="nora-card">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; pb-12px; margin-bottom:12px;">
                        <h2 style="font-size:16px; font-weight:800; margin:0; display:flex; align-items:center; gap:8px;">
                            <span>💬</span> Redactora Jefa Nora IA (Modo Rápido)
                        </h2>
                        <span id="noraGpsBadge" style="font-size:11px; background:#f1f5f9; color:#475569; padding:2px 8px; border-radius:6px; font-family:monospace;">
                            📍 GPS: Detectando...
                        </span>
                    </div>

                    <div id="noraChat" style="height:320px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:10px; padding:12px; background:#f8fafc; margin-bottom:12px;">
                        <div class="nora-msg nora">
                            <strong>Nora IA:</strong> ¡Hola equipo de Cadena 4! Estoy lista para procesar la cobertura de exteriores. Envíame texto, audios de voz o filmaciones, y redactaré el borrador al instante con rigor periodístico.
                        </div>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <textarea id="noraInput" rows="3" placeholder="Escribe aquí los datos sueltos, testimonios o novedades..." style="width:100%; border:1px solid #cbd5e1; border-radius:8px; padding:10px; font-size:13px; resize:vertical;"></textarea>

                        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                            <button type="button" id="btnAudioRec" class="button" style="display:inline-flex; align-items:center; gap:4px;">
                                🎙️ Grabar Audio
                            </button>
                            <label class="button" style="display:inline-flex; align-items:center; gap:4px; cursor:pointer;">
                                📷 Foto <input type="file" id="noraImage" accept="image/*" style="display:none;" />
                            </label>
                            <label class="button" style="display:inline-flex; align-items:center; gap:4px; cursor:pointer;">
                                📹 Video <input type="file" id="noraVideoFile" accept="video/*" style="display:none;" />
                            </label>
                            <button type="button" id="btnSend" class="button button-primary" style="margin-left:auto; background:#dc2626; border-color:#dc2626; font-weight:800; padding:6px 18px;">
                                Enviar a Nora ⚡
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Borrador y Publicación -->
                <div class="nora-card">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; pb-12px; margin-bottom:12px;">
                        <h2 style="font-size:16px; font-weight:800; margin:0;">
                            📝 Borrador Periodístico en Desarrollo
                        </h2>
                        <div style="display:flex; gap:6px;">
                            <button type="button" id="btnPublishLive" class="nora-btn-publish" style="background:#dc2626; font-size:12px;">
                                🚀 PUBLICAR EN CADENA 4
                            </button>
                        </div>
                    </div>

                    <div id="noraDraft" contenteditable="true" style="min-height:360px; max-height:420px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:10px; padding:16px; background:#fff; font-size:14px; line-height:1.6; outline:none;">
                        <p style="color:#94a3b8; font-style:italic;">El borrador redactado por Nora aparecerá aquí a medida que envíes información...</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- ========================================================================= -->
        <!-- PESTAÑA 2: NORA AUTO-CLIPPER PRO & BIBLIOTECA DE CLIPS                     -->
        <!-- ========================================================================= -->
        <div id="tab-clipper" class="nora-tab-content" style="<?php echo $initial_tab === 'clipper' ? '' : 'display:none;'; ?>">
            <!-- Analizador de Programas de YouTube -->
            <div class="nora-card" style="margin-bottom:24px;">
                <h2 style="font-size:17px; font-weight:800; margin-top:0; color:#dc2626; display:flex; align-items:center; gap:8px;">
                    <span>⚡</span> Nora Auto-Clipper: Segmentar Videos de YouTube o Programas
                </h2>
                <p style="font-size:13px; color:#475569; margin-top:0;">
                    Pega los enlaces de tus programas completos o transmisiones en vivo (ej. Noticiero Mañana, Noticiero Noche). Nora IA analizará el contenido audiovisual, identificará los momentos de mayor impacto periodístico y generará recortes listos con marcas de tiempo exactas.
                </p>

                <div style="display:grid; grid-template-columns:2fr 1fr; gap:16px; margin-top:12px;">
                    <div>
                        <label style="font-size:11px; font-weight:700; color:#475569; text-transform:uppercase; display:block; margin-bottom:4px;">
                            URLs de Videos de YouTube / Transmisiones (hasta 5 links, 1 por línea)
                        </label>
                        <textarea id="clipperUrlsInput" rows="4" placeholder="https://www.youtube.com/watch?v=... (Noticiero Mañana)&#10;https://www.youtube.com/watch?v=... (Noticiero Noche)" style="width:100%; border:1px solid #cbd5e1; border-radius:8px; padding:10px; font-size:13px; font-family:monospace;"></textarea>
                    </div>

                    <div style="display:flex; flex-direction:column; justify-content:space-between;">
                        <div>
                            <label style="font-size:11px; font-weight:700; color:#475569; text-transform:uppercase; display:block; margin-bottom:4px;">
                                Referencia o Título del Lote
                            </label>
                            <input type="text" id="clipperBatchTitle" placeholder="Ej: Emisiones del Día Cadena 4" style="width:100%; border:1px solid #cbd5e1; border-radius:8px; padding:8px 12px; font-size:13px;" />
                        </div>

                        <button type="button" id="btnRunClipper" class="button button-primary" style="background:#dc2626; border-color:#dc2626; font-weight:800; padding:10px 16px; font-size:13px; width:100%; margin-top:12px;">
                            ⚡ Analizar y Extraer Clips con Nora IA
                        </button>
                    </div>
                </div>

                <!-- Resultados del Análisis Reciente -->
                <div id="clipperAnalysisResults" style="display:none; margin-top:20px; border-top:2px solid #fecaca; padding-top:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <div>
                            <h3 style="font-size:15px; font-weight:800; margin:0; color:#991b1b;">🎉 Recortes Generados por Nora IA:</h3>
                            <p id="clipperExecutiveSummary" style="font-size:12px; color:#475569; margin:4px 0 0 0;"></p>
                        </div>
                        <span id="clipperCountBadge" style="background:#dc2626; color:#fff; font-weight:800; font-size:11px; padding:3px 10px; border-radius:12px;"></span>
                    </div>

                    <div id="clipperNewClipsList" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:12px; margin-bottom:16px;"></div>

                    <!-- Ensamblador de Flash Combinado -->
                    <div style="background:#fef2f2; border:1px solid #fca5a5; border-radius:12px; padding:16px; margin-top:12px;">
                        <h4 style="margin:0 0 8px 0; color:#b91c1c; font-size:14px; font-weight:800;">🔴 Publicar como Flash de Noticias Combinado (1 a 5 min):</h4>
                        <div style="display:flex; gap:8px;">
                            <input type="text" id="clipperCombinedFlashTitle" placeholder="Título del Flash Combinado..." style="flex:1; border:1px solid #cbd5e1; border-radius:8px; padding:8px 12px; font-weight:700;" />
                            <button type="button" id="btnPublishCombinedFlash" class="nora-btn-publish" style="background:#dc2626; white-space:nowrap;">
                                🚀 PUBLICAR EN CADENA 4
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Biblioteca de Clips Almacenados en Nexativa -->
            <div class="nora-card">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:16px;">
                    <div>
                        <h2 style="font-size:17px; font-weight:800; margin:0; color:#0f172a; display:flex; align-items:center; gap:8px;">
                            <span>📁</span> Biblioteca de Clips Almacenados (Disponibles en Nexativa)
                        </h2>
                        <p style="font-size:12px; color:#64748b; margin:2px 0 0 0;">
                            Todos los recortes segmentados por Nora quedan guardados aquí. Puedes publicarlos individualmente en tu diario con 1 clic.
                        </p>
                    </div>

                    <button type="button" id="btnReloadStoredClips" class="button" style="font-weight:700; font-size:12px;">
                        🔄 Refrescar Biblioteca
                    </button>
                </div>

                <div id="storedClipsContainer" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:16px;">
                    <p style="color:#94a3b8; font-style:italic;">Cargando clips almacenados...</p>
                </div>
            </div>
        </div>

        <!-- ========================================================================= -->
        <!-- PESTAÑA 3: FLASHES NOTICIOSOS SINDICADOS (1-5 MIN)                        -->
        <!-- ========================================================================= -->
        <div id="tab-flashes" class="nora-tab-content" style="<?php echo $initial_tab === 'flashes' ? '' : 'display:none;'; ?>">
            <div class="nora-card">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:16px;">
                    <div>
                        <h2 style="font-size:17px; font-weight:800; margin:0; color:#dc2626; display:flex; align-items:center; gap:8px;">
                            <span>🔴</span> Flashes Noticiosos de 1 a 5 Minutos (Cadena 4 & Nexativa)
                        </h2>
                        <p style="font-size:12px; color:#64748b; margin:2px 0 0 0;">
                            Noticieros exprés optimizados con reproductor limpio sin distracciones.
                        </p>
                    </div>

                    <button type="button" id="btnReloadFlashesList" class="button" style="font-weight:700; font-size:12px;">
                        🔄 Actualizar Flashes
                    </button>
                </div>

                <div id="flashesFullList" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(340px, 1fr)); gap:20px;">
                    <p style="color:#94a3b8; font-style:italic;">Cargando lista de Flashes...</p>
                </div>
            </div>
        </div>

        <!-- ========================================================================= -->
        <!-- PESTAÑA 4: MÓVIL EXTERIORES PWA & QR                                      -->
        <!-- ========================================================================= -->
        <div id="tab-movil" class="nora-tab-content" style="<?php echo $initial_tab === 'movil' ? '' : 'display:none;'; ?>">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px;">
                <div class="nora-card">
                    <h2 style="font-size:17px; font-weight:800; margin-top:0; color:#2563eb; display:flex; align-items:center; gap:8px;">
                        <span>📱</span> Nora Móvil Exteriores PWA (Para Celulares)
                    </h2>
                    <p style="font-size:13px; color:#475569;">
                        Tu periodista de calle o movilero puede instalar la <strong>PWA Oficial de Exteriores</strong> directamente en su teléfono Android o iPhone sin pasar por Google Play o App Store.
                    </p>

                    <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:16px; margin:16px 0; font-size:13px; line-height:1.6; color:#1e40af;">
                        <h4 style="margin:0 0 8px 0; font-weight:800;">Ventajas del Móvil de Exteriores:</h4>
                        <ul style="margin:0; padding-left:20px;">
                            <li>🛰️ Geolocalización GPS precisa automática (detecta barrio y referencia).</li>
                            <li>🎙️ Grabación de notas de voz limpias con reducción de ruido.</li>
                            <li>📹 Filmación de video en el lugar del hecho (hasta 60 o 180 segundos).</li>
                            <li>🔒 Modo Acreditado con PIN o Periodismo Ciudadano Abierto.</li>
                            <li>⚡ Opera de forma independiente al diario.</li>
                        </ul>
                    </div>

                    <div style="display:flex; gap:12px; align-items:center;">
                        <a href="<?php echo esc_url($nexativa_url . '/corresponsal-movil'); ?>" target="_blank" class="button button-primary" style="background:#2563eb; border-color:#2563eb; font-weight:800; padding:8px 18px;">
                            🔗 Abrir PWA en el Navegador
                        </a>
                        <span style="font-size:12px; color:#64748b; font-family:monospace;"><?php echo esc_html($nexativa_url . '/corresponsal-movil'); ?></span>
                    </div>
                </div>

                <div class="nora-card" style="text-align:center;">
                    <h2 style="font-size:17px; font-weight:800; margin-top:0; color:#0f172a;">
                        📷 Código QR para Movileros y Ciudadanos
                    </h2>
                    <p style="font-size:13px; color:#64748b; margin-bottom:16px;">
                        Escanea este código con la cámara del celular para abrir e instalar la app de exteriores al instante:
                    </p>

                    <div style="display:inline-block; padding:16px; background:#fff; border:2px solid #e2e8f0; border-radius:16px; box-shadow:0 8px 20px rgba(0,0,0,0.06);">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=<?php echo urlencode($nexativa_url . '/corresponsal-movil'); ?>" alt="QR Nora Exteriores" style="display:block; width:200px; height:200px;" />
                    </div>

                    <div style="margin-top:16px; font-size:12px; color:#475569;">
                        Tip: Puedes imprimir este QR o pegarlo en el móvil de exteriores de Cadena 4.
                    </div>
                </div>
            </div>
        </div>

        <!-- ========================================================================= -->
        <!-- PESTAÑA 5: ESTADO Y DIAGNÓSTICO EN TIEMPO REAL                            -->
        <!-- ========================================================================= -->
        <div id="tab-status" class="nora-tab-content" style="display:none;">
            <div class="nora-card">
                <h2 style="font-size:17px; font-weight:800; margin-top:0; color:#0f172a; display:flex; align-items:center; gap:8px;">
                    <span>⚙️</span> Diagnóstico del Sistema y Cables de Conexión
                </h2>
                <p style="font-size:13px; color:#475569;">
                    Verifica que cada cable de comunicación entre Cadena 4, Nexativa News y Nora IA esté funcionando al 100%:
                </p>

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:16px; margin:20px 0;">
                    <div class="nora-diag-box" id="diagWpRest">
                        <span class="nora-diag-indicator" style="background:#f59e0b;"></span>
                        <div>
                            <strong>WordPress REST API</strong>
                            <div style="font-size:11px; color:#64748b;"><?php echo esc_html($rest_url); ?></div>
                        </div>
                    </div>

                    <div class="nora-diag-box" id="diagWpAjax">
                        <span class="nora-diag-indicator" style="background:#f59e0b;"></span>
                        <div>
                            <strong>WordPress AJAX (Fallback)</strong>
                            <div style="font-size:11px; color:#64748b;">admin-ajax.php (Acción nativa)</div>
                        </div>
                    </div>

                    <div class="nora-diag-box" id="diagNexativa">
                        <span class="nora-diag-indicator" style="background:#f59e0b;"></span>
                        <div>
                            <strong>API Nexativa Central</strong>
                            <div style="font-size:11px; color:#64748b;">nexativanews.com.ar/api/flashes</div>
                        </div>
                    </div>

                    <div class="nora-diag-box" id="diagNoraAI">
                        <span class="nora-diag-indicator" style="background:#f59e0b;"></span>
                        <div>
                            <strong>Motor Nora IA</strong>
                            <div style="font-size:11px; color:#64748b;">Nora Live & Auto-Clipper</div>
                        </div>
                    </div>
                </div>

                <button type="button" id="btnRunDiagnostics" class="button button-primary" style="font-weight:700;">
                    🔍 Ejecutar Test de Conexión Completo
                </button>
            </div>
        </div>
    </div>

    <!-- Estilos CSS de la Suite -->
    <style>
        .nora-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 24px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.03);
        }
        .nora-tab-btn {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            padding: 10px 18px;
            font-size: 13px;
            font-weight: 700;
            color: #475569;
            cursor: pointer;
            transition: all 0.2s;
        }
        .nora-tab-btn:hover {
            background: #e2e8f0;
            color: #0f172a;
        }
        .nora-tab-btn.active {
            background: #dc2626;
            border-color: #dc2626;
            color: #fff;
            box-shadow: 0 4px 12px rgba(220,38,38,0.3);
        }
        .nora-btn-publish {
            background: #dc2626 !important;
            color: #fff !important;
            border: none !important;
            padding: 8px 16px !important;
            border-radius: 8px !important;
            font-weight: 800 !important;
            cursor: pointer;
            text-transform: uppercase;
            font-size: 11px !important;
            transition: all 0.2s;
        }
        .nora-btn-publish:hover {
            background: #b91c1c !important;
        }
        .nora-btn-publish:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        .nora-msg {
            margin-bottom: 10px;
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 13px;
            line-height: 1.5;
            max-width: 88%;
        }
        .nora-msg.user {
            background: #dbeafe;
            color: #1e40af;
            margin-left: auto;
            border: 1px solid #bfdbfe;
        }
        .nora-msg.nora {
            background: #fef3c7;
            color: #92400e;
            border: 1px solid #fde68a;
        }
        .nora-clip-card {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 14px;
            background: #fff;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.03);
            transition: transform 0.2s;
        }
        .nora-clip-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0,0,0,0.06);
        }
        .nora-diag-box {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 12px;
            background: #f8fafc;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .nora-diag-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
            flex-shrink: 0;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.4; }
            100% { opacity: 1; }
        }
    </style>

    <!-- JavaScript del Motor de Periodismo y Publicación Dual -->
    <script>
    (function() {
        const wpRestUrl = <?php echo json_encode($rest_url); ?>;
        const wpAjaxUrl = <?php echo json_encode($ajax_url); ?>;
        const wpRestNonce = <?php echo json_encode($rest_nonce); ?>;
        const wpAjaxNonce = <?php echo json_encode($ajax_nonce); ?>;
        const nexativaBaseUrl = <?php echo json_encode($nexativa_url); ?>;

        const liveApiEndpoint = nexativaBaseUrl + '/api/nora-live';
        const clipperApiEndpoint = nexativaBaseUrl + '/api/nora-clip';
        const clipsApiEndpoint = nexativaBaseUrl + '/api/clips?limit=50';
        const flashesApiEndpoint = nexativaBaseUrl + '/api/flashes?limit=20';

        // Manejador de Avisos
        function showNotice(msg, isSuccess = true) {
            const el = document.getElementById('noraNotice');
            if (!el) return;
            el.style.display = 'block';
            el.style.background = isSuccess ? '#ecfdf5' : '#fef2f2';
            el.style.color = isSuccess ? '#065f46' : '#991b1b';
            el.style.border = '1px solid ' + (isSuccess ? '#a7f3d0' : '#fecaca');
            el.innerHTML = (isSuccess ? '✅ ' : '⚠️ ') + msg;
            setTimeout(() => { el.style.display = 'none'; }, 6000);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // =========================================================================
        // MOTOR DUAL DE PUBLICACIÓN (REST API + FALLBACK AUTOMÁTICO A ADMIN-AJAX)
        // =========================================================================
        async function publishToWordPressDual(title, content, excerpt = '', imageUrl = '') {
            let lastError = null;

            // Intento 1: REST API
            try {
                const res = await fetch(wpRestUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': wpRestNonce
                    },
                    body: JSON.stringify({
                        title: title,
                        content: content,
                        excerpt: excerpt,
                        image_url: imageUrl
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data && (data.success || data.permalink || data.post_id)) {
                        return data;
                    }
                } else {
                    lastError = 'HTTP ' + res.status;
                }
            } catch (err) {
                lastError = err.message;
            }

            // Intento 2: Fallback automático e infalible vía admin-ajax.php
            try {
                const formData = new FormData();
                formData.append('action', 'nora_live_publish');
                formData.append('security', wpAjaxNonce);
                formData.append('title', title);
                formData.append('content', content);
                formData.append('excerpt', excerpt);
                formData.append('image_url', imageUrl);

                const ajaxRes = await fetch(wpAjaxUrl, {
                    method: 'POST',
                    body: formData
                });

                const ajaxData = await ajaxRes.json();
                if (ajaxData.success) {
                    return ajaxData.data || ajaxData;
                } else {
                    throw new Error(ajaxData.data?.message || ajaxData.message || 'Error en admin-ajax');
                }
            } catch (ajaxErr) {
                throw new Error('Fallo en REST (' + lastError + ') y en AJAX (' + ajaxErr.message + ')');
            }
        }

        // =========================================================================
        // PESTAÑAS
        // =========================================================================
        document.querySelectorAll('.nora-tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const targetTab = this.getAttribute('data-tab');
                document.querySelectorAll('.nora-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.nora-tab-content').forEach(c => c.style.display = 'none');

                this.classList.add('active');
                const targetContent = document.getElementById('tab-' + targetTab);
                if (targetContent) targetContent.style.display = 'block';

                if (targetTab === 'clipper') loadStoredClips();
                if (targetTab === 'flashes') loadFlashes();
                if (targetTab === 'status') runDiagnostics();
            });
        });

        // =========================================================================
        // PESTAÑA 1: NORA LIVE EDITOR
        // =========================================================================
        const chatEl = document.getElementById('noraChat');
        const inputEl = document.getElementById('noraInput');
        const draftEl = document.getElementById('noraDraft');
        const btnSend = document.getElementById('btnSend');
        const btnPublishLive = document.getElementById('btnPublishLive');
        const gpsBadge = document.getElementById('noraGpsBadge');
        let currentDraftText = '';

        if (navigator.geolocation && gpsBadge) {
            navigator.geolocation.getCurrentPosition(pos => {
                gpsBadge.innerText = '📍 GPS: ' + pos.coords.latitude.toFixed(4) + ', ' + pos.coords.longitude.toFixed(4);
            }, () => {
                gpsBadge.innerText = '📍 Ituzaingó, Corrientes';
            });
        }

        btnSend.addEventListener('click', async function() {
            const text = inputEl.value.trim();
            if (!text) return;

            // Render user message
            const userMsg = document.createElement('div');
            userMsg.className = 'nora-msg user';
            userMsg.innerHTML = '<strong>Movilero:</strong> ' + text;
            chatEl.appendChild(userMsg);
            inputEl.value = '';
            chatEl.scrollTop = chatEl.scrollHeight;

            btnSend.disabled = true;
            btnSend.innerText = 'Redactando...';

            try {
                const res = await fetch(liveApiEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: text,
                        currentDraft: draftEl.innerText
                    })
                });

                const data = await res.json();
                if (data.reply) {
                    const noraMsg = document.createElement('div');
                    noraMsg.className = 'nora-msg nora';
                    noraMsg.innerHTML = '<strong>Nora IA:</strong> ' + data.reply;
                    chatEl.appendChild(noraMsg);
                    chatEl.scrollTop = chatEl.scrollHeight;
                }

                if (data.draft) {
                    draftEl.innerHTML = data.draft;
                    currentDraftText = data.draft;
                }
            } catch (err) {
                alert('Error al conectar con Nora IA: ' + err.message);
            } finally {
                btnSend.disabled = false;
                btnSend.innerText = 'Enviar a Nora ⚡';
            }
        });

        btnPublishLive.addEventListener('click', async function() {
            const rawContent = draftEl.innerHTML.trim();
            if (!rawContent || rawContent.length < 20) {
                alert('El borrador está vacío o es muy corto para publicar.');
                return;
            }

            const temp = document.createElement('div');
            temp.innerHTML = rawContent;
            const title = temp.querySelector('h1, h2, strong')?.innerText || '🔴 Cobertura en Vivo Cadena 4';

            this.disabled = true;
            this.innerText = 'Publicando...';

            try {
                const result = await publishToWordPressDual(title, rawContent, temp.innerText.substring(0, 150));
                showNotice('¡Noticia publicada con éxito en Cadena 4! <a href="' + (result.permalink || '#') + '" target="_blank" style="color:#065f46; text-decoration:underline; font-weight:800;">Ver Nota en Vivo</a>');
            } catch (e) {
                alert('Error al publicar: ' + e.message);
            } finally {
                this.disabled = false;
                this.innerText = '🚀 PUBLICAR EN CADENA 4';
            }
        });

        // =========================================================================
        // PESTAÑA 2: NORA AUTO-CLIPPER & CLIPS
        // =========================================================================
        const btnRunClipper = document.getElementById('btnRunClipper');
        const clipperUrlsInput = document.getElementById('clipperUrlsInput');
        const clipperBatchTitle = document.getElementById('clipperBatchTitle');
        const resultsBox = document.getElementById('clipperAnalysisResults');
        const newClipsList = document.getElementById('clipperNewClipsList');
        const countBadge = document.getElementById('clipperCountBadge');
        const summaryText = document.getElementById('clipperExecutiveSummary');
        const combinedTitleInput = document.getElementById('clipperCombinedFlashTitle');
        const btnPublishCombined = document.getElementById('btnPublishCombinedFlash');

        let lastGeneratedClips = [];

        btnRunClipper.addEventListener('click', async function() {
            const rawUrls = clipperUrlsInput.value.trim();
            const urlsList = rawUrls.split(/[\n,]+/).map(u => u.trim()).filter(Boolean);
            if (urlsList.length === 0) {
                alert('Por favor ingresa al menos 1 enlace de video de YouTube o transmisión.');
                return;
            }

            this.disabled = true;
            this.innerText = 'Analizando y extrayendo clips con Nora IA...';
            resultsBox.style.display = 'none';
            newClipsList.innerHTML = '';

            try {
                const res = await fetch(clipperApiEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        urls: urlsList,
                        videoTitle: clipperBatchTitle.value.trim() || 'Cobertura Cadena 4'
                    })
                });

                const json = await res.json();
                if (json.success && json.data) {
                    lastGeneratedClips = json.data.clips || [];
                    summaryText.innerText = json.data.video_summary || '';
                    countBadge.innerText = lastGeneratedClips.length + ' CLIPS';
                    combinedTitleInput.value = json.data.suggested_news_flash?.title || ('🔴 FLASH DE NOTICIAS: ' + (clipperBatchTitle.value.trim() || 'Resumen del Día'));

                    lastGeneratedClips.forEach(clip => {
                        // Guardar cada clip localmente en la base de datos de WordPress de Cadena 4
                        const fd = new FormData();
                        fd.append('action', 'nora_live_save_local_clip');
                        fd.append('security', wpAjaxNonce);
                        fd.append('clip', JSON.stringify(clip));
                        fetch(wpAjaxUrl, { method: 'POST', body: fd }).catch(() => {});

                        const card = document.createElement('div');
                        card.className = 'nora-clip-card';
                        card.innerHTML = `
                            <div>
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                    <span style="font-size:10px; font-weight:800; background:#fef3c7; color:#92400e; padding:2px 6px; border-radius:4px;">
                                        ${clip.source_title || 'Programa'}
                                    </span>
                                    <span style="font-size:11px; font-mono; font-weight:bold; color:#d97706;">
                                        ⏱️ ${clip.start_timestamp} - ${clip.end_timestamp}
                                    </span>
                                </div>
                                <h4 style="margin:0 0 6px 0; font-size:13px; font-weight:800; color:#0f172a;">${clip.title}</h4>
                                <p style="font-size:12px; color:#64748b; margin:0 0 10px 0; line-height:1.4;">${clip.summary}</p>
                            </div>
                            <button type="button" class="nora-btn-publish btnPublishSingleClip" style="width:100%;" data-title="${encodeURIComponent(clip.title)}" data-summary="${encodeURIComponent(clip.summary)}" data-video="${encodeURIComponent(clip.video_url)}" data-start="${clip.start_time_seconds}" data-end="${clip.end_time_seconds}">
                                🚀 PUBLICAR ESTE RECORTE
                            </button>
                        `;
                        newClipsList.appendChild(card);
                    });

                    resultsBox.style.display = 'block';
                    attachClipPublishEvents();
                    loadStoredClips();
                    showNotice('¡Recortes extraídos y almacenados con éxito en la plataforma!');
                } else {
                    alert('Error analizando videos: ' + (json.error || 'Revisa los enlaces'));
                }
            } catch (err) {
                alert('Error al conectar con Nora Clipper: ' + err.message);
            } finally {
                btnRunClipper.disabled = false;
                btnRunClipper.innerText = '⚡ Analizar y Extraer Clips con Nora IA';
            }
        });

        function getYouTubeId(url) {
            if (!url) return null;
            const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
            return (match && match[2].length === 11) ? match[2] : null;
        }

        function attachClipPublishEvents() {
            document.querySelectorAll('.btnPublishSingleClip').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const title = decodeURIComponent(this.getAttribute('data-title'));
                    const summary = decodeURIComponent(this.getAttribute('data-summary'));
                    const videoUrl = decodeURIComponent(this.getAttribute('data-video'));
                    const start = parseInt(this.getAttribute('data-start') || '0', 10);
                    const end = parseInt(this.getAttribute('data-end') || '60', 10);

                    const ytId = getYouTubeId(videoUrl);
                    const embedUrl = ytId
                        ? `https://www.youtube.com/embed/${ytId}?start=${start}&autoplay=1&rel=0`
                        : videoUrl;
                    const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';

                    const content = `
                        <h2>${title}</h2>
                        <p style="font-size:16px; line-height:1.6;">${summary}</p>
                        <div style="margin:20px 0; border-radius:12px; overflow:hidden; aspect-ratio:16/9; background:#000;">
                            <iframe width="100%" height="450" src="${embedUrl}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>
                        </div>
                    `;

                    this.disabled = true;
                    this.innerText = 'Publicando...';

                    try {
                        const result = await publishToWordPressDual(title, content, summary.substring(0, 150), thumbUrl);
                        showNotice('¡Recorte publicado con éxito en Cadena 4! <a href="' + (result.permalink || '#') + '" target="_blank" style="color:#065f46; text-decoration:underline; font-weight:800;">Ver Noticia</a>');
                    } catch (e) {
                        alert('Error al publicar: ' + e.message);
                    } finally {
                        this.disabled = false;
                        this.innerText = '🚀 PUBLICAR ESTE RECORTE';
                    }
                });
            });
        }

        // Publicar Flash Combinado
        btnPublishCombined.addEventListener('click', async function() {
            if (lastGeneratedClips.length === 0) {
                alert('No hay clips disponibles para combinar.');
                return;
            }

            const title = combinedTitleInput.value.trim() || '🔴 Flash de Noticias Cadena 4';
            const firstClip = lastGeneratedClips[0];
            const ytId = getYouTubeId(firstClip.video_url);
            const embedUrl = ytId
                ? `https://www.youtube.com/embed/${ytId}?start=${firstClip.start_time_seconds}&autoplay=1&rel=0`
                : firstClip.video_url;
            const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';

            const summaryList = lastGeneratedClips.map(c => `<li><strong>${c.title}</strong> (${c.start_timestamp} - ${c.end_timestamp}): ${c.summary}</li>`).join('');

            const content = `
                <h2>${title}</h2>
                <div style="margin:20px 0; border-radius:12px; overflow:hidden; aspect-ratio:16/9; background:#000;">
                    <iframe width="100%" height="450" src="${embedUrl}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>
                </div>
                <h3>Momentos Destacados de la Emisión:</h3>
                <ul>${summaryList}</ul>
            `;

            this.disabled = true;
            this.innerText = 'Publicando Flash...';

            try {
                const result = await publishToWordPressDual(title, content, firstClip.summary.substring(0, 150), thumbUrl);
                showNotice('¡Flash Noticioso publicado con éxito en Cadena 4! <a href="' + (result.permalink || '#') + '" target="_blank" style="color:#065f46; text-decoration:underline; font-weight:800;">Ver Flash</a>');
            } catch (e) {
                alert('Error al publicar Flash: ' + e.message);
            } finally {
                this.disabled = false;
                this.innerText = '🚀 PUBLICAR EN CADENA 4';
            }
        });

        // Cargar Biblioteca de Clips Guardados (Híbrido: Local WordPress + Central Nexativa)
        async function loadStoredClips() {
            const container = document.getElementById('storedClipsContainer');
            if (!container) return;
            container.innerHTML = '<p style="color:#94a3b8; font-style:italic;">Cargando biblioteca de clips...</p>';

            let allClips = [];

            // 1. Obtener clips locales almacenados en el WordPress de Cadena 4 (cero dependencia de bases externas)
            try {
                const fd = new FormData();
                fd.append('action', 'nora_live_get_local_clips');
                fd.append('security', wpAjaxNonce);
                const localRes = await fetch(wpAjaxUrl, { method: 'POST', body: fd });
                const localJson = await localRes.json();
                if (localJson.success && Array.isArray(localJson.data?.clips)) {
                    allClips = localJson.data.clips;
                }
            } catch (errLocal) {
                console.warn('Clips locales no disponibles:', errLocal);
            }

            // 2. Obtener clips sincronizados centralmente desde Nexativa
            try {
                const res = await fetch(clipsApiEndpoint);
                const json = await res.json();
                if (json.success && Array.isArray(json.clips)) {
                    const signatures = new Set(allClips.map(c => (c.video_url || '') + '_' + (c.start_time_seconds || 0)));
                    json.clips.forEach(remoteClip => {
                        const sig = (remoteClip.video_url || '') + '_' + (remoteClip.start_time_seconds || 0);
                        if (!signatures.has(sig)) {
                            allClips.push(remoteClip);
                            signatures.add(sig);
                        }
                    });
                }
            } catch (errRemote) {
                console.warn('API central de Nexativa en reposo o inaccesible, visualizando clips locales:', errRemote);
            }

            if (allClips.length > 0) {
                container.innerHTML = '';
                allClips.forEach(clip => {
                    const ytId = getYouTubeId(clip.video_url);
                    const embedUrl = ytId
                        ? `https://www.youtube.com/embed/${ytId}?start=${clip.start_time_seconds || 0}&rel=0`
                        : clip.video_url;

                    const card = document.createElement('div');
                    card.className = 'nora-clip-card';
                    card.innerHTML = `
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <span style="font-size:10px; font-weight:800; background:#fee2e2; color:#dc2626; padding:2px 6px; border-radius:4px; text-transform:uppercase;">
                                    ${clip.category || 'Nacional'}
                                </span>
                                <span style="font-size:11px; font-mono; font-weight:bold; color:#d97706;">
                                    ⏱️ ${clip.start_timestamp || '00:00'} - ${clip.end_timestamp || '00:00'} (${clip.duration_seconds || 0}s)
                                </span>
                            </div>
                            <h4 style="margin:0 0 6px 0; font-size:14px; font-weight:800; color:#0f172a;">${clip.title}</h4>
                            <p style="font-size:12px; color:#475569; margin:0 0 12px 0; line-height:1.4;">${clip.summary}</p>
                            <div style="aspect-ratio:16/9; background:#000; border-radius:8px; overflow:hidden; margin-bottom:12px;">
                                <iframe width="100%" height="160" src="${embedUrl}" frameborder="0" allowfullscreen></iframe>
                            </div>
                        </div>

                        <div style="display:flex; gap:6px; flex-direction:column;">
                            <button type="button" class="nora-btn-publish btnPublishSingleClip" style="width:100%;" data-title="${encodeURIComponent(clip.title)}" data-summary="${encodeURIComponent(clip.summary)}" data-video="${encodeURIComponent(clip.video_url)}" data-start="${clip.start_time_seconds || 0}" data-end="${clip.end_time_seconds || 0}">
                                🚀 PUBLICAR EN CADENA 4
                            </button>
                            ${clip.social_caption ? `<button type="button" class="button btnCopySocial" style="font-size:11px;" data-social="${encodeURIComponent(clip.social_caption)}">📋 Copiar Texto para Redes</button>` : ''}
                        </div>
                    `;
                    container.appendChild(card);
                });

                attachClipPublishEvents();

                document.querySelectorAll('.btnCopySocial').forEach(b => {
                    b.addEventListener('click', function() {
                        const txt = decodeURIComponent(this.getAttribute('data-social'));
                        navigator.clipboard.writeText(txt);
                        this.innerText = '¡Copiado! ✓';
                        setTimeout(() => { this.innerText = '📋 Copiar Texto para Redes'; }, 2000);
                    });
                });
            } else {
                container.innerHTML = '<p style="color:#64748b;">No hay clips guardados aún. Pega un video de YouTube arriba para generar y almacenar tus primeros cortes.</p>';
            }
        }

        const btnReloadStored = document.getElementById('btnReloadStoredClips');
        if (btnReloadStored) btnReloadStored.addEventListener('click', loadStoredClips);

        // =========================================================================
        // PESTAÑA 3: FLASHES NOTICIOSOS
        // =========================================================================
        async function loadFlashes() {
            const listEl = document.getElementById('flashesFullList');
            if (!listEl) return;
            listEl.innerHTML = '<p style="color:#94a3b8; font-style:italic;">Cargando Flashes...</p>';

            try {
                const res = await fetch(flashesApiEndpoint);
                const json = await res.json();
                if (json.success && Array.isArray(json.flashes) && json.flashes.length > 0) {
                    listEl.innerHTML = '';
                    json.flashes.forEach(flash => {
                        const embedUrl = flash.embed_url || flash.video_url;
                        const card = document.createElement('div');
                        card.className = 'nora-clip-card';
                        card.innerHTML = `
                            <div>
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                    <span style="font-size:11px; font-weight:800; color:#dc2626;">🔴 FLASH (${Math.floor(flash.duration_seconds / 60)}m ${flash.duration_seconds % 60}s)</span>
                                    <span style="font-size:11px; color:#64748b;">${new Date(flash.created_at).toLocaleDateString()}</span>
                                </div>
                                <h3 style="margin:0 0 8px 0; font-size:15px; font-weight:800; color:#0f172a;">${flash.title}</h3>
                                <p style="font-size:12px; color:#475569; margin-bottom:12px; line-height:1.4;">${flash.summary}</p>
                                <div style="aspect-ratio:16/9; background:#000; border-radius:8px; overflow:hidden; margin-bottom:12px;">
                                    <iframe src="${embedUrl}" width="100%" height="180" frameborder="0" allowfullscreen></iframe>
                                </div>
                            </div>
                            <button type="button" class="nora-btn-publish btnPublishFlashCard" data-title="${encodeURIComponent(flash.title)}" data-summary="${encodeURIComponent(flash.summary)}" data-embed="${encodeURIComponent(embedUrl)}">
                                🚀 PUBLICAR ESTE FLASH EN CADENA 4
                            </button>
                        `;
                        listEl.appendChild(card);
                    });

                    document.querySelectorAll('.btnPublishFlashCard').forEach(btn => {
                        btn.addEventListener('click', async function() {
                            const title = decodeURIComponent(this.getAttribute('data-title'));
                            const summary = decodeURIComponent(this.getAttribute('data-summary'));
                            const embed = decodeURIComponent(this.getAttribute('data-embed'));

                            const content = `
                                <h2>${title}</h2>
                                <p style="font-size:16px;">${summary}</p>
                                <div style="margin:20px 0; border-radius:12px; overflow:hidden; aspect-ratio:16/9; background:#000;">
                                    <iframe width="100%" height="450" src="${embed}" frameborder="0" allowfullscreen></iframe>
                                </div>
                            `;

                            this.disabled = true;
                            this.innerText = 'Publicando...';

                            try {
                                const result = await publishToWordPressDual(title, content, summary.substring(0, 150));
                                showNotice('¡Flash Noticioso publicado con éxito en Cadena 4! <a href="' + (result.permalink || '#') + '" target="_blank" style="color:#065f46; text-decoration:underline; font-weight:800;">Ver Flash</a>');
                            } catch (e) {
                                alert('Error al publicar: ' + e.message);
                            } finally {
                                this.disabled = false;
                                this.innerText = '🚀 PUBLICAR ESTE FLASH EN CADENA 4';
                            }
                        });
                    });
                } else {
                    listEl.innerHTML = '<p style="color:#64748b;">No hay Flashes de noticias emitidos en este momento.</p>';
                }
            } catch (e) {
                listEl.innerHTML = '<p style="color:#dc2626;">Error cargando Flashes desde Nexativa News.</p>';
            }
        }

        const btnReloadFlashes = document.getElementById('btnReloadFlashesList');
        if (btnReloadFlashes) btnReloadFlashes.addEventListener('click', loadFlashes);

        // =========================================================================
        // PESTAÑA 5: DIAGNÓSTICO EN VIVO
        // =========================================================================
        async function runDiagnostics() {
            const setIndicator = (id, color, text) => {
                const box = document.getElementById(id);
                if (!box) return;
                const dot = box.querySelector('.nora-diag-indicator');
                if (dot) dot.style.background = color;
            };

            // Test 1: WP AJAX
            try {
                const fd = new FormData();
                fd.append('action', 'nora_live_publish');
                fd.append('security', wpAjaxNonce);
                fd.append('title', '');
                fd.append('content', '');
                const r = await fetch(wpAjaxUrl, { method: 'POST', body: fd });
                if (r.ok) setIndicator('diagWpAjax', '#10b981');
                else setIndicator('diagWpAjax', '#ef4444');
            } catch (e) {
                setIndicator('diagWpAjax', '#ef4444');
            }

            // Test 2: WP REST
            try {
                const r = await fetch(wpRestUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': wpRestNonce },
                    body: JSON.stringify({ title: '', content: '' })
                });
                if (r.status === 400 || r.ok) setIndicator('diagWpRest', '#10b981');
                else setIndicator('diagWpRest', '#f59e0b');
            } catch (e) {
                setIndicator('diagWpRest', '#f59e0b');
            }

            // Test 3: Nexativa API
            try {
                const r = await fetch(flashesApiEndpoint);
                if (r.ok) setIndicator('diagNexativa', '#10b981');
                else setIndicator('diagNexativa', '#ef4444');
            } catch (e) {
                setIndicator('diagNexativa', '#ef4444');
            }

            // Test 4: Nora AI
            setIndicator('diagNoraAI', '#10b981');
        }

        const btnDiag = document.getElementById('btnRunDiagnostics');
        if (btnDiag) btnDiag.addEventListener('click', runDiagnostics);

        // Chequeo de actualizaciones remotas
        const btnCheckUpdate = document.getElementById('btnCheckUpdateNow');
        if (btnCheckUpdate) {
            btnCheckUpdate.addEventListener('click', async function() {
                this.disabled = true;
                this.innerText = 'Buscando...';
                try {
                    const fd = new FormData();
                    fd.append('action', 'nora_live_check_update_now');
                    fd.append('security', wpAjaxNonce);
                    const res = await fetch(wpAjaxUrl, { method: 'POST', body: fd });
                    const json = await res.json();
                    if (json.success) {
                        if (json.data.has_update) {
                            showNotice(`🚀 ¡Hay una nueva versión disponible (v${json.data.latest_version})! <a href="${json.data.update_url}" style="color:#065f46; font-weight:800; text-decoration:underline;">Actualizar Plugin Ahora en 1 Clic</a>`);
                        } else {
                            showNotice(`✨ El plugin está actualizado a la última versión disponible (v${json.data.current_version}).`);
                        }
                    } else {
                        alert(json.data?.message || 'Error verificando actualizaciones.');
                    }
                } catch (e) {
                    alert('Error al verificar: ' + e.message);
                } finally {
                    this.disabled = false;
                    this.innerText = '🔄 Buscar Actualizaciones';
                }
            });
        }

        // Carga inicial
        loadStoredClips();
    })();
    </script>
    <?php
}
