! function () {
    "use strict";
    const buttons = document.querySelectorAll("[data-outside]");

    window.addEventListener("DOMContentLoaded", (() => {
        document.body.classList.remove("preload");
    }));

    buttons.forEach((button => {
        ! function outsideClick(button) {
            if (!button) return;
            const target = document.getElementById(button.dataset.outside);
            if (!target) return;
            button.addEventListener("click", (() => {
                button.classList.toggle("is-active"), target.classList.toggle("is-active")
            })), document.addEventListener("click", (event => {
                target.contains(event.target) || button.contains(event.target) || (button.classList.remove("is-active"), target.classList.remove("is-active"))
            }));
            const close = target.querySelector("[data-close]");
            close && (close.onclick = function () {
                button.classList.remove("is-active"), target.classList.remove("is-active")
            })
        }(button)
    }));

    const icons = {
        play: '<svg class="i i-play" viewBox="0 0 24 24"><path d="m7 3 14 9-14 9z"></path></svg>',
        pause: '<svg class="i i-pause" viewBox="0 0 24 24"><path d="M5 4h4v16H5Zm10 0h4v16h-4Z"></path></svg>',
        music: '<svg class="i i-music" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>',
        facebook: '<svg class="i i-facebook" viewBox="0 0 24 24"><path d="M17 14h-3v8h-4v-8H7v-4h3V7a5 5 0 0 1 5-5h3v4h-3q-1 0-1 1v3h4Z"></path></svg>',
        twitter: '<svg class="i i-x" viewBox="0 0 24 24"><path d="m3 21 7.5-7.5m3-3L21 3M8 3H3l13 18h5Z"></path></svg>',
        instagram: '<svg class="i i-instagram" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><rect width="20" height="20" x="2" y="2" rx="5"></rect><path d="M17.5 6.5h0"></path></svg>',
        youtube: '<svg class="i i-youtube" viewBox="0 0 24 24"><path d="M1.5 17q-1-5.5 0-10Q1.9 4.8 4 4.5q8-1 16 0 2.1.3 2.5 2.5 1 4.5 0 10-.4 2.2-2.5 2.5-8 1-16 0-2.1-.3-2.5-2.5Zm8-8.5v7l6-3.5Z"></path></svg>',
        tiktok: '<svg class="i i-tiktok" viewBox="0 0 24 24"><path d="M22 6v5q-4 0-6-2v7a7 7 0 1 1-5-6.7m0 6.7a2 2 0 1 0-2 2 2 2 0 0 0 2-2V1h5q2 5 6 5"></path></svg>',
        email: '<svg class="i i-envelope" viewBox="0 0 24 24">   <rect width="20" height="16" x="2" y="4" rx="2"></rect>   <path d="m22 8-10 5L2 8"></path> </svg>',
        whatsapp: '<svg class="i i-whatsapp" viewBox="0 0 24 24"><circle cx="9" cy="9" r="1"></circle><circle cx="15" cy="15" r="1"></circle><path d="M8 9a7 7 0 0 0 7 7m-9 5.2A11 11 0 1 0 2.8 18L2 22Z"></path></svg>',
        telegram: '<svg class="i i-telegram" viewBox="0 0 24 24"><path d="M12.5 16 9 19.5 7 13l-5.5-2 21-8-4 18-7.5-7 4-3"></path></svg>',
        tv: '<svg class="i i-tv" viewBox="0 0 24 24"><rect width="22" height="15" x="1" y="3" rx="3"></rect><path d="M7 21h10"></path></svg>'
    },
        playButton = document.querySelector(".player-button-play"),
        audio = new Audio;

    // AUDIO CONFIG
    audio.preload = "none";
    window.radioAudio = audio;

    function play(audioObj, newSource = null) {
        const a = audioObj || audio;

        // Si hay una nueva fuente o la fuente actual está vacía, la seteamos
        if (newSource || !a.src || a.src === "" || a.src.includes('undefined')) {
            const url = newSource || (window.streams && window.streams.stations[0].stream_url);
            if (url) {
                const separator = url.includes('?') ? '&' : '?';
                a.src = `${url}${separator}nocache=${Date.now()}`;
                a.load();
            }
        }

        if (!a.src) {
            console.warn("URL de stream no disponible");
            return;
        }

        const playPromise = a.play();
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                if (playButton) {
                    playButton.innerHTML = icons.pause;
                    playButton.classList.add("is-active");
                }
                document.body.classList.add("is-playing");

                if ("mediaSession" in navigator) {
                    navigator.mediaSession.playbackState = "playing";
                }
            }).catch(error => {
                console.error("Playback failed:", error);
                // Reintento agresivo
                a.src = a.src.split('nocache=')[0] + 'nocache=' + Date.now();
                a.load();
                a.play().catch(e => console.error("Retry failed:", e));
            });
        }
    }
    window.radioPlay = play;

    function pause(audioObj) {
        const a = audioObj || audio;
        a.pause();
        // Al pausar una radio en vivo, es mejor vaciar el src para no acumular buffer/cache
        const oldSrc = a.src;
        a.src = "";
        a.load();
        a.src = oldSrc;

        if (playButton) {
            playButton.innerHTML = icons.play;
            playButton.classList.remove("is-active");
        }
        document.body.classList.remove("is-playing");

        if ("mediaSession" in navigator) {
            navigator.mediaSession.playbackState = "paused";
        }
    }
    window.radioPause = pause;

    if (playButton) {
        playButton.addEventListener("click", (() => {
            audio.paused ? play(audio) : pause(audio)
        }));
    }

    const range = document.querySelector(".player-volume"),
        rangeFill = document.querySelector(".player-range-fill"),
        rangeWrapper = document.querySelector(".player-range-wrapper"),
        rangeThumb = document.querySelector(".player-range-thumb"),
        currentVolume = localStorage.getItem("volume") || 100;

    function updateVolume(value) {
        if (!range) return;
        range.value = value;
        if (rangeFill) rangeFill.style.width = `${value}%`;
        if (rangeWrapper && rangeThumb) {
            const thumbPosition = (value / 100) * (rangeWrapper.offsetWidth - rangeThumb.offsetWidth);
            rangeThumb.style.left = `${thumbPosition}px`;
        }
        localStorage.setItem("volume", value);
        audio.volume = value / 100;
    }

    if (range) {
        updateVolume(currentVolume);
        range.addEventListener("input", (event => {
            updateVolume(event.target.value)
        }));
        if (rangeWrapper) {
            rangeWrapper.addEventListener("mousedown", (event => {
                const rangeRect = range.getBoundingClientRect(),
                    percent = (event.clientX - rangeRect.left) / range.offsetWidth * 100;
                updateVolume(Math.round((range.max - range.min) * (percent / 100)) + parseInt(range.min))
            }));
        }
    }

    function setAssetsInPage(station) {
        if (!station) return;

        const pSocial = document.querySelectorAll(".player-social");
        const hLogo = document.querySelector(".header-logo-img");
        const pArt = document.querySelector(".player-artwork img:first-child");
        const pCover = document.querySelector(".player-cover-image");
        const sName = document.querySelector(".station-name");
        const sDesc = document.querySelector(".station-description");

        pSocial.forEach(c => { c.innerHTML = ""; });

        if (hLogo) hLogo.src = (station.logo || "assets/logo.png") + "?v=" + Date.now();
        if (pArt) pArt.src = (station.album || "assets/logo.png") + "?v=" + Date.now();
        if (pCover) pCover.src = (station.cover || station.album || "assets/logo.png") + "?v=" + Date.now();

        if (sName) sName.textContent = station.name || "Pista Rincón Soñado";
        if (sDesc) sDesc.textContent = "EN VIVO";

        const createSocialItem = (url, icon) => {
            if (!url) return null;
            const $a = document.createElement("a");
            $a.classList.add("player-social-item");
            $a.href = url;
            $a.target = "_blank";
            $a.innerHTML = icons[icon] || "";
            return $a;
        };

        if (station.social) {
            Object.keys(station.social).forEach(key => {
                const item = createSocialItem(station.social[key], key);
                if (item) pSocial.forEach(c => c.appendChild(item.cloneNode(true)));
            });
        }

        if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: station.name || "Pista Rincón Soñado",
                artist: "Radio Online",
                album: station.description || "En Vivo",
                artwork: [{
                    src: station.logo || "assets/logo.png",
                    sizes: "512x512",
                    type: "image/png"
                }]
            });
            navigator.mediaSession.setActionHandler("play", () => { radioPlay(); });
            navigator.mediaSession.setActionHandler("pause", () => { radioPause(); });
        }
    }

    ! function initApp() {
        const stations = (window.streams || {}).stations;
        if (!stations || !stations[0]) return;

        const currentStation = stations[0];
        setAssetsInPage(currentStation);

        // Inicializamos el src
        const streamUrl = currentStation.stream_url;
        if (streamUrl) {
            const separator = streamUrl.includes('?') ? '&' : '?';
            audio.src = `${streamUrl}${separator}nocache=${Date.now()}`;
        }

        console.log("Sistema de Radio v3.0 - Playback Directo");
    }();
}();