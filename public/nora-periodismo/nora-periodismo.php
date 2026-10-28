<?php
/**
 * Plugin Name: Nora Periodismo Pro - Cadena 4 & Nexativa
 * Plugin URI: https://cadena4.com.ar
 * Description: Suite completa de periodismo digital con IA: Nora Live Editor, Auto-Clipper Pro, Flashes Noticiosos y Móvil de Exteriores PWA para Cadena 4 y Nexativa News.
 * Version: 2.2.0
 * Author: MyJNexoraVisual & Nexativa News
 * License: GPLv2 or later
 */

if (!defined('ABSPATH')) exit; // Exit if accessed directly

// ==============================================================================
// 1. REGISTRO DE MENÚS Y SUBMENÚS EN EL PANEL DE WORDPRESS
// ==============================================================================
add_action('admin_menu', 'nora_live_register_menus');

function nora_live_register_menus() {
    $slug = dirname(plugin_basename(__FILE__));

    // Menú Principal
    add_menu_page(
        'Nora Periodismo Pro',
        'Nora Periodismo 🔴',
        'edit_posts',
        $slug,
        'nora_live_main_admin_page',
        'dashicons-microphone',
        6
    );

    // Submenús
    add_submenu_page(
        $slug,
        'Nora Live Editor - Coberturas en Tiempo Real',
        '📝 Live Editor',
        'edit_posts',
        $slug,
        'nora_live_main_admin_page'
    );

    add_submenu_page(
        $slug,
        'Nora Auto-Clipper Pro - Segmentador de Video',
        '✂️ Auto-Clipper & Clips',
        'edit_posts',
        $slug . '-clipper',
        'nora_live_clipper_admin_page'
    );

    add_submenu_page(
        $slug,
        'Flashes Noticiosos Sindicados',
        '🔴 Flashes Noticiosos',
        'edit_posts',
        $slug . '-flashes',
        'nora_live_flashes_admin_page'
    );

    add_submenu_page(
        $slug,
        'Nora Móvil Exteriores PWA & Despachos',
        '📱 Móvil & Despachos',
        'edit_posts',
        $slug . '-movil',
        'nora_live_movil_admin_page'
    );
}

// ==============================================================================
// 2. SISTEMA DE AUTO-ACTUALIZACIÓN AUTOMÁTICA REMOTA DESDE NEXATIVA
// ==============================================================================
if (!defined('NORA_LIVE_PLUGIN_VERSION')) {
    define('NORA_LIVE_PLUGIN_VERSION', '2.2.0');
}
if (!defined('NORA_LIVE_PLUGIN_BASENAME')) {
    define('NORA_LIVE_PLUGIN_BASENAME', plugin_basename(__FILE__));
}
if (!defined('NORA_LIVE_PLUGIN_SLUG')) {
    define('NORA_LIVE_PLUGIN_SLUG', dirname(plugin_basename(__FILE__)));
}
if (!defined('NORA_LIVE_UPDATE_URL')) {
    define('NORA_LIVE_UPDATE_URL', 'https://xeheuscrttrbfnojwwqt.supabase.co/storage/v1/object/public/uploads/plugins/update-info.json');
}

// Función de consulta redundante a CDN de alta disponibilidad para auto-actualización (Multi-Tier Infallible Mirrors)
function nora_live_fetch_remote_update_info() {
    $slug = defined('NORA_LIVE_PLUGIN_SLUG') ? NORA_LIVE_PLUGIN_SLUG : 'nora-periodismo';
    $manifest_name = ($slug === 'nora-live-exteriores') ? 'update-info-exteriores.json' : 'update-info.json';

    $endpoints = array(
        // Mirror 1: CDN Edge Supabase (Ultra-rápido, permanente)
        'https://xeheuscrttrbfnojwwqt.supabase.co/storage/v1/object/public/uploads/plugins/' . $manifest_name,
        // Mirror 2: CDN Global GitHub Raw (Fastly Edge Cache, 99.999% SLA)
        'https://raw.githubusercontent.com/palaciomariaitati-byte/Nexativa-News/main/public/' . $manifest_name,
        // Mirror 3: Servidor Dinámico Nexativa News
        'https://www.nexativanews.com.ar/api/plugin-update?slug=' . $slug
    );

    foreach ($endpoints as $url) {
        $response = wp_remote_get($url, array(
            'timeout' => 6,
            'headers' => array(
                'Accept' => 'application/json',
                'User-Agent' => 'NexoraStorePluginUpdater/2.2.0 (WordPress)'
            )
        ));

        if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
            $body = wp_remote_retrieve_body($response);
            $info = json_decode($body, true);
            if ($info && isset($info['version'])) {
                $obj = (object) $info;
                // Si el paquete no tiene URL absoluta, asignar CDN permanente
                if (empty($obj->package) || strpos($obj->package, 'http') !== 0) {
                    $obj->package = 'https://xeheuscrttrbfnojwwqt.supabase.co/storage/v1/object/public/uploads/plugins/' . $slug . '.zip';
                }
                return $obj;
            }
        }
    }
    return false;
}

// Interceptar chequeo de actualizaciones de plugins de WordPress
add_filter('pre_set_site_transient_update_plugins', 'nora_live_check_for_plugin_update');
function nora_live_check_for_plugin_update($transient) {
    if (empty($transient) || !is_object($transient)) {
        return $transient;
    }

    $info = nora_live_fetch_remote_update_info();
    if ($info && isset($info->version) && version_compare(NORA_LIVE_PLUGIN_VERSION, $info->version, '<')) {
        $obj = new stdClass();
        $obj->slug = NORA_LIVE_PLUGIN_SLUG;
        $obj->plugin = NORA_LIVE_PLUGIN_BASENAME;
        $obj->new_version = $info->version;
        $obj->url = $info->homepage ?? 'https://cadena4.com.ar';
        $obj->package = $info->package ?? ('https://xeheuscrttrbfnojwwqt.supabase.co/storage/v1/object/public/uploads/plugins/' . NORA_LIVE_PLUGIN_SLUG . '.zip');
        $obj->tested = $info->tested ?? '6.7';
        $obj->requires_php = $info->requires_php ?? '7.4';

        $transient->response[$obj->plugin] = $obj;
    }
    return $transient;
}

