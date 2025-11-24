import { useEffect, useRef } from "react";

export default function useAlertAudio() {
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const unlock = () => {
      if (!window.AudioContext) return;
      if (!ctxRef.current) ctxRef.current = new window.AudioContext();
      if (ctxRef.current.state === "suspended") {
        ctxRef.current.resume();
      }
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const unlockAudio = () => {
    if (!window.AudioContext) return;
    if (!ctxRef.current) ctxRef.current = new window.AudioContext();
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
  };

  const beep = () => {
    const ctx = ctxRef.current;
    if (!ctx || ctx.state !== "running") return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(ctx.destination);
    const t = ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.08, t + 0.01);
    o.start();
    o.stop(t + 1);
  };

  return { unlockAudio, beep };
}
