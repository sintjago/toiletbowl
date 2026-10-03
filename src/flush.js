const DURATION = 4200;

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function span(t, start, end) {
  return clamp01((t - start) / (end - start));
}

function easeOut(t) {
  return 1 - (1 - t) ** 3;
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

export function poseAt(t) {
  const handle = easeOut(span(t, 0, 0.07)) * (1 - easeInOut(span(t, 0.78, 0.9)));
  const lid = easeInOut(span(t, 0.04, 0.18)) * (1 - easeInOut(span(t, 0.84, 0.98)));
  const seat = 0;
  const drain = easeInOut(span(t, 0.16, 0.48));
  const fill = easeInOut(span(t, 0.52, 0.78));
  const level = 1 - drain * 0.88 + fill * 0.88;
  const swirl = t * Math.PI * 10;
  const shake = Math.sin(t * 42) * drain * (1 - fill) * 5;

  return { t, handle, lid, seat, level, swirl, shake, active: t > 0 && t < 1 };
}

export function idlePose() {
  return { t: 0, handle: 0, lid: 0, seat: 0, level: 1, swirl: 0, shake: 0, active: false };
}

export function createFlush() {
  let started = 0;
  let running = false;
  const listeners = new Set();

  const flush = {
    duration: DURATION,
    start() {
      if (running) return false;
      running = true;
      started = performance.now();
      playFlushSound();
      listeners.forEach((fn) => fn());
      return true;
    },
    reset() {
      running = false;
      started = 0;
    },
    sample(now = performance.now()) {
      if (!running) return idlePose();
      const t = (now - started) / DURATION;
      if (t >= 1) {
        running = false;
        return idlePose();
      }
      return poseAt(t);
    },
    onStart(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    get running() {
      return running;
    },
  };

  return flush;
}

export function playFlushSound() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const now = ctx.currentTime;

  const noise = ctx.createBuffer(1, ctx.sampleRate * 1.6, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }

  const source = ctx.createBufferSource();
  source.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800, now);
  filter.frequency.exponentialRampToValueAtTime(280, now + 1.4);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.55);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(now);
  source.stop(now + 1.6);
  source.onended = () => ctx.close();
}
