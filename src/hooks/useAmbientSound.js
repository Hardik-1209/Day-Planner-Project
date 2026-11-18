import { useEffect, useCallback } from 'react';
import { audioSynth } from '../utils/audioSynthesizer';

export function useAmbientSound(ambientSound, volume) {
  useEffect(() => {
    if (ambientSound === 'rain') {
      audioSynth.playRain();
    } else if (ambientSound === 'whitenoise') {
      audioSynth.playWhiteNoise();
    } else if (ambientSound === 'lofi') {
      audioSynth.playLoFi();
    } else {
      audioSynth.stopAll(0.15);
    }
  }, [ambientSound]);

  useEffect(() => {
    audioSynth.setVolume(volume);
  }, [volume]);

  const getWaveformData = useCallback((dataArray) => {
    return audioSynth.getWaveformData(dataArray);
  }, []);

  return { getWaveformData };
}

