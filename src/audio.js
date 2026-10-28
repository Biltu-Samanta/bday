/**
 * Museum Audio System
 * - Distinct ambient music tracks for Rooms 1, 2, and 3:
 *     Room 1: /sounds/rooms sound/songs_1.mp3
 *     Room 2: /sounds/rooms sound/songs_2.mp3
 *     Room 3: /sounds/rooms sound/songs_3.mp3
 * - Smooth real-time crossfading between room music tracks
 * - Player footsteps SFX with walk / sprint pitch and speed variation:
 *     /sounds/footstep sound.mp3
 */

class MuseumAudio {
  constructor() {
    this.isInitialized = false;
    this.isPlaying = false; // Ambient music enabled
    this.currentRoom = 1;
    this.isMoviePlaying = false;
    this.isGamePaused = false;

    this.musicVolume = 0.35; // Target volume for ambient music
    this.sfxVolume = 0.5;    // Target volume for sound effects

    // Room audio instances: key 1, 2, 3
    this.roomAudios = {};
    this.targetVolumes = { 1: 0, 2: 0, 3: 0 };
    this.currentVolumes = { 1: 0, 2: 0, 3: 0 };
    this.fadeRaf = null;

    // Footsteps audio
    this.footstepAudio = null;
    this.isWalking = false;
    this.isSprinting = false;
  }

  init() {
    if (this.isInitialized) return;
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
    this.isInitialized = true;

    // Room 1, 2, 3 sound sources
    const roomSources = {
      1: encodeURI('/sounds/rooms sound/songs_1.mp3'),
      2: encodeURI('/sounds/rooms sound/songs_2.mp3'),
      3: encodeURI('/sounds/rooms sound/songs_3.mp3')
    };

    for (let r = 1; r <= 3; r++) {
      const audio = new Audio();
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0;
      audio.src = roomSources[r];

      // Robust fallback in case singular song_X is used
      audio.addEventListener('error', () => {
        const alt = encodeURI(`/sounds/rooms sound/song_${r}.mp3`);
        if (audio.src !== alt) {
          audio.src = alt;
          audio.load();
        }
      });

      this.roomAudios[r] = audio;
      this.currentVolumes[r] = 0;
      this.targetVolumes[r] = 0;
    }

    // Footsteps sound
    this.footstepAudio = new Audio();
    this.footstepAudio.loop = true;
    this.footstepAudio.preload = 'auto';
    this.footstepAudio.volume = 0.35 * this.sfxVolume;
    this.footstepAudio.src = encodeURI('/sounds/footstep sound.mp3');
    this.footstepAudio.addEventListener('error', () => {
      const alt = '/sounds/footstep%20sound.mp3';
      if (this.footstepAudio.src !== alt) {
        this.footstepAudio.src = alt;
        this.footstepAudio.load();
      }
    });
  }

  /**
   * Called every frame or whenever the player changes room.
   * Crossfades smoothly to the track for `roomIndex` (1, 2, 3).
   */
  updateRoom(roomIndex) {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.currentRoom === roomIndex && this.isInitialized) return;
    this.currentRoom = roomIndex;
    this.applyVolumeTargets();
  }

  setMoviePlaying(isPlaying) {
    this.isMoviePlaying = isPlaying;
    this.applyVolumeTargets();
  }

  setPaused(isPaused) {
    this.isGamePaused = isPaused;
    if (isPaused) {
      // Immediately stop footsteps while paused
      if (this.footstepAudio && !this.footstepAudio.paused) {
        this.footstepAudio.pause();
      }
    } else {
      // Resume footsteps if player was walking
      if (this.isWalking) {
        this.setWalking(true, this.isSprinting);
      }
    }
    this.applyVolumeTargets();
  }

  /**
   * Set player walking state to trigger or stop footstep sounds.
   * Adjusts playbackRate and volume for sprint vs walk.
   */
  setWalking(isWalking, isSprinting = false) {
    this.isWalking = !!isWalking;
    this.isSprinting = !!isSprinting;

    if (!this.isInitialized) {
      this.init();
    }

    if (!this.footstepAudio) return;

    if (this.isWalking && !this.isGamePaused) {
      const rate = this.isSprinting ? 1.35 : 1.0;
      const vol = (this.isSprinting ? 0.48 : 0.32) * this.sfxVolume;

      this.footstepAudio.playbackRate = rate;
      this.footstepAudio.volume = Math.max(0, Math.min(1, vol));

      if (this.footstepAudio.paused) {
        const playPromise = this.footstepAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      }
    } else {
      if (!this.footstepAudio.paused) {
        this.footstepAudio.pause();
      }
    }
  }

  /**
   * Toggle or set ambiance music on/off.
   * If forcedState (boolean) is provided, sets to that state.
   */
  toggle(forcedState) {
    if (!this.isInitialized) {
      this.init();
    }

    if (typeof forcedState === 'boolean') {
      this.isPlaying = forcedState;
    } else {
      this.isPlaying = !this.isPlaying;
    }

    this.applyVolumeTargets();
    return this.isPlaying;
  }

  /**
   * Recalculates target volumes for each room and starts the smooth crossfade loop.
   */
  applyVolumeTargets() {
    if (!this.isInitialized) return;

    for (let r = 1; r <= 3; r++) {
      if (this.isPlaying && this.currentRoom === r) {
        // While game is paused, duck ambient music slightly to 40% for background feel
        this.targetVolumes[r] = this.isGamePaused ? (this.musicVolume * 0.4) : this.musicVolume;
      } else {
        this.targetVolumes[r] = 0.0;
      }
    }

    this.startCrossfade();
  }

  /**
   * Real-time smooth volume lerp loop using requestAnimationFrame.
   */
  startCrossfade() {
    if (this.fadeRaf) return; // already animating

    const stepFade = () => {
      let active = false;

      for (let r = 1; r <= 3; r++) {
        const audio = this.roomAudios[r];
        if (!audio) continue;

        const target = this.targetVolumes[r] || 0;
        const current = this.currentVolumes[r] || 0;
        const diff = target - current;

        if (Math.abs(diff) > 0.003) {
          active = true;
          // Smooth transition (~1.2s crossfade feel)
          const next = current + diff * 0.06;
          this.currentVolumes[r] = next;
          audio.volume = Math.max(0, Math.min(1, next));

          // Start playing as soon as volume rises above threshold
          if (next > 0.005 && audio.paused) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {});
            }
          }
        } else {
          // Snapped to target
          this.currentVolumes[r] = target;
          audio.volume = Math.max(0, Math.min(1, target));

          // If volume reached zero and target is 0, pause to save CPU
          if (target === 0 && !audio.paused) {
            audio.pause();
          }
        }
      }

      if (active) {
        this.fadeRaf = requestAnimationFrame(stepFade);
      } else {
        this.fadeRaf = null;
      }
    };

    this.fadeRaf = requestAnimationFrame(stepFade);
  }
}

export const museumAudio = new MuseumAudio();
