const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const formatTime = (seconds: number) => {
  const time = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor(time / 60) % 60;
  const remainder = String(time % 60).padStart(2, '0');
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${remainder}` : `${minutes}:${remainder}`;
};

function initVideoPlayers() {
  for (const player of document.querySelectorAll<HTMLElement>('[data-video-player]')) {
    if (player.dataset.enhanced) continue;
    const video = player.querySelector<HTMLVideoElement>('video')!;
    const surface = player.querySelector<HTMLElement>('[data-video-surface]')!;
    const controls = player.querySelector<HTMLElement>('[data-video-controls]')!;
    const seek = player.querySelector<HTMLInputElement>('[data-video-seek]')!;
    const current = player.querySelector<HTMLElement>('[data-video-current]')!;
    const duration = player.querySelector<HTMLElement>('[data-video-duration]')!;
    const play = player.querySelector<HTMLButtonElement>('[data-video-play]')!;
    const centerPlay = player.querySelector<HTMLButtonElement>('[data-video-center-play]')!;
    const rate = player.querySelector<HTMLButtonElement>('[data-video-rate]')!;
    const rateMenu = player.querySelector<HTMLElement>('[data-video-rate-menu]')!;
    const rateOptions = [...player.querySelectorAll<HTMLButtonElement>('[data-video-rate-value]')];
    const volumeToggle = player.querySelector<HTMLButtonElement>('[data-video-volume-toggle]')!;
    const volumePanel = player.querySelector<HTMLElement>('[data-video-volume-panel]')!;
    const volume = player.querySelector<HTMLInputElement>('[data-video-volume]')!;
    const mute = player.querySelector<HTMLButtonElement>('[data-video-mute]')!;
    const fullscreen = player.querySelector<HTMLButtonElement>('[data-video-fullscreen]')!;
    const gesture = player.querySelector<HTMLOutputElement>('[data-video-gesture]')!;
    const feedback = player.querySelector<HTMLElement>('[data-video-feedback]')!;
    const preview = player.querySelector<HTMLOutputElement>('[data-video-preview]')!;
    const iosVideo = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    let sliding = false;
    let suppressClickUntil = 0;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    let feedbackTimer: ReturnType<typeof setTimeout> | undefined;
    let keyboardNavigation = false;
    let drag: { id: number; x: number; y: number; time: number; wasPlaying: boolean; active: boolean } | undefined;

    const hasDuration = () => Number.isFinite(video.duration) && video.duration > 0;
    const say = (message: string, persistent = false) => {
      clearTimeout(feedbackTimer);
      feedback.textContent = message;
      feedback.hidden = !message;
      if (message && !persistent) feedbackTimer = setTimeout(() => { feedback.hidden = true; }, 1800);
    };
    const revealControls = () => {
      clearTimeout(hideTimer);
      player.dataset.controlsVisible = 'true';
      if (video.paused || sliding || drag?.active || !rateMenu.hidden || !volumePanel.hidden || keyboardNavigation && controls.contains(document.activeElement)) return;
      hideTimer = setTimeout(() => {
        player.dataset.controlsVisible = 'false';
        preview.hidden = true;
      }, 2400);
    };
    const closePanels = () => {
      rateMenu.hidden = true;
      volumePanel.hidden = true;
      rate.setAttribute('aria-expanded', 'false');
      volumeToggle.setAttribute('aria-expanded', 'false');
      revealControls();
    };
    const syncProgress = () => {
      seek.disabled = !hasDuration();
      seek.max = hasDuration() ? String(video.duration) : '0';
      if (!sliding) seek.value = String(video.currentTime);
      current.textContent = formatTime(video.currentTime);
      duration.textContent = formatTime(video.duration);
      seek.setAttribute('aria-valuetext', `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`);
      player.style.setProperty('--video-progress', `${hasDuration() ? video.currentTime / video.duration * 100 : 0}%`);
      const buffered = video.buffered.length && hasDuration() ? video.buffered.end(video.buffered.length - 1) / video.duration * 100 : 0;
      player.style.setProperty('--video-buffered', `${buffered}%`);
    };
    const syncPlayback = () => {
      player.dataset.paused = String(video.paused);
      play.setAttribute('aria-label', video.paused ? '播放视频' : '暂停视频');
      centerPlay.hidden = !video.paused;
      centerPlay.setAttribute('aria-label', video.ended ? '重新播放视频' : '开始播放视频');
      rate.textContent = video.playbackRate === 1 ? '倍速' : `${video.playbackRate}×`;
      for (const button of rateOptions) button.setAttribute('aria-checked', String(Number(button.dataset.videoRateValue) === video.playbackRate));
      const silent = video.muted || video.volume === 0;
      player.dataset.muted = String(silent);
      volume.value = String(video.muted ? 0 : video.volume);
      volume.setAttribute('aria-valuetext', `${Math.round(Number(volume.value) * 100)}%`);
      mute.textContent = video.muted ? '取消静音' : '静音';
      mute.setAttribute('aria-label', video.muted ? '取消静音' : '静音');
      mute.setAttribute('aria-pressed', String(video.muted));
    };
    const resume = async () => {
      try { await video.play(); say(''); }
      catch { say('播放未能开始，请再次点击播放。', true); }
    };
    const togglePlay = () => { closePanels(); if (video.paused) void resume(); else video.pause(); };
    const seekTo = (seconds: number) => {
      if (!hasDuration()) return;
      video.currentTime = clamp(seconds, 0, video.duration);
      syncProgress();
    };
    const setRate = (value: number) => {
      video.playbackRate = clamp(value, 0.5, 2);
      syncPlayback();
      say(`播放速度 ${video.playbackRate}×`);
      revealControls();
    };
    const toggleFullscreen = async () => {
      try {
        if (document.fullscreenElement === player) await document.exitFullscreen();
        else if (player.requestFullscreen && document.fullscreenEnabled) await player.requestFullscreen();
        else iosVideo.webkitEnterFullscreen?.();
      } catch { say('当前浏览器无法进入全屏。'); }
    };

    play.addEventListener('click', togglePlay);
    centerPlay.addEventListener('click', togglePlay);
    rate.addEventListener('click', () => {
      const open = rateMenu.hidden;
      closePanels();
      rateMenu.hidden = !open;
      rate.setAttribute('aria-expanded', String(open));
      if (open) rateOptions.find((button) => button.getAttribute('aria-checked') === 'true')?.focus({ preventScroll: true });
      revealControls();
    });
    for (const button of rateOptions) button.addEventListener('click', () => {
      setRate(Number(button.dataset.videoRateValue));
      closePanels();
      rate.focus({ preventScroll: true });
    });
    rateMenu.addEventListener('keydown', (event) => {
      const index = rateOptions.indexOf(document.activeElement as HTMLButtonElement);
      if (event.key === 'ArrowDown') rateOptions[(index + 1) % rateOptions.length]?.focus();
      else if (event.key === 'ArrowUp') rateOptions[(index + rateOptions.length - 1) % rateOptions.length]?.focus();
      else if (event.key === 'Escape') { closePanels(); rate.focus(); }
      else if (event.key === 'Tab') { closePanels(); return; }
      else return;
      event.preventDefault();
      event.stopPropagation();
    });
    volumeToggle.addEventListener('click', () => {
      const open = volumePanel.hidden;
      closePanels();
      volumePanel.hidden = !open;
      volumeToggle.setAttribute('aria-expanded', String(open));
      if (open && keyboardNavigation) volume.focus();
      revealControls();
    });
    volume.addEventListener('input', () => { video.muted = false; video.volume = Number(volume.value); });
    mute.addEventListener('click', () => { video.muted = !video.muted; });
    fullscreen.disabled = !(document.fullscreenEnabled && player.requestFullscreen) && !iosVideo.webkitEnterFullscreen;
    fullscreen.addEventListener('click', () => { void toggleFullscreen(); });
    document.addEventListener('fullscreenchange', () => {
      const active = document.fullscreenElement === player;
      player.dataset.fullscreen = String(active);
      fullscreen.setAttribute('aria-label', active ? '退出全屏' : '全屏观看');
      revealControls();
    });

    seek.addEventListener('pointerdown', () => { sliding = true; revealControls(); });
    seek.addEventListener('input', () => seekTo(Number(seek.value)));
    const finishSlider = () => { if (!sliding) return; sliding = false; syncProgress(); revealControls(); };
    seek.addEventListener('change', finishSlider);
    seek.addEventListener('blur', finishSlider);
    window.addEventListener('pointerup', finishSlider);
    window.addEventListener('pointercancel', finishSlider);
    seek.addEventListener('pointermove', (event) => {
      if (!hasDuration() || event.pointerType === 'touch') return;
      const bounds = seek.getBoundingClientRect();
      const position = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
      preview.textContent = formatTime(position * video.duration);
      preview.style.left = `${clamp(position * 100, 5, 95)}%`;
      preview.hidden = false;
    });
    seek.addEventListener('pointerleave', () => { preview.hidden = true; });
    player.addEventListener('pointermove', revealControls);
    player.addEventListener('pointerdown', (event) => {
      keyboardNavigation = false;
      if (!(event.target instanceof Element) || !event.target.closest('.demo-speed, .demo-volume')) closePanels();
      revealControls();
    });
    document.addEventListener('pointerdown', (event) => {
      if (event.target instanceof Node && !player.contains(event.target)) closePanels();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') keyboardNavigation = true;
    });
    player.addEventListener('focusin', revealControls);
    player.addEventListener('focusout', () => { setTimeout(() => { if (!player.contains(document.activeElement)) { keyboardNavigation = false; closePanels(); } }, 0); });

    surface.addEventListener('click', () => {
      if (Date.now() < suppressClickUntil) return;
      if (matchMedia('(pointer: coarse)').matches && player.dataset.controlsVisible === 'false') { revealControls(); return; }
      player.focus({ preventScroll: true });
      togglePlay();
    });
    surface.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.button !== 0 || !hasDuration()) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, time: video.currentTime, wasPlaying: !video.paused, active: false };
    });
    surface.addEventListener('pointermove', (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.active) {
        if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) { drag = undefined; return; }
        if (Math.abs(dx) < 10) return;
        drag.active = true;
        surface.setPointerCapture(event.pointerId);
        video.pause();
      }
      event.preventDefault();
      // A full-width swipe spans at most 90 seconds, retaining precision for long demos.
      const seconds = dx / surface.getBoundingClientRect().width * Math.min(video.duration, 90);
      seekTo(drag.time + seconds);
      gesture.textContent = `${seconds >= 0 ? '快进' : '后退'} ${Math.abs(video.currentTime - drag.time).toFixed(1)} 秒 · ${formatTime(video.currentTime)}`;
      gesture.hidden = false;
      revealControls();
    });
    const finishGesture = (event: PointerEvent, cancelled = false) => {
      if (!drag || event.pointerId !== drag.id) return;
      const previous = drag;
      drag = undefined;
      if (!previous.active) return;
      suppressClickUntil = Date.now() + 400;
      gesture.hidden = true;
      if (cancelled) seekTo(previous.time);
      if (surface.hasPointerCapture(event.pointerId)) surface.releasePointerCapture(event.pointerId);
      if (previous.wasPlaying) void resume();
      revealControls();
    };
    window.addEventListener('pointerup', (event) => finishGesture(event));
    surface.addEventListener('pointercancel', (event) => finishGesture(event, true));
    surface.addEventListener('lostpointercapture', (event) => finishGesture(event, true));

    player.addEventListener('keydown', (event) => {
      revealControls();
      if (event.key === 'Escape' && (!rateMenu.hidden || !volumePanel.hidden)) { closePanels(); event.preventDefault(); return; }
      if (event.target instanceof Element && event.target.closest('button, input, select, a') || event.altKey || event.ctrlKey || event.metaKey) return;
      switch (event.key) {
        case ' ': case 'k': togglePlay(); break;
        case 'ArrowLeft': seekTo(video.currentTime - 5); break;
        case 'ArrowRight': seekTo(video.currentTime + 5); break;
        case '[': setRate(video.playbackRate - 0.25); break;
        case ']': setRate(video.playbackRate + 0.25); break;
        case 'm': video.muted = !video.muted; break;
        case 'f': void toggleFullscreen(); break;
        default: return;
      }
      event.preventDefault();
    });
    for (const event of ['loadedmetadata', 'durationchange', 'timeupdate', 'seeked', 'emptied', 'progress']) video.addEventListener(event, syncProgress);
    for (const event of ['play', 'pause', 'ended', 'ratechange', 'volumechange']) video.addEventListener(event, syncPlayback);
    for (const event of ['play', 'pause', 'ended']) video.addEventListener(event, revealControls);
    video.addEventListener('error', () => say('视频加载失败，请刷新页面。', true));
    syncProgress();
    syncPlayback();
    controls.hidden = false;
    video.controls = false;
    player.dataset.enhanced = 'true';
    revealControls();
  }
}

initVideoPlayers();
document.addEventListener('astro:page-load', initVideoPlayers);