// Modal de información de actualización en el panel de plugins
add_filter('plugins_api', 'nora_live_plugin_info_popup', 20, 3);
function nora_live_plugin_info_popup($res, $action, $args) {
    if ($action !== 'plugin_information' || !isset($args->slug) || ($args->slug !== NORA_LIVE_PLUGIN_SLUG && $args->slug !== 'nora-live-exteriores' && $args->slug !== 'nora-periodismo')) {
        return $res;
    }

    $info = nora_live_fetch_remote_update_info();
    if ($info) {
        $res = $info;
        $res->sections = (array) ($info->sections ?? array());
        return $res;
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

// Endpoint AJAX para chequear actualización en 1 clic
add_action('wp_ajax_nora_live_check_update_now', 'nora_live_ajax_check_update_now');
function nora_live_ajax_check_update_now() {
    check_ajax_referer('nora_live_nonce_action', 'security');
    delete_site_transient('update_plugins');

    $info = nora_live_fetch_remote_update_info();
    if (!$info || !isset($info->version)) {
        wp_send_json_error(array(
            'message' => 'Los servidores de actualización no respondieron en este momento. La radio y la suite continúan activas sin interrupción.'
        ));
    }

    $has_update = version_compare(NORA_LIVE_PLUGIN_VERSION, $info->version, '<');
    $update_url = wp_nonce_url(
        self_admin_url('update.php?action=upgrade-plugin&plugin=' . urlencode(NORA_LIVE_PLUGIN_BASENAME)),
        'upgrade-plugin_' . NORA_LIVE_PLUGIN_BASENAME
    );

    $changelog = '';
    if (isset($info->sections)) {
        if (is_array($info->sections) && isset($info->sections['changelog'])) {
            $changelog = $info->sections['changelog'];
        } elseif (is_object($info->sections) && isset($info->sections->changelog)) {
            $changelog = $info->sections->changelog;
        }
    }

    wp_send_json_success(array(
        'current_version' => NORA_LIVE_PLUGIN_VERSION,
        'latest_version'  => $info->version,
        'has_update'      => $has_update,
        'update_url'      => $update_url,
        'package_url'     => $info->package ?? '',
        'changelog'       => $changelog
    ));
}

// Endpoint AJAX para ejecutar la actualización en 1 clic sin salir del panel
add_action('wp_ajax_nora_live_apply_update_now', 'nora_live_ajax_apply_update_now');
function nora_live_ajax_apply_update_now() {
    check_ajax_referer('nora_live_nonce_action', 'security');
    if (!current_user_can('update_plugins')) {
        wp_send_json_error(array('message' => 'Permisos insuficientes para actualizar plugins.'));
    }

    $info = nora_live_fetch_remote_update_info();
    if (!$info || !isset($info->version)) {
        wp_send_json_error(array('message' => 'No se pudo obtener el paquete de actualización de la CDN.'));
    }

    // Incluir clases requeridas de WordPress
    require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
    require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/plugin.php';

    // Instanciar el actualizador silencioso
    $skin = new Automatic_Upgrader_Skin();
    $upgrader = new Plugin_Upgrader($skin);

    // Limpiar transients para forzar lectura de la nueva versión
    delete_site_transient('update_plugins');

    // Iniciar actualización
    $result = $upgrader->upgrade(NORA_LIVE_PLUGIN_BASENAME);

    if (is_wp_error($result)) {
        wp_send_json_error(array('message' => $result->get_error_message()));
    }

    if ($result) {
        // Asegurar reactivación del plugin tras la sobrescritura
        activate_plugin(NORA_LIVE_PLUGIN_BASENAME);
        wp_send_json_success(array(
            'message' => '¡Plugin actualizado y reactivado con éxito a la versión v' . $info->version . '!',
            'new_version' => $info->version
        ));
    } else {
        // Si el sistema de archivos requería credenciales directas, enviar URL estándar
        $update_url = wp_nonce_url(
            self_admin_url('update.php?action=upgrade-plugin&plugin=' . urlencode(NORA_LIVE_PLUGIN_BASENAME)),
            'upgrade-plugin_' . NORA_LIVE_PLUGIN_BASENAME
        );
        wp_send_json_success(array('redirect' => $update_url));
    }
}

// ==============================================================================
// 3. MOTOR DE PUBLICACIÓN DUAL: REST API + ADMIN-AJAX (ALTA DISPONIBILIDAD)
// ==============================================================================

// Función central de inserción de posts (compartida por REST y AJAX)
function nora_live_insert_post_core($title, $content, $excerpt = '', $image_url = '') {
    $title = sanitize_text_field(!empty($title) ? $title : '🔴 Cobertura en Vivo Cadena 4');
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
    $allowed_html['img'] = array(
        'src'    => true,
        'alt'    => true,
        'width'  => true,
        'height' => true,
        'style'  => true,
        'class'  => true,
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

    // Sideload de imagen destacada (URL o Base64)
    if (!empty($image_url)) {
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');

        if (filter_var($image_url, FILTER_VALIDATE_URL)) {
            $tmp = download_url($image_url, 15);
            if (!is_wp_error($tmp)) {
                $file_array = array(
                    'name'     => sanitize_title($title) . '-' . time() . '.jpg',
                    'tmp_name' => $tmp
                );
                $attachment_id = media_handle_sideload($file_array, $post_id, $title);
                if (!is_wp_error($attachment_id)) {
                    set_post_thumbnail($post_id, $attachment_id);
                }
                @unlink($tmp);
            }
        } elseif (strpos($image_url, 'data:image') === 0) {
            $parts = explode(',', $image_url);
            if (count($parts) === 2) {
                $data = base64_decode($parts[1]);
                $filename = sanitize_title($title) . '-' . time() . '.jpg';
                $upload = wp_upload_bits($filename, null, $data);
                if (empty($upload['error'])) {
                    $attachment = array(
                        'post_mime_type' => $upload['type'],
                        'post_title'     => $title,
                        'post_content'   => '',
                        'post_status'    => 'inherit'
                    );
                    $attach_id = wp_insert_attachment($attachment, $upload['file'], $post_id);
                    $attach_data = wp_generate_attachment_metadata($attach_id, $upload['file']);
                    wp_update_attachment_metadata($attach_id, $attach_data);
                    set_post_thumbnail($post_id, $attach_id);
                }
            }
        }
    }

    return array(
        'success'   => true,
        'post_id'   => $post_id,
        'permalink' => get_permalink($post_id),
        'title'     => $title
    );
}

// 3.A: Endpoint REST API (/wp-json/nora-live/v1/publish)
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

// 3.B: Endpoint Fallback admin-ajax.php (action: nora_live_publish)
add_action('wp_ajax_nora_live_publish', 'nora_live_ajax_publish_handler');

function nora_live_ajax_publish_handler() {
    check_ajax_referer('nora_live_nonce_action', 'security');

    if (!current_user_can('edit_posts') && !current_user_can('publish_posts')) {
        wp_send_json_error(array('message' => 'Permisos insuficientes para publicar en WordPress.'));
    }

    $title = isset($_POST['title']) ? wp_unslash($_POST['title']) : '';
    $content = isset($_POST['content']) ? wp_unslash($_POST['content']) : '';
    $excerpt = isset($_POST['excerpt']) ? wp_unslash($_POST['excerpt']) : '';
    $image_url = isset($_POST['image_url']) ? wp_unslash($_POST['image_url']) : '';

    $res = nora_live_insert_post_core($title, $content, $excerpt, $image_url);
    if (is_wp_error($res)) {
        wp_send_json_error(array('message' => $res->get_error_message()));
    } else {
        wp_send_json_success($res);
    }
}

// 3.C: Almacenamiento local de clips en WordPress (wp_options) - 100% independiente de bases de datos externas
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
// 4. PÁGINAS DE ADMINISTRACIÓN
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
    if (function_exists('wp_enqueue_media')) {
        wp_enqueue_media();
    }

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
                    <span style="width:8px; height:8px; border-radius:50%; background:#10b981; box-shadow:0 0 8px #10b981;"></span>
                    Nora Engine Online v<?php echo NORA_LIVE_PLUGIN_VERSION; ?>
                </div>
                <div style="margin-top:6px; display:flex; gap:8px; justify-content:flex-end;">
                    <button type="button" id="btnCheckUpdateNow" class="button button-small" style="background:#1e293b; color:#38bdf8; border:1px solid #334155; font-size:11px; font-weight:700; cursor:pointer;">
                        🔄 Buscar Actualizaciones
                    </button>
                    <a href="<?php echo esc_url($nexativa_url); ?>" target="_blank" style="color:#94a3b8; font-size:11px; text-decoration:none; padding-top:4px;">
                        Visitar Nexativa News ↗
                    </a>
                </div>
            </div>
        </div>

        <!-- Barra de Navegación de Pestañas -->
        <div class="nora-tabs" style="display:flex; gap:8px; border-bottom:2px solid #e2e8f0; margin-bottom:20px; padding-bottom:2px; flex-wrap:wrap;">
            <button type="button" class="nora-tab-btn <?php echo $initial_tab === 'live' ? 'active' : ''; ?>" data-tab="live">
                📝 Nora Live Editor
            </button>
            <button type="button" class="nora-tab-btn <?php echo $initial_tab === 'clipper' ? 'active' : ''; ?>" data-tab="clipper">
                ✂️ Auto-Clipper & Biblioteca
            </button>
            <button type="button" class="nora-tab-btn <?php echo $initial_tab === 'flashes' ? 'active' : ''; ?>" data-tab="flashes">
                🔴 Flashes Noticiosos (1-5 min)
            </button>
            <button type="button" class="nora-tab-btn <?php echo $initial_tab === 'movil' ? 'active' : ''; ?>" data-tab="movil">
                📱 Móvil Exteriores & Despachos
            </button>
            <button type="button" class="nora-tab-btn" data-tab="status" style="margin-left:auto;">
                ⚙️ Estado & Cables
            </button>
        </div>

        <!-- Notificaciones Dinámicas -->
        <div id="noraNotice" style="display:none; padding:12px 16px; border-radius:10px; margin-bottom:16px; font-weight:700; font-size:13px;"></div>

        <!-- ========================================================================= -->
        <!-- PESTAÑA 1: NORA LIVE EDITOR                                               -->
        <!-- ========================================================================= -->
        <div id="tab-live" class="nora-tab-content" style="<?php echo $initial_tab === 'live' ? '' : 'display:none;'; ?>">
            <div style="display:grid; grid-template-columns:1fr 1.2fr; gap:20px;">
                <!-- Chat y Entrada de Datos -->
                <div class="nora-card">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:16px;">
                        <h2 style="font-size:16px; font-weight:800; margin:0; display:flex; align-items:center; gap:8px;">
                            <span>🎙️</span> Móvil en Vivo / Redacción
                        </h2>
                        <span id="noraGpsBadge" style="font-size:11px; font-mono; background:#f1f5f9; padding:2px 8px; border-radius:6px; color:#64748b;">
                            📍 GPS: Conectando...
                        </span>
                    </div>

                    <div id="noraChat" style="height:320px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:8px; padding:12px; background:#f8fafc; margin-bottom:12px; display:flex; flex-direction:column; gap:8px;">
                        <div class="nora-msg nora">
                            <strong>Nora IA:</strong> ¡Hola equipo de Cadena 4! Estoy lista para procesar la cobertura de exteriores. Puedes adjuntar fotos de la calle, audios o textos, y redactaré el borrador al instante con foto destacada para tu diario.
                        </div>
                    </div>

                    <!-- Vista previa de imagen seleccionada -->
                    <div id="imagePreviewContainer" style="display:none; align-items:center; gap:10px; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:8px; padding:6px 10px; margin-bottom:8px;">
                        <img id="imagePreviewImg" style="width:48px; height:48px; object-fit:cover; border-radius:6px; border:1px solid #94a3b8;" alt="Preview" />
                        <div style="flex:1; overflow:hidden;">
                            <span id="imagePreviewName" style="font-size:12px; font-weight:700; color:#0f172a; display:block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;"></span>
                            <span style="font-size:11px; color:#10b981; font-weight:600;">✓ Imagen cargada para enviar a Nora e ilustrar la nota</span>
                        </div>
                        <button type="button" id="btnRemoveImage" style="background:#fee2e2; border:1px solid #fecaca; color:#dc2626; border-radius:6px; font-weight:700; font-size:11px; padding:4px 8px; cursor:pointer;">
                            ✖ Quitar
                        </button>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <textarea id="noraInput" rows="3" placeholder="Escribe aquí los datos sueltos, testimonios o novedades..." style="width:100%; border:1px solid #cbd5e1; border-radius:8px; padding:10px; font-size:13px; resize:vertical;"></textarea>

                        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                            <label class="button" style="display:inline-flex; align-items:center; gap:4px; cursor:pointer; font-weight:700; background:#f8fafc;">
                                📷 Subir Foto <input type="file" id="noraImage" accept="image/*" style="display:none;" />
                            </label>
                            <button type="button" id="btnAudioRec" class="button" style="display:inline-flex; align-items:center; gap:4px;">
                                🎙️ Grabar Audio
                            </button>
                            <button type="button" id="btnSend" class="button button-primary" style="margin-left:auto; background:#dc2626; border-color:#dc2626; font-weight:800; padding:6px 18px;">
                                Enviar a Nora ⚡
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Borrador y Publicación -->
                <div class="nora-card">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:12px;">
                        <h2 style="font-size:16px; font-weight:800; margin:0;">
                            📝 Borrador Periodístico en Desarrollo
                        </h2>
                        <div style="display:flex; gap:6px;">
                            <button type="button" id="btnPublishLive" class="nora-btn-publish" style="background:#dc2626; font-size:12px;">
                                🚀 PUBLICAR EN CADENA 4
                            </button>
                        </div>
                    </div>

                    <div id="noraDraft" contenteditable="true" style="min-height:380px; max-height:480px; overflow-y:auto; border:1px solid #cbd5e1; border-radius:8px; padding:16px; background:#fff; font-size:14px; line-height:1.7;">
                        <p style="color:#94a3b8; font-style:italic;">
                            El borrador estructurado por Nora aparecerá aquí a medida que envíes testimonios, fotos o datos...
                        </p>
                    </div>

                    <p style="font-size:11px; color:#64748b; margin-top:8px;">
                        💡 Puedes editar directamente el texto del borrador antes de publicarlo. Se publicará como noticia con foto destacada en Cadena 4.
                    </p>
                </div>
            </div>
        </div>

        <!-- ========================================================================= -->
        <!-- PESTAÑA 2: NORA AUTO-CLIPPER PRO & BIBLIOTECA DE CLIPS                   -->
        <!-- ========================================================================= -->
        <div id="tab-clipper" class="nora-tab-content" style="<?php echo $initial_tab === 'clipper' ? '' : 'display:none;'; ?>">
            <!-- Generador de Nuevos Recortes -->
            <div class="nora-card" style="margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:16px;">
                    <div>
                        <h2 style="font-size:17px; font-weight:800; margin:0; color:#0f172a; display:flex; align-items:center; gap:8px;">
                            <span>✂️</span> Nora Auto-Clipper Pro — Segmentar Transmisiones de YouTube
                        </h2>
                        <p style="font-size:12px; color:#64748b; margin:2px 0 0 0;">
                            Pega el enlace de una transmisión o video de YouTube de tu portal. Nora segmentará automáticamente los mejores momentos informativos.
                        </p>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <div>
                        <label style="display:block; font-size:12px; font-weight:700; margin-bottom:4px; color:#334155;">
                            Enlace de YouTube (o múltiples enlaces, uno por línea):
                        </label>
                        <textarea id="clipperUrls" rows="3" placeholder="https://www.youtube.com/watch?v=..." style="width:100%; border:1px solid #cbd5e1; border-radius:8px; padding:10px; font-size:12px; font-mono;"></textarea>
                    </div>
                    <div>
                        <label style="display:block; font-size:12px; font-weight:700; margin-bottom:4px; color:#334155;">
                            Título del Programa o Transmisión:
                        </label>
                        <input type="text" id="clipperBatchTitle" placeholder="Ej: Noticiero Central Cadena 4" style="width:100%; border:1px solid #cbd5e1; border-radius:8px; padding:10px; font-size:12px;" />

                        <button type="button" id="btnRunClipper" class="button button-primary" style="background:#dc2626; border-color:#dc2626; font-weight:800; padding:10px 16px; font-size:13px; width:100%; margin-top:12px;">
                            ⚡ Analizar y Segmentar Momentos Clave
                        </button>
                    </div>
                </div>

                <!-- Resultados del Análisis Reciente -->
                <div id="clipperResults" style="display:none; margin-top:20px; border-top:1px solid #e2e8f0; padding-top:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <h3 style="font-size:15px; font-weight:800; margin:0;">
                            🎬 Momentos Noticiosos Detectados (<span id="clipsCountBadge">0</span>)
                        </h3>
                        <span id="clipperSummary" style="font-size:12px; color:#64748b;"></span>
                    </div>

                    <!-- Botón para Publicar Flash Combinado -->
                    <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:10px; padding:12px 16px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; gap:12px;">
                        <div>
                            <strong style="color:#991b1b; font-size:13px;">Combinar todo en 1 Noticia / Flash Resumen:</strong>
                            <input type="text" id="combinedFlashTitle" style="width:340px; margin-left:8px; border:1px solid #fca5a5; border-radius:6px; padding:4px 8px; font-size:12px;" />
                        </div>
                        <button type="button" id="btnPublishCombinedFlash" class="nora-btn-publish" style="background:#dc2626; white-space:nowrap;">
                            🚀 PUBLICAR NOTICIA COMBINADA EN CADENA 4
                        </button>
                    </div>

                    <div id="newClipsList" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:12px;"></div>
                </div>
            </div>

            <!-- Biblioteca de Clips Almacenados -->
            <div class="nora-card">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:16px;">
                    <div>
                        <h2 style="font-size:17px; font-weight:800; margin:0; color:#0f172a; display:flex; align-items:center; gap:8px;">
                            <span>📁</span> Biblioteca de Clips Almacenados (Disponibles en Nexativa y Locales)
                        </h2>
                        <p style="font-size:12px; color:#64748b; margin:2px 0 0 0;">
                            Todos los recortes quedan guardados con su imagen y timestamp exacto. Puedes publicarlos individualmente en tu diario con 1 clic.
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
        <!-- PESTAÑA 4: MÓVIL EXTERIORES PWA & DESPACHOS EN VIVO                       -->
        <!-- ========================================================================= -->
        <div id="tab-movil" class="nora-tab-content" style="<?php echo $initial_tab === 'movil' ? '' : 'display:none;'; ?>">
            <!-- Sección 1: Despachos Recibidos desde la Calle -->
            <div class="nora-card" style="margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:16px;">
                    <div>
                        <h2 style="font-size:17px; font-weight:800; margin:0; color:#0f172a; display:flex; align-items:center; gap:8px;">
                            <span>📡</span> Despachos Recibidos desde el Móvil de Exteriores (En Vivo)
                        </h2>
                        <p style="font-size:12px; color:#64748b; margin:2px 0 0 0;">
                            Las noticias y fotos enviadas por los movileros desde la calle entran en esta bandeja. Puedes cargarlas al editor o publicarlas con 1 clic en Cadena 4.
                        </p>
                    </div>

                    <button type="button" id="btnReloadDispatches" class="button" style="font-weight:700; font-size:12px;">
                        🔄 Actualizar Despachos
                    </button>
                </div>

                <div id="dispatchesContainer" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:16px;">
                    <p style="color:#94a3b8; font-style:italic;">Cargando despachos recibidos desde la calle...</p>
                </div>
            </div>

            <!-- Sección 2: Info de la PWA y QR -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                <div class="nora-card">
                    <h2 style="font-size:17px; font-weight:800; margin-top:0; color:#0f172a; display:flex; align-items:center; gap:8px;">
                        <span>📱</span> Nora Móvil Exteriores PWA (Para Celulares)
                    </h2>
                    <p style="font-size:13px; color:#475569;">
                        Tu periodista de calle o movilero puede instalar la <strong>PWA Oficial de Exteriores</strong> directamente en su teléfono Android o iPhone sin pasar por Google Play o App Store.
                    </p>

                    <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:16px; margin:16px 0; font-size:13px; line-height:1.6; color:#1e40af;">
                        <h4 style="margin:0 0 8px 0; font-weight:800;">Ventajas del Móvil de Exteriores:</h4>
                        <ul style="margin:0; padding-left:20px;">
                            <li>🛰️ Geolocalización GPS precisa automática (detecta barrio y referencia).</li>
                            <li>📷 Captura y envío de fotografías instantáneas del hecho.</li>
                            <li>🎙️ Grabación de notas de voz limpias con reducción de ruido.</li>
                            <li>📹 Filmación de video en el lugar del hecho.</li>
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

                    <div class="nora-diag-box" id="diagNoraLive">
                        <span class="nora-diag-indicator" style="background:#f59e0b;"></span>
                        <div>
                            <strong>Nora Live Editor API</strong>
                            <div style="font-size:11px; color:#64748b;">nexativanews.com.ar/api/nora-live</div>
                        </div>
                    </div>

                    <div class="nora-diag-box" id="diagNoraClip">
                        <span class="nora-diag-indicator" style="background:#f59e0b;"></span>
                        <div>
                            <strong>Nora Auto-Clipper API</strong>
                            <div style="font-size:11px; color:#64748b;">nexativanews.com.ar/api/nora-clip</div>
                        </div>
                    </div>

                    <div class="nora-diag-box" id="diagDispatches">
                        <span class="nora-diag-indicator" style="background:#f59e0b;"></span>
                        <div>
                            <strong>Móvil PWA Despachos API</strong>
                            <div style="font-size:11px; color:#64748b;">nexativanews.com.ar/api/corresponsal/dispatches</div>
                        </div>
                    </div>
                </div>

                <button type="button" id="btnRunDiagnostics" class="button button-primary" style="font-weight:700;">
                    🔄 Ejecutar Prueba de Todos los Cables Ahora
                </button>
            </div>
        </div>
    </div>

    <!-- Estilos CSS Embebidos -->
    <style>
        .nora-card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:20px; box-shadow:0 4px 12px rgba(0,0,0,0.03); }
        .nora-tab-btn { background:#f8fafc; border:1px solid #cbd5e1; border-bottom:none; border-radius:10px 10px 0 0; padding:10px 18px; font-weight:700; font-size:13px; color:#475569; cursor:pointer; transition:all 0.15s; }
        .nora-tab-btn:hover { background:#f1f5f9; color:#0f172a; }
        .nora-tab-btn.active { background:#dc2626; color:#fff; border-color:#dc2626; }
        .nora-btn-publish { background:#16a34a; color:#fff; border:none; border-radius:8px; padding:8px 16px; font-weight:800; cursor:pointer; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; transition:all 0.15s; display:inline-flex; align-items:center; justify-content:center; gap:6px; }
        .nora-btn-publish:hover { background:#15803d; }
        .nora-btn-publish:disabled { opacity:0.6; cursor:not-allowed; }
        .nora-msg { padding:10px 14px; border-radius:10px; font-size:13px; line-height:1.5; max-width:85%; }
        .nora-msg.nora { background:#fee2e2; color:#991b1b; align-self:flex-start; border-bottom-left-radius:2px; }
        .nora-msg.user { background:#2563eb; color:#fff; align-self:flex-end; border-bottom-right-radius:2px; }
        .nora-clip-card { background:#fff; border:1px solid #cbd5e1; border-radius:12px; padding:14px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 2px 6px rgba(0,0,0,0.04); }
        .nora-diag-box { display:flex; align-items:center; gap:12px; padding:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; }
        .nora-diag-indicator { width:12px; height:12px; border-radius:50%; display:inline-block; }
    </style>

    <!-- Scripts JavaScript Integrados -->
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        const wpRestUrl        = <?php echo json_encode($rest_url); ?>;
        const wpRestNonce      = <?php echo json_encode($rest_nonce); ?>;
        const wpAjaxUrl        = <?php echo json_encode($ajax_url); ?>;
        const wpAjaxNonce      = <?php echo json_encode($ajax_nonce); ?>;
        const nexativaBase     = <?php echo json_encode($nexativa_url); ?>;
        const liveApiEndpoint  = nexativaBase + '/api/nora-live';
        const clipperApiEndpoint = nexativaBase + '/api/nora-clip';
        const flashesApiEndpoint = nexativaBase + '/api/flashes';
        const clipsApiEndpoint   = nexativaBase + '/api/clips?limit=50';
        const dispatchesApiEndpoint = nexativaBase + '/api/corresponsal/dispatches?limit=20';

        function showNotice(msg, isSuccess = true) {
            const el = document.getElementById('noraNotice');
            if (!el) return;
            el.style.display = 'block';
            el.style.background = isSuccess ? '#ecfdf5' : '#fef2f2';
            el.style.color = isSuccess ? '#065f46' : '#991b1b';
            el.style.border = '1px solid ' + (isSuccess ? '#a7f3d0' : '#fecaca');
            el.innerHTML = (isSuccess ? '✅ ' : '⚠️ ') + msg;
            setTimeout(() => { el.style.display = 'none'; }, 8000);
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
                if (targetTab === 'movil') loadMobileDispatches();
            });
        });

        // =========================================================================
        // PESTAÑA 1: NORA LIVE EDITOR (CON SOPORTE DE IMAGEN LOCAL + PREVIEW)
        // =========================================================================
        const chatEl = document.getElementById('noraChat');
        const inputEl = document.getElementById('noraInput');
        const draftEl = document.getElementById('noraDraft');
        const btnSend = document.getElementById('btnSend');
        const btnPublishLive = document.getElementById('btnPublishLive');
        const gpsBadge = document.getElementById('noraGpsBadge');
        let currentDraftText = '';
        let attachedImageBase64 = null;
        let currentNewsImageUrl = '';

        const imageInput = document.getElementById('noraImage');
        const previewContainer = document.getElementById('imagePreviewContainer');
        const previewImg = document.getElementById('imagePreviewImg');
        const previewName = document.getElementById('imagePreviewName');
        const btnRemoveImg = document.getElementById('btnRemoveImage');

        function showImagePreview(src, name) {
            if (!previewContainer) return;
            previewImg.src = src;
            previewName.innerText = name || 'Imagen seleccionada';
            previewContainer.style.display = 'flex';
        }

        function hideImagePreview() {
            attachedImageBase64 = null;
            currentNewsImageUrl = '';
            if (imageInput) imageInput.value = '';
            if (previewContainer) previewContainer.style.display = 'none';
        }

        if (btnRemoveImg) btnRemoveImg.addEventListener('click', hideImagePreview);

        if (imageInput) {
            imageInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (!file) return;

                if (!file.type.startsWith('image/')) {
                    alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(evt) {
                    attachedImageBase64 = evt.target.result;
                    currentNewsImageUrl = attachedImageBase64;
                    showImagePreview(attachedImageBase64, file.name);
                    showNotice('Foto cargada con éxito. Ya puedes escribirle a Nora o enviarla para redactar.');
                };
                reader.readAsDataURL(file);
            });
        }

        if (navigator.geolocation && gpsBadge) {
            navigator.geolocation.getCurrentPosition(pos => {
                gpsBadge.innerText = '📍 GPS: ' + pos.coords.latitude.toFixed(4) + ', ' + pos.coords.longitude.toFixed(4);
            }, () => {
                gpsBadge.innerText = '📍 Ituzaingó, Corrientes';
            });
        }

        btnSend.addEventListener('click', async function() {
            const text = inputEl.value.trim();
            if (!text && !attachedImageBase64) {
                alert('Escribe un texto o selecciona una foto antes de enviar a Nora.');
                return;
            }

            // Render user message
            const userMsg = document.createElement('div');
            userMsg.className = 'nora-msg user';
            let msgContent = '<strong>Movilero:</strong> ' + (text || '(Foto adjunta enviada)');
            if (attachedImageBase64) {
                msgContent += '<br/><img src="' + attachedImageBase64 + '" style="max-width:180px; max-height:120px; border-radius:6px; margin-top:6px; display:block;" />';
            }
            userMsg.innerHTML = msgContent;
            chatEl.appendChild(userMsg);
            inputEl.value = '';
            chatEl.scrollTop = chatEl.scrollHeight;

            btnSend.disabled = true;
            btnSend.innerText = 'Redactando con Nora...';

            try {
                const payload = {
                    message: text,
                    currentDraft: draftEl.innerText
                };
                if (attachedImageBase64) {
                    payload.image = attachedImageBase64;
                }

                const res = await fetch(liveApiEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (data.reply) {
                    const noraMsg = document.createElement('div');
                    noraMsg.className = 'nora-msg nora';
                    noraMsg.innerHTML = '<strong>Nora IA:</strong> ' + data.reply;
                    chatEl.appendChild(noraMsg);
                    chatEl.scrollTop = chatEl.scrollHeight;
                }

                const draftContent = data.draft || data.newDraft;
                if (draftContent) {
                    draftEl.innerHTML = draftContent;
                    currentDraftText = draftContent;
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
            if (!rawContent || rawContent.length < 20 || rawContent.includes('El borrador estructurado')) {
                alert('El borrador está vacío. Envía un mensaje de texto o sube una foto a Nora y pulsa "Enviar a Nora ⚡" para redactar la noticia antes de publicar.');
                return;
            }

            const titleMatch = rawContent.match(/<h[12][^>]*>(.*?)<\/h[12]>/i);
            const title = titleMatch ? titleMatch[1].replace(/<[^>]*>?/gm, '').trim() : '🔴 Cobertura en Vivo Cadena 4';

            this.disabled = true;
            this.innerText = 'Publicando en Cadena 4...';

            try {
                let finalContent = rawContent;
                if (currentNewsImageUrl && !rawContent.includes('<img')) {
                    finalContent = '<div style="margin-bottom:18px; border-radius:12px; overflow:hidden;"><img src="' + currentNewsImageUrl + '" alt="' + title + '" style="width:100%; height:auto; display:block; border-radius:12px;" /></div>' + rawContent;
                }

                const result = await publishToWordPressDual(title, finalContent, draftEl.innerText.substring(0, 150), currentNewsImageUrl);
                showNotice('¡Noticia publicada con éxito en Cadena 4! <a href="' + (result.permalink || '#') + '" target="_blank" style="color:#065f46; text-decoration:underline; font-weight:800;">Ver Noticia en el Portal</a>');
            } catch (err) {
                alert('Error al publicar noticia: ' + err.message);
            } finally {
                this.disabled = false;
                this.innerText = '🚀 PUBLICAR EN CADENA 4';
            }
        });

        // =========================================================================
        // PESTAÑA 2: AUTO-CLIPPER
        // =========================================================================
        const btnRunClipper = document.getElementById('btnRunClipper');
        const clipperUrlsInput = document.getElementById('clipperUrls');
        const clipperBatchTitle = document.getElementById('clipperBatchTitle');
        const resultsBox = document.getElementById('clipperResults');
        const summaryText = document.getElementById('clipperSummary');
        const countBadge = document.getElementById('clipsCountBadge');
        const newClipsList = document.getElementById('newClipsList');
        const combinedTitleInput = document.getElementById('combinedFlashTitle');
        const btnPublishCombined = document.getElementById('btnPublishCombinedFlash');

        let lastGeneratedClips = [];

        btnRunClipper.addEventListener('click', async function() {
            const urlsText = clipperUrlsInput.value.trim();
            if (!urlsText) {
                alert('Por favor ingresa al menos 1 enlace de video de YouTube o transmisión.');
                return;
            }

            const urlsList = urlsText.split(/[\n,]+/).map(u => u.trim()).filter(Boolean);
            btnRunClipper.disabled = true;
            btnRunClipper.innerText = 'Segmentando videos con Nora IA...';
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
                btnRunClipper.innerText = '⚡ Analizar y Segmentar Momentos Clave';
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
                    const cleanPlayerUrl = nexativaBase + '/embed/player?video=' + encodeURIComponent(videoUrl) + '&start=' + start + '&end=' + end + '&title=' + encodeURIComponent(title);
                    const embedUrl = cleanPlayerUrl;
                    const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';

                    const startM = Math.floor(start / 60);
                    const startS = Math.floor(start % 60);
                    const timeFormatted = `${startM.toString().padStart(2, '0')}:${startS.toString().padStart(2, '0')}`;

                    const content = `
                        <div style="margin-bottom:18px; border-radius:12px; overflow:hidden;">
                            <img src="${thumbUrl}" alt="${title}" style="width:100%; height:auto; display:block; border-radius:12px;" />
                        </div>
                        <h2>${title}</h2>
                        <p style="font-size:16px; line-height:1.6;">${summary}</p>
                        <div style="background:#fef2f2; border:1px solid #fecaca; border-left:5px solid #dc2626; padding:12px 16px; border-radius:8px; margin:20px 0 12px 0; font-family:sans-serif;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                <strong style="color:#dc2626; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">🔴 MOMENTO CLAVE DESTACADO</strong>
                                <span style="font-size:11px; font-weight:bold; color:#7f1d1d; background:#fee2e2; padding:2px 8px; border-radius:4px;">⏱️ Minuto exacto: ${timeFormatted}</span>
                            </div>
                            <p style="margin:0; font-size:12px; color:#334155; line-height:1.4;">El video a continuación reproduce automáticamente desde el inicio de este acontecimiento.</p>
                        </div>
                        <div style="margin:20px 0; border-radius:12px; overflow:hidden; aspect-ratio:16/9; background:#000;">
                            <iframe width="100%" height="450" src="${embedUrl}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>
                        </div>
                    `;

                    this.disabled = true;
                    this.innerText = 'Publicando...';

                    try {
                        const result = await publishToWordPressDual(title, content, summary.substring(0, 150), thumbUrl);
                        showNotice('¡Recorte publicado con éxito en Cadena 4 con imagen preliminar! <a href="' + (result.permalink || '#') + '" target="_blank" style="color:#065f46; text-decoration:underline; font-weight:800;">Ver Noticia en el Portal</a>');
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
                ? `https://www.youtube.com/embed/${ytId}?start=${firstClip.start_time_seconds}&autoplay=0&rel=0`
                : firstClip.video_url;
            const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';

            const summaryList = lastGeneratedClips.map(c => `<li><strong>${c.title}</strong> (${c.start_timestamp} - ${c.end_timestamp}): ${c.summary}</li>`).join('');

            const content = `
                <div style="margin-bottom:18px; border-radius:12px; overflow:hidden;">
                    <img src="${thumbUrl}" alt="${title}" style="width:100%; height:auto; display:block; border-radius:12px;" />
                </div>
                <h2>${title}</h2>
                <div style="margin:20px 0; border-radius:12px; overflow:hidden; aspect-ratio:16/9; background:#000;">
                    <iframe width="100%" height="450" src="${embedUrl}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>
                </div>
                <h3>Momentos Destacados de la Emisión:</h3>
                <ul>${summaryList}</ul>
            `;

            this.disabled = true;
            this.innerText = 'Mezclando y emitiendo Flash (5 min)...';

            try {
                // 1. Guardar Flash en el motor central de Nexativa con todos sus segmentos mezclados
                let flashEmbedUrl = '';
                const totalDur = lastGeneratedClips.reduce((acc, c) => acc + (c.duration_seconds || 60), 0);
                try {
                    const saveFlashRes = await fetch(flashesApiEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: title,
                            summary: summaryText.innerText || title,
                            duration_seconds: Math.min(300, totalDur),
                            video_url: firstClip.video_url,
                            thumbnail_url: thumbUrl,
                            segments: lastGeneratedClips,
                            category: 'general'
                        })
                    });
                    const flashJson = await saveFlashRes.json();
                    if (flashJson.success && flashJson.flash?.id) {
                        flashEmbedUrl = nexativaBase + '/embed/flash/' + flashJson.flash.id;
                    }
                } catch (saveErr) {
                    console.warn('Fallo al guardar en news_flashes, usando reproductor dinámico:', saveErr);
                }

                if (!flashEmbedUrl) {
                    flashEmbedUrl = nexativaBase + '/embed/player?segments=' + encodeURIComponent(JSON.stringify(lastGeneratedClips)) + '&title=' + encodeURIComponent(title);
                }

                const mixedContent = `
                    <div style="margin-bottom:18px; border-radius:12px; overflow:hidden;">
                        <img src="${thumbUrl}" alt="${title}" style="width:100%; height:auto; display:block; border-radius:12px;" />
                    </div>
                    <h2>${title}</h2>
                    <div style="background:#fef2f2; border:1px solid #fecaca; border-left:5px solid #dc2626; padding:12px 16px; border-radius:8px; margin:16px 0; font-family:sans-serif;">
                        <strong style="color:#dc2626; font-size:13px; text-transform:uppercase;">🔴 NOTICIERO FLASH EXPRÉS (${Math.floor(totalDur/60)} MINUTOS)</strong>
                        <p style="margin:4px 0 0 0; font-size:12px; color:#334155;">Secuencia periodística multi-segmento procesada por Nora IA. Reproduce de forma continua los momentos clave sin interrupciones.</p>
                    </div>
                    <div style="margin:20px 0; border-radius:12px; overflow:hidden; aspect-ratio:16/9; background:#000;">
                        <iframe width="100%" height="450" src="${flashEmbedUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                    </div>
                    <h3>Síntesis Informativa de la Emisión:</h3>
                    <ul>${summaryList}</ul>
                `;

                const result = await publishToWordPressDual(title, mixedContent, summaryText.innerText.substring(0, 150), thumbUrl);
                showNotice('¡Noticiero Flash mezclado publicado con éxito en Cadena 4! <a href="' + (result.permalink || '#') + '" target="_blank" style="color:#065f46; text-decoration:underline; font-weight:800;">Ver Noticia</a>');
            } catch (e) {
                alert('Error al publicar Flash: ' + e.message);
            } finally {
                this.disabled = false;
                this.innerText = '🚀 PUBLICAR NOTICIA COMBINADA EN CADENA 4';
            }
        });

        // Cargar Biblioteca de Clips Guardados (Híbrido: Local WordPress + Central Nexativa)
        async function loadStoredClips() {
            const container = document.getElementById('storedClipsContainer');
            if (!container) return;
            container.innerHTML = '<p style="color:#94a3b8; font-style:italic;">Cargando biblioteca de clips...</p>';

            let allClips = [];

            // 1. Obtener clips locales de WordPress (wp_options)
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

            // 2. Obtener clips centrales de Nexativa
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
                console.warn('API central de Nexativa en reposo, visualizando clips locales:', errRemote);
            }

            if (allClips.length > 0) {
                container.innerHTML = '';
                allClips.forEach(clip => {
                    const ytId = getYouTubeId(clip.video_url);
                    const embedUrl = ytId
                        ? `https://www.youtube.com/embed/${ytId}?start=${clip.start_time_seconds || 0}&autoplay=0&rel=0`
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
                                <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                                    <span style="font-size:10px; font-weight:800; background:#dc2626; color:#fff; padding:2px 6px; border-radius:4px; text-transform:uppercase;">
                                        FLASH NOTICIOSO
                                    </span>
                                    <span style="font-size:11px; font-mono; font-weight:bold; color:#64748b;">
                                        ⏱️ ${flash.duration_seconds || 180}s
                                    </span>
                                </div>
                                <h3 style="font-size:14px; font-weight:800; margin:0 0 8px 0; color:#0f172a;">${flash.title}</h3>
                                <div style="aspect-ratio:16/9; background:#000; border-radius:8px; overflow:hidden; margin-bottom:12px;">
                                    <iframe src="${embedUrl}" width="100%" height="180" frameborder="0" allowfullscreen></iframe>
                                </div>
                                <p style="font-size:12px; color:#475569; margin:0 0 12px 0;">${flash.summary || ''}</p>
                            </div>
                            <button type="button" class="nora-btn-publish btnPublishFlashCard" data-title="${encodeURIComponent(flash.title)}" data-summary="${encodeURIComponent(flash.summary)}" data-embed="${encodeURIComponent(embedUrl)}">
                                🚀 PUBLICAR FLASH EN CADENA 4
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
                                <div style="margin:20px 0; aspect-ratio:16/9; background:#000; border-radius:12px; overflow:hidden;">
                                    <iframe width="100%" height="450" src="${embed}" frameborder="0" allowfullscreen></iframe>
                                </div>
                            `;

                            this.disabled = true;
                            this.innerText = 'Publicando...';

                            try {
                                const result = await publishToWordPressDual(title, content, summary);
                                showNotice('¡Flash publicado con éxito en Cadena 4! <a href="' + (result.permalink || '#') + '" target="_blank" style="color:#065f46; text-decoration:underline; font-weight:800;">Ver Noticia</a>');
                            } catch (e) {
                                alert('Error al publicar: ' + e.message);
                            } finally {
                                this.disabled = false;
                                this.innerText = '🚀 PUBLICAR FLASH EN CADENA 4';
                            }
                        });
                    });
                } else {
                    listEl.innerHTML = '<p style="color:#64748b;">No hay Flashes noticiosos emitidos aún.</p>';
                }
            } catch (e) {
                listEl.innerHTML = '<p style="color:#dc2626;">Error cargando Flashes: ' + e.message + '</p>';
            }
        }

        const btnReloadFlashes = document.getElementById('btnReloadFlashesList');
        if (btnReloadFlashes) btnReloadFlashes.addEventListener('click', loadFlashes);

        // =========================================================================
        // PESTAÑA 4: DESPACHOS MÓVIL EXTERIORES PWA EN TIEMPO REAL
        // =========================================================================
        async function loadMobileDispatches() {
            const container = document.getElementById('dispatchesContainer');
            if (!container) return;
            container.innerHTML = '<p style="color:#94a3b8; font-style:italic;">Sincronizando despachos desde la PWA móvil...</p>';

            try {
                const res = await fetch(dispatchesApiEndpoint);
                const json = await res.json();
                if (json.success && Array.isArray(json.dispatches) && json.dispatches.length > 0) {
                    container.innerHTML = '';
                    json.dispatches.forEach(d => {
                        const card = document.createElement('div');
                        card.className = 'nora-clip-card';
                        const imgHtml = d.primary_image 
                            ? `<div style="aspect-ratio:16/9; background:#000; border-radius:8px; overflow:hidden; margin-bottom:10px;">
                                 <img src="${d.primary_image}" alt="${d.title}" style="width:100%; height:100%; object-fit:cover;" />
                               </div>` 
                            : '';
                        const dateFormatted = d.created_at ? new Date(d.created_at).toLocaleString() : '';

                        card.innerHTML = `
                            <div>
                                ${imgHtml}
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                    <span style="font-size:10px; font-weight:800; background:#dbeafe; color:#1e40af; padding:2px 6px; border-radius:4px; text-transform:uppercase;">
                                        Móvil de Calle
                                    </span>
                                    <span style="font-size:11px; color:#64748b; font-family:monospace;">
                                        ${dateFormatted}
                                    </span>
                                </div>
                                <h4 style="margin:0 0 6px 0; font-size:14px; font-weight:800; color:#0f172a;">${d.title}</h4>
                                <div style="font-size:12px; color:#475569; margin:0 0 12px 0; line-height:1.4; max-height:80px; overflow-y:auto;">
                                    ${d.content || d.excerpt}
                                </div>
                            </div>

                            <div style="display:flex; gap:6px; flex-direction:column; margin-top:auto;">
                                <button type="button" class="nora-btn-publish btnPublishDispatch" style="width:100%;" data-id="${d.id}">
                                    🚀 PUBLICAR EN CADENA 4
                                </button>
                                <button type="button" class="button btnLoadInEditor" style="font-size:12px; font-weight:700;" data-id="${d.id}">
                                    📝 Cargar en Nora Editor
                                </button>
                            </div>
                        `;
                        container.appendChild(card);
                    });

                    // Acciones de los despachos
                    document.querySelectorAll('.btnPublishDispatch').forEach(btn => {
                        btn.addEventListener('click', async function() {
                            const id = this.getAttribute('data-id');
                            const dispatch = json.dispatches.find(x => x.id === id);
                            if (!dispatch) return;

                            this.disabled = true;
                            this.innerText = 'Publicando...';

                            try {
                                const postTitle = dispatch.title;
                                const imgTag = dispatch.primary_image 
                                    ? `<div style="margin-bottom:18px; border-radius:12px; overflow:hidden;"><img src="${dispatch.primary_image}" alt="${postTitle}" style="width:100%; height:auto; display:block; border-radius:12px;" /></div>` 
                                    : '';
                                const postContent = `${imgTag}${dispatch.content || '<p>' + dispatch.title + '</p>'}`;
                                const result = await publishToWordPressDual(postTitle, postContent, dispatch.excerpt, dispatch.primary_image || '');
                                showNotice('¡Despacho publicado con éxito en Cadena 4! <a href="' + (result.permalink || '#') + '" target="_blank" style="color:#065f46; text-decoration:underline; font-weight:800;">Ver Noticia</a>');
                            } catch (e) {
                                alert('Error al publicar: ' + e.message);
                            } finally {
                                this.disabled = false;
                                this.innerText = '🚀 PUBLICAR EN CADENA 4';
                            }
                        });
                    });

                    document.querySelectorAll('.btnLoadInEditor').forEach(btn => {
                        btn.addEventListener('click', function() {
                            const id = this.getAttribute('data-id');
                            const dispatch = json.dispatches.find(x => x.id === id);
                            if (!dispatch) return;

                            document.querySelector('.nora-tab-btn[data-tab="live"]').click();
                            draftEl.innerHTML = `<h2>${dispatch.title}</h2>${dispatch.content || ''}`;
                            currentDraftText = draftEl.innerHTML;
                            if (dispatch.primary_image) {
                                currentNewsImageUrl = dispatch.primary_image;
                                showImagePreview(dispatch.primary_image, 'Foto de Exteriores');
                            }
                            showNotice('¡Despacho cargado en el editor! Puedes pedirle a Nora que lo amplíe o publicarlo directamente.');
                            window.scrollTo({ top: 300, behavior: 'smooth' });
                        });
                    });
                } else {
                    container.innerHTML = '<p style="color:#64748b;">No hay despachos nuevos en este momento. Envía un reporte desde el celular escaneando el QR.</p>';
                }
            } catch (e) {
                container.innerHTML = '<p style="color:#dc2626;">Error sincronizando despachos móviles: ' + e.message + '</p>';
            }
        }

        const btnReloadDisp = document.getElementById('btnReloadDispatches');
        if (btnReloadDisp) btnReloadDisp.addEventListener('click', loadMobileDispatches);

        // =========================================================================
        // PESTAÑA 5: DIAGNÓSTICO
        // =========================================================================
        async function runDiagnostics() {
            async function pingEndpoint(url, indicatorId) {
                const el = document.getElementById(indicatorId);
                if (!el) return;
                const dot = el.querySelector('.nora-diag-indicator');
                dot.style.background = '#f59e0b';

                try {
                    const res = await fetch(url, { method: 'OPTIONS' }).catch(() => fetch(url));
                    if (res.status < 500) {
                        dot.style.background = '#10b981';
                    } else {
                        dot.style.background = '#ef4444';
                    }
                } catch (e) {
                    dot.style.background = '#ef4444';
                }
            }

            pingEndpoint(wpRestUrl, 'diagWpRest');
            pingEndpoint(wpAjaxUrl, 'diagWpAjax');
            pingEndpoint(liveApiEndpoint, 'diagNoraLive');
            pingEndpoint(clipperApiEndpoint, 'diagNoraClip');
            pingEndpoint(dispatchesApiEndpoint, 'diagDispatches');
        }

        const btnDiag = document.getElementById('btnRunDiagnostics');
        if (btnDiag) btnDiag.addEventListener('click', runDiagnostics);

        // Chequeo de Actualizaciones en 1 Clic
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

                    if (json.success && json.data?.has_update) {
                        showNotice(`🚀 ¡Nueva versión disponible (v${json.data.latest_version})! <button type="button" id="btnApplyUpdateNow" class="button button-primary" style="margin-left:8px; font-weight:800; cursor:pointer;">⚡ Instalar Actualización en 1 Clic</button> <a href="${json.data.update_url}" style="margin-left:8px; color:#065f46; font-size:12px; text-decoration:underline;">(o vía instalador clásico)</a>`);

                        const btnApply = document.getElementById('btnApplyUpdateNow');
                        if (btnApply) {
                            btnApply.addEventListener('click', async function() {
                                this.disabled = true;
                                this.innerText = 'Instalando desde CDN segura...';
                                try {
                                    const fdUp = new FormData();
                                    fdUp.append('action', 'nora_live_apply_update_now');
                                    fdUp.append('security', wpAjaxNonce);

                                    const resUp = await fetch(wpAjaxUrl, { method: 'POST', body: fdUp });
                                    const jsonUp = await resUp.json();

                                    if (jsonUp.success && jsonUp.data?.redirect) {
                                        window.location.href = jsonUp.data.redirect;
                                    } else if (jsonUp.success) {
                                        showNotice('🎉 ' + jsonUp.data.message + ' Recargando panel...', true);
                                        setTimeout(() => window.location.reload(), 2000);
                                    } else {
                                        showNotice(jsonUp.data?.message || 'Error durante la instalación. Redirigiendo a instalador nativo...', false);
                                        setTimeout(() => { window.location.href = json.data.update_url; }, 2500);
                                    }
                                } catch (err) {
                                    showNotice('Redirigiendo al instalador oficial de WordPress: ' + err.message, false);
                                    setTimeout(() => { window.location.href = json.data.update_url; }, 2000);
                                }
                            });
                        }
                    } else if (json.success) {
                        showNotice('✓ El plugin ya está en su versión más reciente (v' + (json.data?.current_version || '2.2.0') + '). Servidores CDN conectados.');
                    } else {
                        showNotice(json.data?.message || 'Servidores de actualización no disponibles temporalmente.', false);
                    }
                } catch (e) {
                    showNotice('No se pudo comprobar la versión en este momento: ' + e.message, false);
                } finally {
                    this.disabled = false;
                    this.innerText = '🔄 Buscar Actualizaciones';
                }
            });
        }

        // Carga inicial según pestaña
        if ('<?php echo $initial_tab; ?>' === 'clipper') loadStoredClips();
        if ('<?php echo $initial_tab; ?>' === 'flashes') loadFlashes();
        if ('<?php echo $initial_tab; ?>' === 'movil') loadMobileDispatches();
        runDiagnostics();
    });
    </script>
    <?php
}
