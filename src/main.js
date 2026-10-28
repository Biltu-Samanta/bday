import {
  Engine,
  Scene,
  Color3,
  Color4,
  Vector3,
  Scalar,
  DefaultRenderingPipeline,
  ImageProcessingConfiguration,
  Tools,
  CreateScreenshotUsingRenderTarget
} from '@babylonjs/core';
import './style.css';
import { createMuseum } from './museum.js';
import { createCharacter } from './character.js';
import { loadFrameConfig, createFrames, disposeFrames } from './frames.js';
import { loadDoorConfig, createDoors } from './doors.js';
import { museumAudio } from './audio.js';
import { initEditMode } from './editMode.js';

window.addEventListener('DOMContentLoaded', async () => {
  // FIX #3 (Null check): Guard against missing canvas before doing anything else
  const canvas = document.getElementById('renderCanvas');
  if (!canvas) {
    console.error('[Main] Canvas element #renderCanvas not found — cannot initialise engine.');
    return;
  }

  // 1. Initialize Babylon Engine & Scene
  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    adaptToDeviceRatio: true
  });
  engine.disableUniformBuffers = true;

  const scene = new Scene(engine);
  // Deep charcoal background color and no fog
  scene.clearColor = new Color4(0.05, 0.06, 0.08, 1.0);
  scene.ambientColor = new Color3(0.55, 0.55, 0.58);
  scene.collisionsEnabled = true;
  scene.fogMode = Scene.FOGMODE_NONE;
  scene.fogDensity = 0.0;

  // Tone Mapping and Calibrated Exposure (1.05 for warm, vibrant museum illumination)
  scene.imageProcessingConfiguration.toneMappingEnabled = true;
  scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
  scene.imageProcessingConfiguration.exposure = 1.05;

  // 2. Build Museum Architecture & Exhibits
  const museum = createMuseum(scene);

  // 3. Load Frames from public/config.json
  // FIX #4 (Async error): loadFrameConfig() already handles fetch errors internally and
  // returns a default config — no additional try/catch needed here.
  const framesConfig = await loadFrameConfig();
  const frames = createFrames(scene, framesConfig, museum.shadowGenerator);

  // 4. Create Player Character Capsule & 3rd-Person Camera
  const character = await createCharacter(scene, canvas, museum.shadowGenerator);

  // 5. Build Doors at Museum Doorways (Z = -10 and Z = +10)
  // FIX #3 (Null check): loadDoorConfig() already falls back to defaults on error.
  const doorsConfig = await loadDoorConfig();
  // FIX: createDoors now returns { doors, doorObserver } — destructure properly
  const { doors, doorObserver } = createDoors(scene, doorsConfig, character);

  // DefaultRenderingPipeline with bloom targeted specifically at neon strips (threshold 0.9, weight 0.15)
  const pipeline = new DefaultRenderingPipeline("defaultPipeline", true, scene, [character.camera]);
  pipeline.bloomThreshold = 0.9;
  pipeline.bloomWeight = 0.15;
  pipeline.bloomKernel = 32;
  pipeline.bloomEnabled = true;
  pipeline.samples = 4;        // 4x Multi-Sample Anti-Aliasing
  pipeline.fxaaEnabled = true; // Fast Approximate Anti-Aliasing for smooth clean edges

  // Combine sculpture centerpieces and wall frames for proximity tracking
  const allExhibits = [
    ...museum.exhibits,
    ...frames.map((f) => ({
      id: f.id,
      title: f.title,
      artist: f.artist,
      year: f.year,
      room: f.roomName,
      description: f.caption,
      position: f.position,
      isFrame: true,
      frameData: f
    }))
  ];

  // 6. UI Elements
  // FIX #3 (Null check): All getElementById calls are now guarded. A missing DOM element
  // logs a warning instead of crashing later when the code tries to use it.
  const uiOverlay = document.getElementById('ui-overlay');
  const roomLabel = document.getElementById('room-label');
  if (!roomLabel) console.warn('[Main] #room-label element not found in DOM.');

  const pill1 = document.getElementById('pill-1');
  const pill2 = document.getElementById('pill-2');
  const pill3 = document.getElementById('pill-3');
  // FIX #3: Warn if required pill elements are missing
  if (!pill1 || !pill2 || !pill3) console.warn('[Main] One or more room pill elements (#pill-1/2/3) not found.');

  const exhibitCard = document.getElementById('exhibit-card');
  const exhibitWing = document.getElementById('exhibit-wing');
  const exhibitTitle = document.getElementById('exhibit-title');
  const exhibitArtist = document.getElementById('exhibit-artist');
  const exhibitYear = document.getElementById('exhibit-year');
  const exhibitDesc = document.getElementById('exhibit-desc');

  const clickPrompt = document.getElementById('click-prompt');

  // Photo Mode UI Elements
  const btnPhoto = document.getElementById('btn-photo');
  const shutterFlash = document.getElementById('shutter-flash');
  const photoPreviewCard = document.getElementById('photo-preview-card');
  const photoPreviewImg = document.getElementById('photo-preview-img');

  // Inspection Modal Elements
  const inspectModal = document.getElementById('inspect-modal');
  const inspectBackdrop = document.getElementById('inspect-backdrop');
  const btnCloseInspect = document.getElementById('btn-close-inspect');
  const inspectLocation = document.getElementById('inspect-location');
  const inspectYear = document.getElementById('inspect-year');
  const inspectTitle = document.getElementById('inspect-title');
  const inspectArtist = document.getElementById('inspect-artist');
  const inspectImg = document.getElementById('inspect-img');
  const inspectCaption = document.getElementById('inspect-caption');
  // FIX #3: Warn if inspect modal elements are missing (non-fatal)
  if (!inspectModal || !inspectBackdrop || !btnCloseInspect) {
    console.warn('[Main] Inspect modal elements not found — artwork inspection will be unavailable.');
  }

  const keyW = document.getElementById('key-w');
  const keyA = document.getElementById('key-a');
  const keyS = document.getElementById('key-s');
  const keyD = document.getElementById('key-d');
  const keyShift = document.getElementById('key-shift');

  const btnReset = document.getElementById('btn-reset');
  const btnAudio = document.getElementById('btn-audio');
  const audioLabel = document.getElementById('audio-label');
  const btnNextRoom = document.getElementById('btn-next-room');

  // 7. Inspection State & Functions
  let isInspecting = false;
  let inspectedFrame = null;
  let nearbyFrame = null;

  function startInspection(frameData) {
    if (!frameData) return;
    // FIX #3 (Null check): Guard against missing modal elements before touching classList
    if (!inspectModal) return;
    isInspecting = true;
    inspectedFrame = frameData;
    character.state.isControlLocked = true;

    // Populate modal — guard each element
    if (inspectLocation) inspectLocation.textContent = `${frameData.roomName} • ${frameData.wallName}`;
    if (inspectYear) inspectYear.textContent = frameData.year || "";
    if (inspectTitle) inspectTitle.textContent = frameData.title || "Untitled";
    if (inspectArtist) inspectArtist.textContent = frameData.artist || "Unknown Artist";
    if (inspectImg) {
      inspectImg.src = frameData.image ? (frameData.image.startsWith('data:') ? frameData.image : encodeURI(decodeURI(frameData.image))) : "";
      inspectImg.style.transform = frameData.rotation ? `rotate(${frameData.rotation}deg)` : 'none';
    }
    if (inspectCaption) inspectCaption.textContent = frameData.caption || "";

    // Show modal
    inspectModal.classList.add('active');
    inspectModal.setAttribute('aria-hidden', 'false');

    // Hide background prompts
    if (clickPrompt) clickPrompt.classList.remove('visible');
    if (exhibitCard) exhibitCard.classList.remove('visible');
  }

  function endInspection() {
    if (!isInspecting) return;
    isInspecting = false;
    inspectedFrame = null;
    character.state.isControlLocked = false;
    // Restore free-orbit radius limits; the camera will lerp back to default on its own
    character.camera.lowerRadiusLimit = 1.5;
    character.camera.upperRadiusLimit = 5.0;

    // FIX #3: Guard against missing modal element
    if (inspectModal) {
      inspectModal.classList.remove('active');
      inspectModal.setAttribute('aria-hidden', 'true');
    }
  }

  if (btnCloseInspect) btnCloseInspect.addEventListener('click', endInspection);
  if (inspectBackdrop) inspectBackdrop.addEventListener('click', endInspection);

  // Click on click-prompt to inspect current nearby frame
  if (clickPrompt) {
    clickPrompt.style.cursor = 'pointer';
    clickPrompt.addEventListener('click', () => {
      if (nearbyFrame) {
        startInspection(nearbyFrame);
      }
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7b. Pointer Lock System
  // Detect mobile/touch: skip pointer lock on touch-primary devices
  // ──────────────────────────────────────────────────────────────────────────
  const isTouchDevice = () =>
    window.matchMedia('(hover: none) and (pointer: coarse)').matches ||
    ('ontouchstart' in window && navigator.maxTouchPoints > 0);

  const isMobile = isTouchDevice();

  // Cursor is always visible as default arrow
  canvas.style.cursor = 'default';

  // DOM reference for click-to-start
  const clickToStart = document.getElementById('click-to-start');

  function startAudioIfFirstInteraction() {
    if (!museumAudio.isPlaying) {
      const isPlaying = museumAudio.toggle(true);
      if (btnAudio) btnAudio.classList.toggle('active', isPlaying);
      if (audioLabel) audioLabel.textContent = isPlaying ? 'Ambiance: On ♬' : 'Ambiance: Off';
      if (pipeline) pipeline.bloomEnabled = isPlaying;
    }
  }

  if (clickToStart) {
    clickToStart.addEventListener('click', () => {
      startAudioIfFirstInteraction();
      clickToStart.classList.add('hidden');
    });
  }

  canvas.addEventListener('click', () => {
    startAudioIfFirstInteraction();
    if (clickToStart) clickToStart.classList.add('hidden');
  });

  if (isMobile) {
    if (clickToStart) clickToStart.classList.add('hidden');
    window.addEventListener('touchstart', startAudioIfFirstInteraction, { once: true });
  }

  // Initialize Edit Museum Mode
  const editMode = initEditMode({
    scene,
    canvas,
    character,
    frames,
    allExhibits,
    isMobile
  });

  // FIX #2 (Event listener leak): Use a named handler so it can be removed on scene disposal.
  const onGlobalKeyDown = (e) => {
    if (e.code === 'Escape') {
      // Close inspection or close Edit Museum side panel if open; no pause menu
      if (isInspecting) {
        endInspection();
      } else if (editMode && editMode.isPanelOpen && editMode.isPanelOpen()) {
        editMode.closePanel();
      }
    } else if (isInspecting && (e.code === 'KeyW' || e.code === 'KeyA' || e.code === 'KeyS' || e.code === 'KeyD')) {
      // Walking away closes inspection smoothly
      endInspection();
    } else if (e.code === 'KeyE') {
      // E shortcut to toggle Edit Mode on/off (only when not typing in text inputs)
      const isInputFocused = document.activeElement &&
        (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
      if (!isInputFocused && !isInspecting) {
        editMode.toggle();
      }
    } else if (e.code === 'Enter') {
      if (!isInspecting && nearbyFrame) {
        startInspection(nearbyFrame);
      }
    } else if (e.code === 'KeyG') {
      // Press G to toggle avatar model (male/female)
      if (!isInspecting) toggleAvatar();
    } else if (e.code === 'KeyP' || e.key === 'p' || e.key === 'P') {
      // Press P to trigger Photo Mode
      if (isInspecting) endInspection();
      takePhoto();
    } else if (e.code === 'KeyR' || e.key === 'r' || e.key === 'R') {
      // Press R to reset character & camera to Room 1
      handleReset();
    }
  };

  // FIX #2 (Event listener leak): Use a named resize handler for later removal.
  const onWindowResize = () => {
    engine.resize();
  };

  window.addEventListener('keydown', onGlobalKeyDown);
  window.addEventListener('resize', onWindowResize);

  // 8. Pointer picking for clicking picture frames
  // Camera rotation is handled by holding left mouse button and dragging (ArcRotateCamera)
  let pointerDownPos = null;

  scene.onPointerDown = (evt) => {
    if (evt.button === 0) {
      pointerDownPos = { x: evt.clientX, y: evt.clientY };
    }
  };

  scene.onPointerUp = (evt, pickResult) => {
    if (evt.button !== 0) return; // Left click only
    if (isInspecting) return;
    if (!pointerDownPos) return;

    const distMoved = Math.hypot(evt.clientX - pointerDownPos.x, evt.clientY - pointerDownPos.y);
    pointerDownPos = null;

    // If mouse moved more than 6px, it was camera drag rotation, not an intentional click
    if (distMoved > 6) return;

    // Handle frame click in Edit Mode
    if (editMode && editMode.isActive()) {
      const handled = editMode.handleCanvasClick(pickResult);
      if (handled) return;
    }

    if (pickResult && pickResult.hit && pickResult.pickedMesh && pickResult.pickedMesh.metadata && pickResult.pickedMesh.metadata.config) {
      const frameData = pickResult.pickedMesh.metadata;
      const dist = Vector3.Distance(character.capsule.position, frameData.position);
      if (dist <= 5.2) {
        startInspection(frameData);
      }
    }
  };

  // Hover cursor feedback
  scene.onPointerMove = (evt, pickResult) => {
    if (editMode && editMode.isActive()) return;
    if (isInspecting) {
      canvas.style.cursor = 'default';
      return;
    }
    if (pickResult.hit && pickResult.pickedMesh && pickResult.pickedMesh.metadata && pickResult.pickedMesh.metadata.config) {
      const dist = Vector3.Distance(character.capsule.position, pickResult.pickedMesh.metadata.position);
      if (dist <= 5.2) {
        canvas.style.cursor = 'pointer';
        return;
      }
    }
    canvas.style.cursor = 'default';
  };

  // 9. Room Navigation
  let currentRoomIndex = 1;

  function updateRoomState(roomIndex, roomName) {
    if (currentRoomIndex !== roomIndex) {
      currentRoomIndex = roomIndex;
      // FIX #3 (Null check): Guard against missing roomLabel element
      if (roomLabel) roomLabel.textContent = roomName;

      if (pill1) pill1.classList.toggle('active', roomIndex === 1);
      if (pill2) pill2.classList.toggle('active', roomIndex === 2);
      if (pill3) {
        pill3.classList.toggle('active', roomIndex === 3);
        pill3.classList.toggle('room-3', roomIndex === 3);
      }
    }
  }

  const btnAvatar = document.getElementById('btn-avatar');
  const avatarLabel = document.getElementById('avatar-label');

  function teleportToRoom(roomNum) {
    endInspection();
    activeExhibitId = null;
    // FIX #3 (Null check): Guard exhibitCard before removing class
    if (exhibitCard) exhibitCard.classList.remove('visible');

    if (roomNum === 1) {
      character.capsule.position = new Vector3(0, 0.0, -22);
      character.capsule.rotation.y = 0;
      character.camera.alpha = -Math.PI / 2;
    } else if (roomNum === 2) {
      character.capsule.position = new Vector3(0, 0.0, -4);
      character.capsule.rotation.y = 0;
      character.camera.alpha = -Math.PI / 2;
    } else if (roomNum === 3) {
      character.capsule.position = new Vector3(0, 0.0, 16);
      character.capsule.rotation.y = 0;
      character.camera.alpha = -Math.PI / 2;
    }
    character.camera.target = character.capsule.position.add(new Vector3(0, 1.4, 0));
    // Reset radius limits after teleport (inspection may have narrowed them)
    character.camera.lowerRadiusLimit = 1.5;
    character.camera.upperRadiusLimit = 5.0;
  }

  if (pill1) pill1.addEventListener('click', () => teleportToRoom(1));
  if (pill2) pill2.addEventListener('click', () => teleportToRoom(2));
  if (pill3) pill3.addEventListener('click', () => teleportToRoom(3));

  if (btnNextRoom) {
    btnNextRoom.addEventListener('click', () => {
      const nextRoom = (currentRoomIndex % 3) + 1;
      teleportToRoom(nextRoom);
    });
  }

  function handleReset() {
    endInspection();
    activeExhibitId = null;
    if (exhibitCard) exhibitCard.classList.remove('visible');
    character.resetPosition();
  }

  if (btnReset) btnReset.addEventListener('click', handleReset);

  if (btnAudio) {
    btnAudio.addEventListener('click', () => {
      const isPlaying = museumAudio.toggle();
      btnAudio.classList.toggle('active', isPlaying);
      if (audioLabel) audioLabel.textContent = isPlaying ? 'Ambiance: On ♬' : 'Ambiance: Off';
      pipeline.bloomEnabled = isPlaying;
    });
  }

  async function toggleAvatar() {
    const newGender = await character.swapModel();
    if (avatarLabel) {
      avatarLabel.textContent = newGender === 'female' ? 'Avatar: Female 👩' : 'Avatar: Male 👤';
    }
  }

  if (btnAvatar) {
    btnAvatar.addEventListener('click', toggleAvatar);
  }

  // Brightness Slider (Controls scene.imageProcessingConfiguration.exposure between 0.6 and 1.6)
  const brightnessSlider = document.getElementById('brightness-slider');
  const brightnessVal = document.getElementById('brightness-val');
  if (brightnessSlider) {
    brightnessSlider.value = scene.imageProcessingConfiguration.exposure;
    if (brightnessVal) {
      brightnessVal.textContent = scene.imageProcessingConfiguration.exposure.toFixed(2);
    }
    brightnessSlider.addEventListener('input', (e) => {
      const exp = parseFloat(e.target.value);
      scene.imageProcessingConfiguration.exposure = exp;
      if (brightnessVal) {
        brightnessVal.textContent = exp.toFixed(2);
      }
    });
  }

  // Camera Distance Display (live radius)
  const camDistanceVal = document.getElementById('camera-distance-val');
  if (camDistanceVal) {
    camDistanceVal.textContent = character.camera.radius.toFixed(1) + 'm';
    // Update every frame
    scene.onAfterRenderObservable.add(() => {
      camDistanceVal.textContent = character.camera.radius.toFixed(1) + 'm';
    });
  }

  // ==========================================
  // Photo Mode Logic
  // ==========================================
  let isTakingPhoto = false;
  let photoPreviewTimeout = null;

  function playShutterSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;

      // Mechanical shutter click: high crisp transient
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1400, now);
      osc1.frequency.exponentialRampToValueAtTime(160, now + 0.04);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.04);

      // Low mechanical thud/rebound
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(420, now + 0.045);
      osc2.frequency.exponentialRampToValueAtTime(80, now + 0.12);
      gain2.gain.setValueAtTime(0.2, now + 0.045);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.045);
      osc2.stop(now + 0.12);
    } catch (_) {
      // AudioContext unavailable or restricted
    }
  }

  function takePhoto() {
    if (isTakingPhoto) return;
    isTakingPhoto = true;

    // 1. Hide the HUD so no UI elements appear in the photo
    if (uiOverlay) {
      uiOverlay.style.display = 'none';
    }
    if (clickPrompt) clickPrompt.classList.remove('visible');
    if (exhibitCard) exhibitCard.classList.remove('visible');

    // 2. Play shutter sound and show camera shutter flash
    playShutterSound();
    if (shutterFlash) {
      shutterFlash.classList.add('flash');
      requestAnimationFrame(() => {
        setTimeout(() => {
          shutterFlash.classList.remove('flash');
        }, 50);
      });
    }

    // 3. Capture canvas using Babylon's CreateScreenshotUsingRenderTarget
    setTimeout(() => {
      const screenshotFn = Tools.CreateScreenshotUsingRenderTarget || CreateScreenshotUsingRenderTarget;

      screenshotFn(
        engine,
        character.camera,
        { precision: 1.0 },
        (dataUrl) => {
          // A. Restore HUD immediately
          if (uiOverlay) {
            uiOverlay.style.display = '';
          }

          // B. Show small preview thumbnail in corner for 3 seconds
          if (photoPreviewCard && photoPreviewImg && dataUrl) {
            photoPreviewImg.src = dataUrl;
            photoPreviewCard.classList.add('visible');
            photoPreviewCard.setAttribute('aria-hidden', 'false');

            if (photoPreviewTimeout) {
              clearTimeout(photoPreviewTimeout);
            }
            photoPreviewTimeout = setTimeout(() => {
              photoPreviewCard.classList.remove('visible');
              photoPreviewCard.setAttribute('aria-hidden', 'true');
            }, 3000);
          }

          isTakingPhoto = false;
        },
        'image/png',
        4,
        true,
        'museum-photo.png'
      );
    }, 60);
  }

  if (btnPhoto) {
    btnPhoto.addEventListener('click', () => {
      if (isInspecting) {
        endInspection();
      }
      takePhoto();
    });
  }

  // 10. Per-frame Proximity, Inspection Lerp, and HUD Updates
  let activeExhibitId = null;

  scene.onBeforeRenderObservable.add(() => {
    // FIX #6 (dt cap): Cap deltaTime to 50ms so a tab-switch spike doesn't
    // jump the camera target or lerp values out of bounds in one frame.
    const deltaTime = Math.min(scene.getEngine().getDeltaTime() / 1000, 0.05);
    const pos = character.capsule.position;

    // A. Room detection based on position
    if (pos.z < -10) {
      updateRoomState(1, 'Room 1: The Grand Vestibule');
    } else if (pos.z <= 10) {
      updateRoomState(2, 'Room 2: Central Rotunda');
    } else {
      updateRoomState(3, 'Room 3: Lumina Pavilion');
    }

    // Crossfade ambient music per room
    museumAudio.updateRoom(currentRoomIndex);

    // B. Smooth Camera Zoom-In during Artwork Inspection
    if (isInspecting && inspectedFrame) {
      // Lerp camera target to the center of the frame
      character.camera.target = Vector3.Lerp(
        character.camera.target,
        inspectedFrame.inspectTarget,
        Math.min(1, deltaTime * 8)
      );

      // Lerp camera radius to close-up zoom
      character.camera.radius = Scalar.Lerp(
        character.camera.radius,
        inspectedFrame.targetRadius,
        Math.min(1, deltaTime * 8)
      );

      // Lerp camera alpha (horizontal orbit angle) towards front of frame
      let diffAlpha = inspectedFrame.targetAlpha - character.camera.alpha;
      while (diffAlpha < -Math.PI) diffAlpha += Math.PI * 2;
      while (diffAlpha > Math.PI) diffAlpha -= Math.PI * 2;
      character.camera.alpha += diffAlpha * Math.min(1, deltaTime * 8);

      // Lerp camera beta (vertical elevation angle) to level eye-line
      character.camera.beta = Scalar.Lerp(
        character.camera.beta,
        inspectedFrame.targetBeta,
        Math.min(1, deltaTime * 8)
      );
      return; // Skip walking HUD updates while inspecting
    }

    // C. Proximity detection to art exhibits & picture frames
    let nearestExhibit = null;
    let minDistance = Infinity;
    nearbyFrame = null;

    for (const exhibit of allExhibits) {
      const d = Vector3.Distance(pos, exhibit.position);
      if (d < minDistance) {
        minDistance = d;
        nearestExhibit = exhibit;
      }
      if (exhibit.isFrame && d <= 4.8) {
        nearbyFrame = exhibit.frameData;
      }
    }

    // Proximity click tooltip
    // FIX #3 (Null check): Guard clickPrompt before calling classList methods
    if (clickPrompt) {
      if (nearbyFrame && minDistance <= 4.8) {
        clickPrompt.innerHTML = `<span class="prompt-key">E</span> or Click to Inspect Artwork`;
        clickPrompt.classList.add('visible');
      } else {
        clickPrompt.classList.remove('visible');
      }
    }

    // Floating Exhibit Card
    // FIX #3 (Null check): Guard all exhibit card elements before updating
    if (exhibitCard) {
      if (minDistance < 3.4 && nearestExhibit) {
        if (activeExhibitId !== nearestExhibit.id) {
          activeExhibitId = nearestExhibit.id;
          if (exhibitWing) exhibitWing.textContent = nearestExhibit.room;
          if (exhibitTitle) exhibitTitle.textContent = nearestExhibit.title;
          if (exhibitArtist) exhibitArtist.textContent = nearestExhibit.artist;
          if (exhibitYear) exhibitYear.textContent = nearestExhibit.year;
          if (exhibitDesc) exhibitDesc.textContent = nearestExhibit.description;
          exhibitCard.classList.add('visible');
        }
      } else if (minDistance > 3.8 && activeExhibitId) {
        activeExhibitId = null;
        exhibitCard.classList.remove('visible');
      }
    }

    // D. Controls keycap lighting
    // FIX #3 (Null check): Guard each key element individually
    if (keyW) keyW.classList.toggle('active', character.inputMap.forward);
    if (keyA) keyA.classList.toggle('active', character.inputMap.left);
    if (keyS) keyS.classList.toggle('active', character.inputMap.backward);
    if (keyD) keyD.classList.toggle('active', character.inputMap.right);
    if (keyShift) keyShift.classList.toggle('active', character.inputMap.sprint);
  });

  // Enable on-screen buttons for click/touch movement
  function bindVirtualKey(el, inputProp) {
    if (!el) return;
    el.style.cursor = 'pointer';
    const start = (e) => {
      e.preventDefault();
      endInspection();
      character.inputMap[inputProp] = true;
    };
    const end = (e) => {
      e.preventDefault();
      character.inputMap[inputProp] = false;
    };
    el.addEventListener('mousedown', start);
    el.addEventListener('mouseup', end);
    el.addEventListener('mouseleave', end);
    el.addEventListener('touchstart', start, { passive: false });
    el.addEventListener('touchend', end);
    el.addEventListener('touchcancel', end);
  }

  bindVirtualKey(keyW, 'forward');
  bindVirtualKey(keyA, 'left');
  bindVirtualKey(keyS, 'backward');
  bindVirtualKey(keyD, 'right');
  bindVirtualKey(keyShift, 'sprint');

  // 11. Start Render Loop
  engine.runRenderLoop(() => {
    scene.render();
  });

  // Resize handler (named — see FIX #2 above)
  // window.addEventListener already called above with onWindowResize

  // FIX #2 (Event listener leak): Register a scene dispose hook that removes ALL window
  // event listeners added in main.js and character.js so they don't outlive the scene.
  // FIX #1 (Memory leak): Also dispose frames and museum observers on teardown.
  scene.onDisposeObservable.add(() => {
    // Remove main.js window listeners
    window.removeEventListener('keydown', onGlobalKeyDown);
    window.removeEventListener('resize', onWindowResize);


    // Remove character.js window listeners via its exposed dispose()
    if (character && character.dispose) character.dispose();

    // FIX #1: Dispose all frame GPU resources (textures, materials, spotlights, meshes)
    disposeFrames(frames);

    // FIX #2: Remove museum animation observer
    if (museum.animObserver) {
      scene.onBeforeRenderObservable.remove(museum.animObserver);
    }

    // FIX #2: Remove door animation observer
    if (doorObserver) {
      scene.onBeforeRenderObservable.remove(doorObserver);
    }

    // Dispose Edit Mode highlights and resources
    if (editMode && editMode.dispose) editMode.dispose();

    console.log('[Main] Scene disposed — all event listeners and GPU resources cleaned up.');
  });
});
