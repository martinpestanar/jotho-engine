"use client"

// Utilidad para sintetizar sonidos retro estilo Pokémon usando Web Audio API
class JohtoSoundEngine {
  private ctx: AudioContext | null = null

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number) {
    this.init()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime)
    
    gain.gain.setValueAtTime(volume, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start()
    osc.stop(this.ctx.currentTime + duration)
  }

  playTick() {
    // Un "blip" muy sutil
    this.playTone(880, "sine", 0.05, 0.05)
  }

  playBuy() {
    // Sonido de éxito ascendente
    this.init()
    if (!this.ctx) return
    const now = this.ctx.currentTime
    this.playTone(523.25, "square", 0.1, 0.1) // C5
    setTimeout(() => this.playTone(659.25, "square", 0.1, 0.1), 50) // E5
    setTimeout(() => this.playTone(783.99, "square", 0.2, 0.1), 100) // G5
  }

  playSell() {
    // Sonido descendente
    this.playTone(783.99, "square", 0.1, 0.1) // G5
    setTimeout(() => this.playTone(523.25, "square", 0.2, 0.1), 100) // C5
  }

  playNotification() {
    this.playTone(440, "triangle", 0.1, 0.1)
    setTimeout(() => this.playTone(880, "triangle", 0.1, 0.1), 100)
  }
}

export const johtoSounds = new JohtoSoundEngine()
