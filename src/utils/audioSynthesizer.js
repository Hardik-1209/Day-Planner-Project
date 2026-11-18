/**
 * Procedural Web Audio Synthesizer (Zero external audio files)
 * Implements Paul Kellet pink noise (Rain), filtered White Noise, and Lo-Fi warm drone.
 * Uses AnalyserNode for live 60fps waveform visualization and exponential gain ramps.
 */

class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;
    this.activeNodes = [];
    this.currentSound = 'off';
    this.volume = 0.6;
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      // Exponential ramp to eliminate clicks
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
      this.masterGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, this.volume), now + 0.1);
    }
  }

  stopAll(rampTime = 0.2) {
    if (!this.ctx || this.activeNodes.length === 0) return;

    const now = this.ctx.currentTime;
    for (const node of this.activeNodes) {
      if (node.gain) {
        node.gain.gain.cancelScheduledValues(now);
        node.gain.gain.setValueAtTime(Math.max(0.0001, node.gain.gain.value), now);
        node.gain.gain.exponentialRampToValueAtTime(0.0001, now + rampTime);
      }
      setTimeout(() => {
        try {
          if (node.source && typeof node.source.stop === 'function') {
            node.source.stop();
          }
          if (node.source && typeof node.source.disconnect === 'function') {
            node.source.disconnect();
          }
        } catch (e) {
          // ignore already stopped
        }
      }, rampTime * 1000 + 50);
    }
    this.activeNodes = [];
    this.currentSound = 'off';
  }

  // 1. Rain Synthesizer (Paul Kellet Pink Noise Algorithm)
  playRain() {
    this.init();
    this.stopAll(0.15);

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Paul Kellet's filter method
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11; // scale down
      b6 = white * 0.115926;
    }

    const whiteNoiseSource = this.ctx.createBufferSource();
    whiteNoiseSource.buffer = noiseBuffer;
    whiteNoiseSource.loop = true;

    // Filter to simulate raindrops hitting surfaces
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1200, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.7, this.ctx.currentTime + 0.3);

    whiteNoiseSource.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.masterGain);

    whiteNoiseSource.start();
    this.activeNodes.push({ source: whiteNoiseSource, gain });
    this.currentSound = 'rain';
  }

  // 2. White Noise (Crisp Air)
  playWhiteNoise() {
    this.init();
    this.stopAll(0.15);

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.15;
    }

    const whiteNoiseSource = this.ctx.createBufferSource();
    whiteNoiseSource.buffer = noiseBuffer;
    whiteNoiseSource.loop = true;

    // Soft bandpass
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1000, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(0.5, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.6, this.ctx.currentTime + 0.3);

    whiteNoiseSource.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.masterGain);

    whiteNoiseSource.start();
    this.activeNodes.push({ source: whiteNoiseSource, gain });
    this.currentSound = 'whitenoise';
  }

  // 3. Lo-Fi Warm Drone (Binaural Harmonic Oscillators)
  playLoFi() {
    this.init();
    this.stopAll(0.15);

    // Fundamental A2 (110Hz) & Perfect 5th E3 (164.81Hz)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(110, this.ctx.currentTime);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(164.81, this.ctx.currentTime);

    // Warm lowpass filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    // Subtle LFO modulation (0.15Hz slow breathing)
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(30, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.5, this.ctx.currentTime + 0.4);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start();
    osc2.start();
    lfo.start();

    this.activeNodes.push({ source: osc1, gain });
    this.activeNodes.push({ source: osc2, gain: null });
    this.activeNodes.push({ source: lfo, gain: null });
    this.currentSound = 'lofi';
  }

  getWaveformData(dataArray) {
    if (!this.analyser) return false;
    this.analyser.getByteFrequencyData(dataArray);
    return true;
  }
}

export const audioSynth = new AudioSynthesizer();

