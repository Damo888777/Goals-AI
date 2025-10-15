import { Audio } from 'expo-av';

class SoundService {
  private completeSound: Audio.Sound | null = null;
  private successSound: Audio.Sound | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Load sounds
      const { sound: completeSound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/Complete Sound.mp3'),
        { shouldPlay: false }
      );
      this.completeSound = completeSound;

      const { sound: successSound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/Success Sound.mp3'),
        { shouldPlay: false }
      );
      this.successSound = successSound;

      this.isInitialized = true;
      console.log('Sound service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize sound service:', error);
    }
  }

  async playCompleteSound() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (this.completeSound) {
        await this.completeSound.setPositionAsync(0);
        await this.completeSound.playAsync();
      }
    } catch (error) {
      console.error('Error playing complete sound:', error);
    }
  }

  async playSuccessSound() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (this.successSound) {
        await this.successSound.setPositionAsync(0);
        await this.successSound.playAsync();
      }
    } catch (error) {
      console.error('Error playing success sound:', error);
    }
  }

  async cleanup() {
    try {
      if (this.completeSound) {
        await this.completeSound.unloadAsync();
        this.completeSound = null;
      }
      if (this.successSound) {
        await this.successSound.unloadAsync();
        this.successSound = null;
      }
      this.isInitialized = false;
    } catch (error) {
      console.error('Error cleaning up sounds:', error);
    }
  }
}

// Export singleton instance
export const soundService = new SoundService();

// Initialize sounds when the service is imported
soundService.initialize();