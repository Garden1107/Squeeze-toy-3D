/**
 * Realistic Procedural ASMR Web Audio Synthesizer
 * Zero external audio files (100% procedural, zero 404s).
 * Synthesizes ultra-tactile sounds: crispy crunches, rubber duck quacks,
 * puppy barks, car horn beeps, water droplets & splashes, liquid sloshing,
 * bubble pops, sticky slimes, and slow-rising squishies.
 */

export type TextureType =
  | 'squishy'
  | 'taba'
  | 'glossy_slime'
  | 'crunch_mallangi'
  | 'crunch_slime'
  | 'water_ball';

export type SoundProfile =
  | 'auto'            // 질감별 기본 사운드
  | 'crispy_crunch'   // 바삭바삭 크런치 (감자칩/과자/비즈)
  | 'duck_quack'      // 꽥꽥 러버덕 삑삑이
  | 'puppy_bark'      // 멍멍이 강아지 소리
  | 'car_horn'        // 자동차 경적 빵빵
  | 'water_drop'      // 퐁당퐁당 물방울 물소리
  | 'water_slosh'     // 찰랑찰랑 꿀렁이는 물소리
  | 'bubble_pop'      // 뽁뽁이 버블팝
  | 'slime_sticky'    // 쫩쫩 찰진 슬라임
  | 'squishy_classic'; // 뽀송 슬로우라이징

class ASMRSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private crunchGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.85;
  private asmrBoost: boolean = true;
  private soundProfile: SoundProfile = 'auto';
  private lastPlayTime: number = 0;

  constructor() {
    // Initialized on first interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.crunchGain = this.ctx.createGain();

      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.crunchGain.gain.setValueAtTime(this.asmrBoost ? 1.4 : 1.0, this.ctx.currentTime);

      this.crunchGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSoundProfile(profile: SoundProfile) {
    this.soundProfile = profile;
  }

  public getSoundProfile(): SoundProfile {
    return this.soundProfile;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.volume, this.ctx.currentTime, 0.02);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setAsmrBoost(boost: boolean) {
    this.asmrBoost = boost;
    if (this.crunchGain && this.ctx) {
      this.crunchGain.gain.setTargetAtTime(boost ? 1.4 : 1.0, this.ctx.currentTime, 0.02);
    }
  }

  public getAsmrBoost(): boolean {
    return this.asmrBoost;
  }

  /**
   * Helper to generate a burst of shaped noise buffer (pink, white, crunch, water)
   */
  private createNoiseBuffer(duration: number, type: 'white' | 'pink' | 'crunch' | 'water' = 'white'): AudioBuffer {
    if (!this.ctx) this.initContext();
    const ctx = this.ctx!;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;

      if (type === 'white') {
        output[i] = white;
      } else if (type === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else if (type === 'crunch') {
        // Crisp granular micro-crackles
        if (Math.random() < 0.22) {
          output[i] = (Math.random() * 2 - 1) * Math.pow(Math.random(), 1.5);
        } else {
          output[i] = (Math.random() * 0.04 - 0.02);
        }
      } else if (type === 'water') {
        // Fluid turbulent water noise
        b0 = 0.94 * b0 + white * 0.12;
        output[i] = b0 * 0.8;
      }
    }
    return buffer;
  }

  /**
   * Play squish/touch sound based on active sound profile and texture
   */
  public playSquish(texture: TextureType, intensity: number = 0.7, pan: number = 0) {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    if (now - this.lastPlayTime < 0.02) return;
    this.lastPlayTime = now;

    const clampedIntensity = Math.min(Math.max(intensity, 0.25), 1.6);
    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), now);
    panner.connect(this.crunchGain!);

    // Check custom sound profile first
    if (this.soundProfile !== 'auto') {
      switch (this.soundProfile) {
        case 'crispy_crunch':
          this.synthesizeCrispyCrunch(panner, clampedIntensity);
          return;
        case 'duck_quack':
          this.synthesizeDuckQuack(panner, clampedIntensity);
          return;
        case 'puppy_bark':
          this.synthesizePuppyBark(panner, clampedIntensity);
          return;
        case 'car_horn':
          this.synthesizeCarHorn(panner, clampedIntensity);
          return;
        case 'water_drop':
          this.synthesizeWaterDrop(panner, clampedIntensity);
          return;
        case 'water_slosh':
          this.synthesizeWaterSlosh(panner, clampedIntensity);
          return;
        case 'bubble_pop':
          this.synthesizeBubblePop(panner, clampedIntensity);
          return;
        case 'slime_sticky':
          this.synthesizeSlime(panner, clampedIntensity);
          return;
        case 'squishy_classic':
          this.synthesizeSquishy(panner, clampedIntensity);
          return;
      }
    }

    // Default: texture-linked procedural audio
    switch (texture) {
      case 'squishy':
        this.synthesizeSquishy(panner, clampedIntensity);
        break;
      case 'taba':
        this.synthesizeTaba(panner, clampedIntensity);
        break;
      case 'glossy_slime':
        this.synthesizeSlime(panner, clampedIntensity);
        break;
      case 'crunch_mallangi':
        this.synthesizeCrunchMallangi(panner, clampedIntensity);
        break;
      case 'crunch_slime':
        this.synthesizeCrunchSlime(panner, clampedIntensity);
        break;
      case 'water_ball':
        this.synthesizeWaterSlosh(panner, clampedIntensity);
        break;
    }
  }

  // ==========================================
  // 1. 바삭바삭 크런치 (Crispy Crunch / Chips & Wrapper)
  // ==========================================
  public synthesizeCrispyCrunch(destination: AudioNode, intensity: number) {
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Granular micro-bursts of ultra-crispy cracks (12-22 crackles)
    const count = Math.floor(14 + intensity * 10);
    for (let i = 0; i < count; i++) {
      const delay = Math.random() * 0.11;
      const t = now + delay;
      const dur = 0.007 + Math.random() * 0.012;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      // Sharp high-crisp resonant teeth
      osc.type = Math.random() > 0.4 ? 'triangle' : 'sawtooth';
      const freq = 2400 + Math.random() * 4800;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(800 + Math.random() * 600, t + dur);

      gain.gain.setValueAtTime(0.3 * intensity, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      osc.connect(gain);
      gain.connect(destination);

      osc.start(t);
      osc.stop(t + dur);
    }

    // Crisp high-pass crackle noise bed
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.12, 'crunch');
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2800, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4 * intensity, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(destination);

    noise.start(now);
    noise.stop(now + 0.12);

    // Deep crunchy tooth thump
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(260, now);
    thud.frequency.exponentialRampToValueAtTime(60, now + 0.06);

    thudGain.gain.setValueAtTime(0.35 * intensity, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    thud.connect(thudGain);
    thudGain.connect(destination);
    thud.start(now);
    thud.stop(now + 0.06);
  }

  // ==========================================
  // 2. 꽥꽥 러버덕 삑삑이 (Rubber Duck Squeaker Quack)
  // ==========================================
  public synthesizeDuckQuack(destination: AudioNode, intensity: number) {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const dur = 0.18 * intensity + 0.04;

    // Dual reed oscillators with slight detune for iconic nasal toy quack
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';

    // Characteristic duck quack pitch envelope (starts high ~600Hz, scoops down with funny pitch bend)
    const baseFreq = 480 + Math.random() * 40;
    osc1.frequency.setValueAtTime(baseFreq * 1.35, now);
    osc1.frequency.linearRampToValueAtTime(baseFreq * 1.5, now + 0.03);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.72, now + dur);

    osc2.frequency.setValueAtTime(baseFreq * 1.37, now);
    osc2.frequency.linearRampToValueAtTime(baseFreq * 1.52, now + 0.03);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 0.74, now + dur);

    // Nasal vocal tract bandpass filter (duck beak resonance)
    const formantFilter = ctx.createBiquadFilter();
    formantFilter.type = 'bandpass';
    formantFilter.frequency.setValueAtTime(1150, now);
    formantFilter.frequency.linearRampToValueAtTime(850, now + dur);
    formantFilter.Q.setValueAtTime(4.2, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.48 * intensity, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc1.connect(formantFilter);
    osc2.connect(formantFilter);
    formantFilter.connect(gain);
    gain.connect(destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + dur);
    osc2.stop(now + dur);

    // High squeaker air intake whistle on release
    const squeak = ctx.createOscillator();
    const squeakGain = ctx.createGain();
    squeak.type = 'sine';
    squeak.frequency.setValueAtTime(1800, now + dur * 0.7);
    squeak.frequency.exponentialRampToValueAtTime(2400, now + dur + 0.05);

    squeakGain.gain.setValueAtTime(0.0001, now);
    squeakGain.gain.setValueAtTime(0.18 * intensity, now + dur * 0.7);
    squeakGain.gain.exponentialRampToValueAtTime(0.001, now + dur + 0.05);

    squeak.connect(squeakGain);
    squeakGain.connect(destination);
    squeak.start(now + dur * 0.7);
    squeak.stop(now + dur + 0.05);
  }

  // ==========================================
  // 3. 멍멍이 강아지 소리 (Puppy Squeaky Bark)
  // ==========================================
  public synthesizePuppyBark(destination: AudioNode, intensity: number) {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const dur = 0.14 * intensity + 0.04;

    // Puppy bark pitch envelope (quick energetic yip!)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';

    const startFreq = 380 + Math.random() * 40;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.linearRampToValueAtTime(startFreq * 1.9, now + 0.035);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.95, now + dur);

    // Vocal formant filters for puppy mouth ("멍!")
    const formant1 = ctx.createBiquadFilter();
    formant1.type = 'bandpass';
    formant1.frequency.setValueAtTime(750, now);
    formant1.Q.setValueAtTime(3.5, now);

    const formant2 = ctx.createBiquadFilter();
    formant2.type = 'bandpass';
    formant2.frequency.setValueAtTime(1600, now);
    formant2.Q.setValueAtTime(4.0, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.45 * intensity, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(formant1);
    formant1.connect(gain);
    osc.connect(formant2);
    formant2.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + dur);

    // Breath puff attack
    const puff = ctx.createBufferSource();
    puff.buffer = this.createNoiseBuffer(0.05, 'pink');
    const puffGain = ctx.createGain();
    puffGain.gain.setValueAtTime(0.2 * intensity, now);
    puffGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    puff.connect(puffGain);
    puffGain.connect(destination);
    puff.start(now);
    puff.stop(now + 0.05);

    // Double bark yip with 40% chance
    if (Math.random() < 0.45) {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        this.synthesizePuppyBark(destination, intensity * 0.85);
      }, 110 + Math.random() * 40);
    }
  }

  // ==========================================
  // 4. 자동차 경적 빵빵 (Car Horn Klaxon Beep)
  // ==========================================
  public synthesizeCarHorn(destination: AudioNode, intensity: number) {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const dur = 0.16 * intensity + 0.05;

    // Classic dual-tone car horn (F4 349Hz and A4 440Hz, or major third)
    const oscLow = ctx.createOscillator();
    const oscHigh = ctx.createOscillator();
    const hornGain = ctx.createGain();

    oscLow.type = 'sawtooth';
    oscHigh.type = 'sawtooth';

    const basePitch = 370 + Math.random() * 20;
    oscLow.frequency.setValueAtTime(basePitch, now);
    oscHigh.frequency.setValueAtTime(basePitch * 1.26, now); // Major third interval!

    // Horn acoustic resonance filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(2.2, now);

    hornGain.gain.setValueAtTime(0.01, now);
    hornGain.gain.linearRampToValueAtTime(0.42 * intensity, now + 0.015);
    hornGain.gain.setValueAtTime(0.42 * intensity, now + dur - 0.03);
    hornGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    oscLow.connect(filter);
    oscHigh.connect(filter);
    filter.connect(hornGain);
    hornGain.connect(destination);

    oscLow.start(now);
    oscHigh.start(now);
    oscLow.stop(now + dur);
    oscHigh.stop(now + dur);

    // Double beep on strong squeeze
    if (intensity > 0.8 && Math.random() < 0.6) {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        this.synthesizeCarHorn(destination, intensity * 0.75);
      }, 140);
    }
  }

  // ==========================================
  // 5. 퐁당퐁당 물방울 물소리 (Water Drop & Splash)
  // ==========================================
  public synthesizeWaterDrop(destination: AudioNode, intensity: number) {
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Resonant water droplet ping
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';

    const startFreq = 1600 + Math.random() * 400;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.075);

    gain.gain.setValueAtTime(0.5 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    osc.connect(gain);
    gain.connect(destination);
    osc.start(now);
    osc.stop(now + 0.075);

    // Splash ripple noise
    const splash = ctx.createBufferSource();
    splash.buffer = this.createNoiseBuffer(0.12, 'water');
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.Q.setValueAtTime(3.0, now);

    const splashGain = ctx.createGain();
    splashGain.gain.setValueAtTime(0.22 * intensity, now);
    splashGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    splash.connect(filter);
    filter.connect(splashGain);
    splashGain.connect(destination);
    splash.start(now);
    splash.stop(now + 0.12);

    // Mini echo droplet (찰방)
    setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      const t = this.ctx.currentTime;
      const o2 = this.ctx.createOscillator();
      const g2 = this.ctx.createGain();
      o2.type = 'sine';
      o2.frequency.setValueAtTime(1900 + Math.random() * 300, t);
      o2.frequency.exponentialRampToValueAtTime(800, t + 0.05);

      g2.gain.setValueAtTime(0.25 * intensity, t);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      o2.connect(g2);
      g2.connect(destination);
      o2.start(t);
      o2.stop(t + 0.05);
    }, 45);
  }

  // ==========================================
  // 6. 찰랑찰랑 꿀렁이는 물소리 (Liquid Slosh & Jelly Waves)
  // ==========================================
  public synthesizeWaterSlosh(destination: AudioNode, intensity: number) {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const dur = 0.22 * intensity + 0.08;

    // Sweeping turbulent fluid wave
    const waveNoise = ctx.createBufferSource();
    waveNoise.buffer = this.createNoiseBuffer(dur, 'water');

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(350, now);
    filter.frequency.linearRampToValueAtTime(1400, now + dur * 0.4);
    filter.frequency.linearRampToValueAtTime(450, now + dur);
    filter.Q.setValueAtTime(3.2, now);

    const waveGain = ctx.createGain();
    waveGain.gain.setValueAtTime(0.05, now);
    waveGain.gain.linearRampToValueAtTime(0.38 * intensity, now + dur * 0.3);
    waveGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    waveNoise.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(destination);
    waveNoise.start(now);
    waveNoise.stop(now + dur);

    // Deep fluid displacement thud
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, now);
    sub.frequency.exponentialRampToValueAtTime(55, now + 0.14);
    subGain.gain.setValueAtTime(0.35 * intensity, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    sub.connect(subGain);
    subGain.connect(destination);
    sub.start(now);
    sub.stop(now + 0.14);

    // 2-3 gentle liquid micro bubbles
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        this.playPop(1200 + Math.random() * 800, 0.15 * intensity);
      }, 35 + i * 40 + Math.random() * 20);
    }
  }

  // ==========================================
  // 7. 뽁뽁이 버블팝 (Bubble Wrap Pop)
  // ==========================================
  public synthesizeBubblePop(destination: AudioNode, intensity: number) {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const dur = 0.038;

    // Resonant air cavity ping
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const freq = 1100 + Math.random() * 600;
    osc.frequency.setValueAtTime(freq * 1.5, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.65, now + dur);

    gain.gain.setValueAtTime(0.48 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(gain);
    gain.connect(destination);
    osc.start(now);
    osc.stop(now + dur);

    // Sharp plastic click transient
    const click = ctx.createBufferSource();
    click.buffer = this.createNoiseBuffer(0.015, 'white');
    const cGain = ctx.createGain();
    cGain.gain.setValueAtTime(0.35 * intensity, now);
    cGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
    click.connect(cGain);
    cGain.connect(destination);
    click.start(now);
    click.stop(now + 0.015);
  }

  // ==========================================
  // Texture-default helpers
  // ==========================================
  private synthesizeSquishy(destination: AudioNode, intensity: number) {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const dur = 0.12 * intensity + 0.06;

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    const baseFreq = 160 + Math.random() * 30;
    osc.frequency.setValueAtTime(baseFreq * 1.5, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + dur);

    oscGain.gain.setValueAtTime(0.28 * intensity, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(oscGain);
    oscGain.connect(destination);
    osc.start(now);
    osc.stop(now + dur);

    const noiseBuffer = this.createNoiseBuffer(dur, 'pink');
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600 + Math.random() * 200, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + dur);
    filter.Q.setValueAtTime(2.5, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2 * intensity, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noiseSrc.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(destination);

    noiseSrc.start(now);
    noiseSrc.stop(now + dur);
  }

  private synthesizeTaba(destination: AudioNode, intensity: number) {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const dur = 0.14 * intensity + 0.05;

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130 + Math.random() * 20, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + dur);

    oscGain.gain.setValueAtTime(0.3 * intensity, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(oscGain);
    oscGain.connect(destination);
    osc.start(now);
    osc.stop(now + dur);

    const noiseBuffer = this.createNoiseBuffer(dur, 'pink');
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + dur);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.14 * intensity, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noiseSrc.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(destination);

    noiseSrc.start(now);
    noiseSrc.stop(now + dur);
  }

  private synthesizeSlime(destination: AudioNode, intensity: number) {
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    const startFreq = 420 + Math.random() * 120;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.09);

    oscGain.gain.setValueAtTime(0.42 * intensity, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(oscGain);
    oscGain.connect(destination);
    osc.start(now);
    osc.stop(now + 0.09);

    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.08, 'white');
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600 + Math.random() * 400, now);
    filter.frequency.exponentialRampToValueAtTime(600, now + 0.08);
    filter.Q.setValueAtTime(5.0, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.26 * intensity, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(destination);

    noise.start(now);
    noise.stop(now + 0.08);

    if (Math.random() < 0.6) {
      setTimeout(() => {
        if (!this.ctx) return;
        this.playPop(1200 + Math.random() * 600, 0.16 * intensity);
      }, 30 + Math.random() * 40);
    }
  }

  private synthesizeCrunchMallangi(destination: AudioNode, intensity: number) {
    this.synthesizeSquishy(destination, intensity * 0.7);
    this.synthesizeCrispyCrunch(destination, intensity * 0.9);
  }

  private synthesizeCrunchSlime(destination: AudioNode, intensity: number) {
    this.synthesizeSlime(destination, intensity * 0.85);
    this.synthesizeCrispyCrunch(destination, intensity * 1.0);
  }

  /**
   * Resonant Bubble Pop
   */
  public playPop(frequency: number = 1200, volume: number = 0.3) {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const dur = 0.035;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency * 1.6, now);
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.6, now + dur);

    gain.gain.setValueAtTime(volume * (this.asmrBoost ? 1.3 : 1.0), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(gain);
    gain.connect(this.crunchGain!);

    osc.start(now);
    osc.stop(now + dur);
  }

  /**
   * Slap / Tap Impact
   */
  public playSlap(intensity: number = 1.0) {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    if (this.soundProfile === 'duck_quack') {
      this.synthesizeDuckQuack(this.masterGain!, intensity * 1.4);
      return;
    }
    if (this.soundProfile === 'puppy_bark') {
      this.synthesizePuppyBark(this.masterGain!, intensity * 1.3);
      return;
    }
    if (this.soundProfile === 'car_horn') {
      this.synthesizeCarHorn(this.masterGain!, intensity * 1.4);
      return;
    }

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.07, 'white');
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.Q.setValueAtTime(2.0, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.42 * intensity, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain!);

    noise.start(now);
    noise.stop(now + 0.07);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

    oscGain.gain.setValueAtTime(0.42 * intensity, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  /**
   * Slow Rising Inhale Whisper
   */
  public playSlowRise(duration: number = 1.2) {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(duration, 'pink');
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, now);
    filter.frequency.exponentialRampToValueAtTime(900, now + duration * 0.7);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.08, now + duration * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    noise.start(now);
    noise.stop(now + duration);
  }

  /**
   * Topping Sprinkle Sound
   */
  public playSprinkle(count: number = 8) {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2200 + Math.random() * 2000, now);
        osc.frequency.exponentialRampToValueAtTime(1200 + Math.random() * 500, now + 0.03);

        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

        osc.connect(gain);
        gain.connect(this.crunchGain!);
        osc.start(now);
        osc.stop(now + 0.03);
      }, i * 28 + Math.random() * 15);
    }
  }
}

export const asmrEngine = new ASMRSoundEngine();
