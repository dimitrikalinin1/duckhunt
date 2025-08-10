"use client"

// Простые звуки через WebAudio API — без внешних файлов.
import { useRef } from "react"

type SoundName = "shot" | "miss" | "hit" | "duck" | "beaver" | "ui" | "trap" | "rain"

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null)

  function ensureCtx() {
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      ctxRef.current = new AudioCtx()
    }
    return ctxRef.current!
  }

  function beep(freq: number, time = 0.08, type: OscillatorType = "sine", gain = 0.06) {
    const ctx = ensureCtx()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = type
    o.frequency.value = freq
    g.gain.value = gain
    o.connect(g)
    g.connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + time)
  }

  function play(name: SoundName) {
    // Набор "саунд-эмодзи"
    switch (name) {
      case "shot":
        beep(160, 0.03, "square", 0.08)
        setTimeout(() => beep(90, 0.05, "sawtooth", 0.06), 30)
        break
      case "miss":
        beep(320, 0.05, "triangle", 0.04)
        setTimeout(() => beep(240, 0.08, "triangle", 0.03), 40)
        break
      case "hit":
        beep(500, 0.06, "square", 0.07)
        setTimeout(() => beep(700, 0.06, "square", 0.06), 60)
        break
      case "duck":
        beep(420, 0.07, "triangle", 0.05)
        setTimeout(() => beep(380, 0.06, "triangle", 0.05), 80)
        break
      case "beaver":
        beep(140, 0.1, "sawtooth", 0.08)
        break
      case "trap":
        beep(250, 0.05, "square", 0.06)
        setTimeout(() => beep(180, 0.06, "square", 0.05), 50)
        break
      case "rain":
        // короткий "шум" через частые бипы
        for (let i = 0; i < 6; i++) setTimeout(() => beep(200 + Math.random() * 50, 0.02, "triangle", 0.02), i * 20)
        break
      case "ui":
      default:
        beep(600, 0.04, "sine", 0.04)
        break
    }
  }

  async function resume() {
    try {
      const ctx = ensureCtx()
      if (ctx.state === "suspended") await ctx.resume()
    } catch {}
  }

  return { play, resume }
}
