// app.js — DeleteYourOldSelf // Vi0lence.exe

document.addEventListener('DOMContentLoaded', () => {

    /* ─── DOM ─── */
    const overlay  = document.getElementById('overlay');
    const enterBtn = document.getElementById('enter-btn');
    const profile  = document.getElementById('profile');
    const bgVideo  = document.getElementById('bg-video');
    const playBtn  = document.getElementById('play-btn');
    const playIcon = document.getElementById('play-icon');
    const disc     = document.getElementById('disc');
    const progBar  = document.getElementById('prog-bar');
    const progFill = document.getElementById('prog-fill');
    const tNow     = document.getElementById('t-now');
    const tEnd     = document.getElementById('t-end');
    const vol      = document.getElementById('vol');
    const volIcon  = document.getElementById('vol-icon');
    const muteBtn  = document.getElementById('mute-btn');
    const muteIcon = document.getElementById('mute-icon');
    const vizCvs   = document.getElementById('viz');
    const vizCtx   = vizCvs.getContext('2d');
    const twEl     = document.getElementById('tw');

    let muted    = false;
    let savedVol = 0.7;

    /* ─── AUTOPLAY muted al cargar ─── */
    bgVideo.muted  = true;
    bgVideo.volume = savedVol;
    bgVideo.play().catch(() => {});

    /* ─── ENTRADA ─── */
    enterBtn.addEventListener('click', () => {
        // Desmutear al hacer click (gesto de usuario necesario para el audio)
        bgVideo.muted  = false;
        bgVideo.volume = savedVol;

        overlay.classList.add('out');
        profile.classList.remove('hidden');
        setTimeout(() => {
            profile.classList.add('show');
            overlay.style.display = 'none';
            sizViz();
            mockViz();
            setTimeout(() => profile.classList.add('floating'), 900);
            initTilt();
            addRipple(playBtn);
            addRipple(muteBtn);
        }, 500);
    });

    /* ─── TILT 3D + GLARE + SPOTLIGHT ─── */
    function initTilt() {
        const card  = document.querySelector('.card');
        const glare = document.querySelector('.card-glare');
        const spot  = document.querySelector('.card-spot');

        card.addEventListener('mousemove', e => {
            const r  = card.getBoundingClientRect();
            const px = e.clientX - r.left;
            const py = e.clientY - r.top;
            const dx = (px - r.width  / 2) / (r.width  / 2);
            const dy = (py - r.height / 2) / (r.height / 2);

            card.style.transition = 'transform .08s ease, box-shadow .08s ease';
            card.style.transform  = `perspective(900px) rotateX(${-dy*13}deg) rotateY(${dx*13}deg) scale(1.02)`;
            card.style.boxShadow  = `${dx*24}px ${-dy*24+40}px 70px rgba(0,0,0,.9), inset 0 1px 0 rgba(255,255,255,.07)`;

            const gx = (dx + 1) / 2 * 100;
            const gy = (dy + 1) / 2 * 100;
            glare.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,.11) 0%, transparent 60%)`;
            spot.style.background  = `radial-gradient(circle 140px at ${px}px ${py}px, rgba(255,255,255,.055) 0%, transparent 70%)`;

            profile.style.animationPlayState = 'paused';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform .6s cubic-bezier(.03,.98,.52,.99), box-shadow .6s ease';
            card.style.transform  = '';
            card.style.boxShadow  = '';
            glare.style.background = '';
            profile.style.animationPlayState = 'running';
        });
    }

    /* ─── RIPPLE en botones ─── */
    function addRipple(btn) {
        btn.addEventListener('click', e => {
            const r = btn.getBoundingClientRect();
            const rpl = document.createElement('span');
            rpl.className = 'ripple';
            rpl.style.left = (e.clientX - r.left) + 'px';
            rpl.style.top  = (e.clientY - r.top)  + 'px';
            btn.appendChild(rpl);
            rpl.addEventListener('animationend', () => rpl.remove());
        });
    }

    /* ─── VISUALIZER (animado, sin Web Audio API para no interferir el audio) ─── */
    function sizViz() {
        vizCvs.width  = vizCvs.clientWidth;
        vizCvs.height = vizCvs.clientHeight;
    }
    window.addEventListener('resize', sizViz);

    function mockViz() {
        requestAnimationFrame(mockViz);
        vizCtx.clearRect(0, 0, vizCvs.width, vizCvs.height);
        const n = 28, bw = vizCvs.width / n;
        const t = Date.now();
        for (let i = 0; i < n; i++) {
            const fac = bgVideo.paused ? .05 : .88;
            const wave = Math.sin(t * .003 + i * .35) * 0.38
                       + Math.sin(t * .005 + i * .6) * 0.18;
            const bh = (wave + 0.55) * vizCvs.height * fac;
            const alpha = 0.28 + (bh / vizCvs.height) * 0.55;
            vizCtx.fillStyle = `rgba(255,255,255,${alpha})`;
            const radius = 2;
            const x = i * bw + 1, y = vizCvs.height - bh, w = bw - 2;
            vizCtx.beginPath();
            vizCtx.roundRect(x, y, w, bh, [radius, radius, 0, 0]);
            vizCtx.fill();
        }
    }

    /* ─── CONTROLES DEL PLAYER ─── */
    playBtn.addEventListener('click', () => {
        bgVideo.paused ? bgVideo.play() : bgVideo.pause();
    });

    const avWrap = document.querySelector('.av-wrap');

    bgVideo.addEventListener('play', () => {
        playIcon.className = 'fa-solid fa-pause';
        disc.classList.add('playing');
        playBtn.classList.add('playing');
        avWrap.classList.add('music-playing');
    });

    bgVideo.addEventListener('pause', () => {
        playIcon.className = 'fa-solid fa-play';
        disc.classList.remove('playing');
        playBtn.classList.remove('playing');
        avWrap.classList.remove('music-playing');
    });

    bgVideo.addEventListener('timeupdate', () => {
        if (!bgVideo.duration) return;
        progFill.style.width = (bgVideo.currentTime / bgVideo.duration * 100) + '%';
        tNow.textContent = fmt(bgVideo.currentTime);
    });

    bgVideo.addEventListener('loadedmetadata', () => {
        tEnd.textContent = fmt(bgVideo.duration);
    });

    bgVideo.addEventListener('ended', () => {
        bgVideo.currentTime = 0;
        bgVideo.play();
    });

    /* Progress bar — click + drag */
    let dragging = false;
    function seekTo(e) {
        if (!bgVideo.duration) return;
        const r = progBar.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        bgVideo.currentTime = pct * bgVideo.duration;
    }
    progBar.addEventListener('mousedown', e => { dragging = true; seekTo(e); });
    document.addEventListener('mousemove', e => { if (dragging) seekTo(e); });
    document.addEventListener('mouseup', () => { dragging = false; });

    vol.addEventListener('input', e => {
        const v = +e.target.value;
        bgVideo.volume = v;
        if (v > 0) savedVol = v;
        volIcon.className = v === 0 ? 'fa-solid fa-volume-xmark'
                          : v < .4  ? 'fa-solid fa-volume-low'
                          :            'fa-solid fa-volume-high';
        muted = v === 0;
        syncMute(muted);
    });

    muteBtn.addEventListener('click', toggleMute);
    volIcon.addEventListener('click', toggleMute);

    function toggleMute() {
        if (muted) {
            bgVideo.volume = savedVol;
            vol.value = savedVol;
            volIcon.className = savedVol < .4 ? 'fa-solid fa-volume-low' : 'fa-solid fa-volume-high';
            muted = false;
            syncMute(false);
        } else {
            savedVol = bgVideo.volume || .7;
            bgVideo.volume = 0;
            vol.value = 0;
            volIcon.className = 'fa-solid fa-volume-xmark';
            muted = true;
            syncMute(true);
        }
    }

    function syncMute(m) {
        muteIcon.className        = m ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
        muteBtn.style.color       = m ? '#ff0055' : '';
        muteBtn.style.borderColor = m ? 'rgba(255,0,85,.4)' : '';
    }

    function fmt(s) {
        if (isNaN(s)) return '0:00';
        return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
    }

    /* ─── TYPEWRITER ─── */
    const bios = [
        'Red Team Operator',
        'Exploit Developer',
        'Reverse Engineer',
        'Bypassing firewalls...',
        'enjoy the pain',
        'Vi0lence.exe',
    ];
    let bi = 0, ci = 0, del = false, spd = 80;

    function tw() {
        const t = bios[bi];
        del ? twEl.textContent = t.slice(0, --ci) : twEl.textContent = t.slice(0, ++ci);
        spd = del ? 30 : 80;
        if (!del && ci === t.length) { spd = 2000; del = true; }
        else if (del && ci === 0)   { del = false; bi = (bi + 1) % bios.length; spd = 400; }
        setTimeout(tw, spd);
    }
    setTimeout(tw, 1400);

    /* ─── KEYBOARD SHORTCUTS ─── */
    document.addEventListener('keydown', e => {
        if (!overlay.classList.contains('out')) return;
        if (e.code === 'Space') {
            e.preventDefault();
            bgVideo.paused ? bgVideo.play() : bgVideo.pause();
        }
        if (e.code === 'KeyM') toggleMute();
    });

    /* ─── SOCIAL NO INFO TOAST ─── */
    const toast = document.getElementById('toast');
    let toastTimer;
    document.querySelectorAll('.noinfo-soc').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            clearTimeout(toastTimer);
            toast.classList.remove('hide');
            toast.classList.add('show');
            toastTimer = setTimeout(() => {
                toast.classList.replace('show', 'hide');
            }, 2000);
        });
    });

    /* ─── COPY USERNAME ─── */
    document.querySelector('.name').addEventListener('click', function() {
        navigator.clipboard.writeText('Vi0lence.exe').catch(() => {});
        this.classList.add('copied');
        setTimeout(() => this.classList.remove('copied'), 1400);
    });

});
