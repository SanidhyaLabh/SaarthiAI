/**
 * Haptic Feedback Service using Web Vibration API
 */
export const haptics = {
  // Light tap confirmation
  tap() {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(35);
      } catch (e) {
        // Ignored if vibration not permitted
      }
    }
  },

  // Double pulse for mode changes or success
  modeChange() {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([40, 60, 60]);
      } catch (e) {}
    }
  },

  // Strong warning for close obstacle (< 1.5m)
  warning() {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([80, 50, 100]);
      } catch (e) {}
    }
  },

  // Continuous hazard alert (immediate danger)
  hazard() {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([150, 80, 150, 80, 250]);
      } catch (e) {}
    }
  },

  // Emergency SOS rhythmic pulse
  sos() {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 400, 100, 200, 100, 200]);
      } catch (e) {}
    }
  }
};
