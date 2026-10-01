import { Platform } from 'react-native';

let player = null;
let webAudio = null;

export const soundService = {
  init: async () => {
    try {
      if (Platform.OS === 'web') {
        if (typeof Audio !== 'undefined') {
          const soundAsset = require('../../assets/sounds/kitchen_ready.wav');
          const src = typeof soundAsset === 'string' ? soundAsset : soundAsset?.default || soundAsset?.uri || soundAsset;
          webAudio = new Audio(src);
          webAudio.preload = 'auto';
        }
      } else {
        const { createAudioPlayer } = require('expo-audio');
        const soundAsset = require('../../assets/sounds/kitchen_ready.wav');
        player = createAudioPlayer(soundAsset);
      }
    } catch (err) {
      console.warn('Could not initialize kitchen ready audio player:', err.message);
    }
  },

  playKitchenReadySound: async () => {
    try {
      if (Platform.OS === 'web') {
        if (!webAudio && typeof Audio !== 'undefined') {
          const soundAsset = require('../../assets/sounds/kitchen_ready.wav');
          const src = typeof soundAsset === 'string' ? soundAsset : soundAsset?.default || soundAsset?.uri || soundAsset;
          webAudio = new Audio(src);
        }
        if (webAudio) {
          webAudio.currentTime = 0;
          await webAudio.play().catch((e) => {
            console.log('Web audio autoplay note (browser interaction required):', e.message);
          });
        }
        return;
      }

      // Android / iOS
      if (!player) {
        const { createAudioPlayer } = require('expo-audio');
        const soundAsset = require('../../assets/sounds/kitchen_ready.wav');
        player = createAudioPlayer(soundAsset);
      }

      if (player) {
        if (typeof player.seekTo === 'function') {
          await player.seekTo(0);
        }
        player.play();
      }
    } catch (err) {
      console.warn('Failed to play kitchen ready sound:', err.message);
    }
  },

  release: () => {
    try {
      if (player && typeof player.release === 'function') {
        player.release();
        player = null;
      }
      if (webAudio) {
        webAudio.pause();
        webAudio = null;
      }
    } catch (err) {
      // ignore
    }
  },
};

export default soundService;
