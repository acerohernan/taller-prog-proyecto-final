// Small audio util to play a simple beep tone using WebAudio API
let _audioCtx = null;
function getAudioContext() {
  if (!_audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    _audioCtx = new Ctx();
  }
  return _audioCtx;
}

export async function ensureAudioResume() {
  const ctx = getAudioContext();
  if (!ctx) return false;
  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    return true;
  } catch (e) {
    // resume may fail if not triggered by user gesture
    return false;
  }
}

export async function playBeep({
  frequency = 1000,
  duration = 0.12,
  volume = 0.2,
  type = "sine",
} = {}) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    // try resuming if suspended; this will silently fail sometimes
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch (e) {
        // ignore
      }
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    // disconnect after stop
    osc.onended = () => {
      try {
        osc.disconnect();
      } catch (e) {}
      try {
        gain.disconnect();
      } catch (e) {}
    };
  } catch (err) {
    // Do nothing if audio fails
    // console.warn('playBeep failed', err);
  }
}

export const playScannerBeep = async () => {
  try {
    ensureAudioResume();
    playBeep({ frequency: 1200, duration: 0.1, volume: 0.15, type: "sine" });
  } catch (e) {
    console.error("No se pudo reproducir el audio:", e);
  }
};
