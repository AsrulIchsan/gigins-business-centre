/**
 * lib/audio-notification.ts
 * Real-time Audio Synthesizer for POS Cashier Notifications
 * Uses standard Web Audio API (100% self-contained, no external MP3/WAV dependencies, zero CORS issues).
 */

let cachedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!cachedAudioCtx || cachedAudioCtx.state === "closed") {
      cachedAudioCtx = new AudioContextClass();
    }
    if (cachedAudioCtx.state === "suspended") {
      cachedAudioCtx.resume().catch(() => {});
    }
    return cachedAudioCtx;
  } catch (err) {
    console.warn("AudioContext init error:", err);
    return null;
  }
}

/**
 * Memainkan suara bel dering notifikasi pesanan baru masuk ("Ding-Dong-Ding")
 * Lembut, jelas, dan profesional untuk lingkungan apotek / kasir ritel.
 */
export function playNewOrderChime(volume = 0.35): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Frekuensi Melodik 3 Nada Cerah: E5 (659Hz) -> A5 (880Hz) -> C#6 (1108Hz)
    const notes = [
      { freq: 659.25, start: 0, duration: 0.22 },
      { freq: 880.0, start: 0.16, duration: 0.25 },
      { freq: 1108.73, start: 0.34, duration: 0.45 },
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(note.freq, now + note.start);

      // Envelope: Fast attack, natural exponential release
      gain.gain.setValueAtTime(0.0001, now + note.start);
      gain.gain.exponentialRampToValueAtTime(volume, now + note.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.start);
      osc.stop(now + note.start + note.duration);
    });
  } catch (err) {
    console.warn("Failed to play new order chime:", err);
  }
}

/**
 * Suara konfirmasi sukses aksi (misal: status berhasil diupdate atau struk dicetak)
 */
export function playSuccessChime(volume = 0.25): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.15); // C6

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch (err) {
    console.warn("Failed to play success chime:", err);
  }
}

/**
 * Cek apakah suara notifikasi diaktifkan pengguna di localStorage (default: true)
 */
export function isAudioNotificationEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const saved = localStorage.getItem("pos_sound_notification_enabled");
    return saved !== null ? saved === "true" : true;
  } catch {
    return true;
  }
}

/**
 * Simpan preferensi suara notifikasi
 */
export function setAudioNotificationEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pos_sound_notification_enabled", enabled ? "true" : "false");
  } catch {}
}
