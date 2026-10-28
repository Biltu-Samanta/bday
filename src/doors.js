import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  TransformNode
} from '@babylonjs/core';

/**
 * Loads door configuration from public/config.json
 */
export async function loadDoorConfig() {
  const defaultDoors = [
    {
      id: "door-1",
      name: "Vestibule to Rotunda",
      position: { x: 0, y: 0, z: -10 },
      width: 4.4,
      height: 3.8,
      thickness: 0.08,
      type: "swing",
      style: "classic",
      openDistance: 3.0,
      closeDistance: 5.0,
      animationDuration: 0.6,
      soundOpen: "/sounds/door-open.wav",
      soundClose: "/sounds/door-close.wav"
    },
    {
      id: "door-2",
      name: "Rotunda to Modern Pavilion",
      position: { x: 0, y: 0, z: 10 },
      width: 4.4,
      height: 3.8,
      thickness: 0.08,
      type: "swing",
      style: "classic",
      openDistance: 3.0,
      closeDistance: 5.0,
      animationDuration: 0.6,
      soundOpen: "/sounds/door-open.wav",
      soundClose: "/sounds/door-close.wav"
    }
  ];

  try {
    const res = await fetch('/config.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && Array.isArray(data.doors)) {
      return data.doors;
    }
    return defaultDoors;
  } catch (err) {
    console.warn('Could not load door config from config.json, using defaults:', err);
    return defaultDoors;
  }
}

/**
 * Creates museum double doors with automatic proximity opening,
 * collisions, sound effects, and smooth animations.
 */
export function createDoors(scene, doorsConfig, character) {
  // Shared Door Materials
  const darkWoodMat = new StandardMaterial("doorDarkWoodMat", scene);
  darkWoodMat.diffuseColor = new Color3(0.14, 0.09, 0.06);
  darkWoodMat.specularColor = new Color3(0.08, 0.06, 0.04);
  darkWoodMat.specularPower = 32;
  darkWoodMat.maxSimultaneousLights = 8;

  const woodPanelMat = new StandardMaterial("doorWoodPanelMat", scene);
  woodPanelMat.diffuseColor = new Color3(0.18, 0.12, 0.08);
  woodPanelMat.specularColor = new Color3(0.12, 0.09, 0.06);
  woodPanelMat.specularPower = 48;
  woodPanelMat.maxSimultaneousLights = 8;
  woodPanelMat.zOffset = -1;

  const goldHandleMat = new StandardMaterial("doorGoldHandleMat", scene);
  goldHandleMat.diffuseColor = new Color3(0.92, 0.76, 0.28);
  goldHandleMat.specularColor = new Color3(0.85, 0.75, 0.45);
  goldHandleMat.specularPower = 96;
  goldHandleMat.maxSimultaneousLights = 8;
  goldHandleMat.zOffset = -1;

  const darkGlassMat = new StandardMaterial("doorDarkGlassMat", scene);
  darkGlassMat.diffuseColor = new Color3(0.06, 0.08, 0.12);
  darkGlassMat.specularColor = new Color3(0.9, 0.95, 1.0);
  darkGlassMat.specularPower = 128;
  darkGlassMat.alpha = 0.78; // Sleek smoked dark glass
  darkGlassMat.maxSimultaneousLights = 8;

  const modernFrameMat = new StandardMaterial("doorModernFrameMat", scene);
  modernFrameMat.diffuseColor = new Color3(0.10, 0.12, 0.15);
  modernFrameMat.specularColor = new Color3(0.2, 0.22, 0.25);
  modernFrameMat.specularPower = 48;
  modernFrameMat.maxSimultaneousLights = 8;
  modernFrameMat.zOffset = -1;

  const neonCyanMat = new StandardMaterial("doorNeonCyanMat", scene);
  neonCyanMat.emissiveColor = new Color3(0.0, 0.9, 1.0);
  neonCyanMat.diffuseColor = new Color3(0.0, 0.9, 1.0);
  neonCyanMat.maxSimultaneousLights = 8;
  neonCyanMat.zOffset = -2;

  // Sound Playback Helper (Supports Audio element with Web Audio fallback)
  function playDoorSound(type, soundUrl) {
    // 1. Try HTML5 Audio
    try {
      if (soundUrl) {
        const audio = new Audio(soundUrl);
        audio.volume = 0.35;
        audio.play().catch(() => playWebAudioFallback(type));
        return;
      }
    } catch {
      // Fallback to Web Audio
    }
    playWebAudioFallback(type);
  }

  function playWebAudioFallback(type) {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      if (type === 'open') {
        // Soft sliding swoosh
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.45);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.55);
      } else {
        // Gentle solid latch click
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.25);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch {
      // AudioContext unavailable or blocked
    }
  }

  // Build each door based on config
  const doors = doorsConfig.map((config, index) => {
    const doorId = config.id || `door-${index + 1}`;
    const posX = config.position?.x ?? 0;
    const posY = config.position?.y ?? 0;
    const posZ = config.position?.z ?? (index === 0 ? -10 : 10);
    const totalW = config.width || 4.4;
    const totalH = config.height || 3.8;
    const leafW = totalW / 2; // 2.2
    const leafH = totalH;     // 3.8
    const leafT = config.thickness || 0.08;
    const style = config.style || "classic";
    const doorType = config.type || "swing";
    const openDist = config.openDistance || 3.0;
    const closeDist = config.closeDistance || 5.0;
    const animDuration = config.animationDuration || 0.6;

    const doorRoot = new TransformNode(`doorRoot_${doorId}`, scene);
    doorRoot.position = new Vector3(posX, posY, posZ);

    let leftLeaf = null;
    let rightLeaf = null;
    let leftHinge = null;
    let rightHinge = null;

    if (doorType === "swing") {
      // ==========================================
      // CLASSIC DOUBLE SWING DOOR (Rooms 1 & 2)
      // ==========================================
      // Hinges at outer edges
      leftHinge = new TransformNode(`hingeL_${doorId}`, scene);
      leftHinge.parent = doorRoot;
      leftHinge.position = new Vector3(-totalW / 2, 0, 0);

      rightHinge = new TransformNode(`hingeR_${doorId}`, scene);
      rightHinge.parent = doorRoot;
      rightHinge.position = new Vector3(totalW / 2, 0, 0);

      // Left Leaf Body
      leftLeaf = MeshBuilder.CreateBox(`leafL_${doorId}`, {
        width: leafW,
        height: leafH,
        depth: leafT
      }, scene);
      leftLeaf.parent = leftHinge;
      leftLeaf.position = new Vector3(leafW / 2, leafH / 2, 0);
      leftLeaf.material = darkWoodMat;
      leftLeaf.checkCollisions = true;

      // Decorative Raised Panels on Left Leaf (protrudes 0.008, no z-fighting)
      const pTopL = MeshBuilder.CreateBox(`pTopL_${doorId}`, {
        width: leafW - 0.35,
        height: leafH * 0.42,
        depth: leafT + 0.016
      }, scene);
      pTopL.parent = leftLeaf;
      pTopL.position = new Vector3(0, leafH * 0.22, 0);
      pTopL.material = woodPanelMat;
      pTopL.receiveShadows = false;

      const pBotL = MeshBuilder.CreateBox(`pBotL_${doorId}`, {
        width: leafW - 0.35,
        height: leafH * 0.38,
        depth: leafT + 0.016
      }, scene);
      pBotL.parent = leftLeaf;
      pBotL.position = new Vector3(0, -leafH * 0.24, 0);
      pBotL.material = woodPanelMat;
      pBotL.receiveShadows = false;

      // Gold Pull Handle on Left Leaf (near meeting edge, visible from both sides)
      const handleL_Front = MeshBuilder.CreateCylinder(`handleLF_${doorId}`, {
        diameter: 0.035,
        height: 0.55
      }, scene);
      handleL_Front.parent = leftLeaf;
      handleL_Front.position = new Vector3(leafW / 2 - 0.2, -0.2, leafT / 2 + 0.04);
      handleL_Front.material = goldHandleMat;
      handleL_Front.receiveShadows = false;

      const handleL_Back = MeshBuilder.CreateCylinder(`handleLB_${doorId}`, {
        diameter: 0.035,
        height: 0.55
      }, scene);
      handleL_Back.parent = leftLeaf;
      handleL_Back.position = new Vector3(leafW / 2 - 0.2, -0.2, -leafT / 2 - 0.04);
      handleL_Back.material = goldHandleMat;
      handleL_Back.receiveShadows = false;

      // Right Leaf Body
      rightLeaf = MeshBuilder.CreateBox(`leafR_${doorId}`, {
        width: leafW,
        height: leafH,
        depth: leafT
      }, scene);
      rightLeaf.parent = rightHinge;
      rightLeaf.position = new Vector3(-leafW / 2, leafH / 2, 0);
      rightLeaf.material = darkWoodMat;
      rightLeaf.checkCollisions = true;

      // Decorative Raised Panels on Right Leaf
      const pTopR = MeshBuilder.CreateBox(`pTopR_${doorId}`, {
        width: leafW - 0.35,
        height: leafH * 0.42,
        depth: leafT + 0.016
      }, scene);
      pTopR.parent = rightLeaf;
      pTopR.position = new Vector3(0, leafH * 0.22, 0);
      pTopR.material = woodPanelMat;
      pTopR.receiveShadows = false;

      const pBotR = MeshBuilder.CreateBox(`pBotR_${doorId}`, {
        width: leafW - 0.35,
        height: leafH * 0.38,
        depth: leafT + 0.016
      }, scene);
      pBotR.parent = rightLeaf;
      pBotR.position = new Vector3(0, -leafH * 0.24, 0);
      pBotR.material = woodPanelMat;
      pBotR.receiveShadows = false;

      // Gold Pull Handle on Right Leaf
      const handleR_Front = MeshBuilder.CreateCylinder(`handleRF_${doorId}`, {
        diameter: 0.035,
        height: 0.55
      }, scene);
      handleR_Front.parent = rightLeaf;
      handleR_Front.position = new Vector3(-leafW / 2 + 0.2, -0.2, leafT / 2 + 0.04);
      handleR_Front.material = goldHandleMat;
      handleR_Front.receiveShadows = false;

      const handleR_Back = MeshBuilder.CreateCylinder(`handleRB_${doorId}`, {
        diameter: 0.035,
        height: 0.55
      }, scene);
      handleR_Back.parent = rightLeaf;
      handleR_Back.position = new Vector3(-leafW / 2 + 0.2, -0.2, -leafT / 2 - 0.04);
      handleR_Back.material = goldHandleMat;
      handleR_Back.receiveShadows = false;



    } else {
      // ==========================================
      // MODERN SLIDING DARK GLASS & NEON DOOR (Room 3)
      // ==========================================
      // Left Leaf Body (slides left towards X = -3.2)
      leftLeaf = MeshBuilder.CreateBox(`leafL_${doorId}`, {
        width: leafW,
        height: leafH,
        depth: leafT
      }, scene);
      leftLeaf.parent = doorRoot;
      leftLeaf.position = new Vector3(-leafW / 2, leafH / 2, 0);
      leftLeaf.material = darkGlassMat;
      leftLeaf.checkCollisions = true;

      // Neon Accent Edge on Left Leaf meeting edge
      const neonEdgeL = MeshBuilder.CreateBox(`neonEdgeL_${doorId}`, {
        width: 0.025,
        height: leafH,
        depth: leafT + 0.016
      }, scene);
      neonEdgeL.parent = leftLeaf;
      neonEdgeL.position = new Vector3(leafW / 2 - 0.0125, 0, 0);
      neonEdgeL.material = neonCyanMat;
      neonEdgeL.receiveShadows = false;

      // Top & Bottom modern metallic trim on Left Leaf
      const trimTopL = MeshBuilder.CreateBox(`trimTopL_${doorId}`, {
        width: leafW,
        height: 0.08,
        depth: leafT + 0.016
      }, scene);
      trimTopL.parent = leftLeaf;
      trimTopL.position = new Vector3(0, leafH / 2 - 0.04, 0);
      trimTopL.material = modernFrameMat;
      trimTopL.receiveShadows = false;

      const trimBotL = MeshBuilder.CreateBox(`trimBotL_${doorId}`, {
        width: leafW,
        height: 0.12,
        depth: leafT + 0.016
      }, scene);
      trimBotL.parent = leftLeaf;
      trimBotL.position = new Vector3(0, -leafH / 2 + 0.06, 0);
      trimBotL.material = modernFrameMat;
      trimBotL.receiveShadows = false;

      // Right Leaf Body (slides right towards X = +3.2)
      rightLeaf = MeshBuilder.CreateBox(`leafR_${doorId}`, {
        width: leafW,
        height: leafH,
        depth: leafT
      }, scene);
      rightLeaf.parent = doorRoot;
      rightLeaf.position = new Vector3(leafW / 2, leafH / 2, 0);
      rightLeaf.material = darkGlassMat;
      rightLeaf.checkCollisions = true;

      // Neon Accent Edge on Right Leaf meeting edge
      const neonEdgeR = MeshBuilder.CreateBox(`neonEdgeR_${doorId}`, {
        width: 0.025,
        height: leafH,
        depth: leafT + 0.016
      }, scene);
      neonEdgeR.parent = rightLeaf;
      neonEdgeR.position = new Vector3(-leafW / 2 + 0.0125, 0, 0);
      neonEdgeR.material = neonCyanMat;
      neonEdgeR.receiveShadows = false;

      // Top & Bottom modern metallic trim on Right Leaf
      const trimTopR = MeshBuilder.CreateBox(`trimTopR_${doorId}`, {
        width: leafW,
        height: 0.08,
        depth: leafT + 0.016
      }, scene);
      trimTopR.parent = rightLeaf;
      trimTopR.position = new Vector3(0, leafH / 2 - 0.04, 0);
      trimTopR.material = modernFrameMat;
      trimTopR.receiveShadows = false;

      const trimBotR = MeshBuilder.CreateBox(`trimBotR_${doorId}`, {
        width: leafW,
        height: 0.12,
        depth: leafT + 0.016
      }, scene);
      trimBotR.parent = rightLeaf;
      trimBotR.position = new Vector3(0, -leafH / 2 + 0.06, 0);
      trimBotR.material = modernFrameMat;
      trimBotR.receiveShadows = false;

      // Modern overhead sliding track housing (depth 0.54 protrudes 0.02 beyond wall depth 0.50, preventing co-planar z-fighting)
      const trackHousing = MeshBuilder.CreateBox(`trackHousing_${doorId}`, {
        width: totalW + 0.8,
        height: 0.16,
        depth: 0.54
      }, scene);
      trackHousing.parent = doorRoot;
      trackHousing.position = new Vector3(0, totalH + 0.08, 0);
      trackHousing.material = modernFrameMat;
      trackHousing.receiveShadows = false;

      // Thin neon light guide along track housing (protrudes 0.01 beyond track housing)
      const trackNeon = MeshBuilder.CreateBox(`trackNeon_${doorId}`, {
        width: totalW + 0.4,
        height: 0.02,
        depth: 0.56
      }, scene);
      trackNeon.parent = doorRoot;
      trackNeon.position = new Vector3(0, totalH + 0.01, 0);
      trackNeon.material = neonCyanMat;
      trackNeon.receiveShadows = false;
    }

    return {
      id: doorId,
      config,
      doorType,
      posZ,
      openDist,
      closeDist,
      animDuration,
      doorRoot,
      leftLeaf,
      rightLeaf,
      leftHinge,
      rightHinge,
      leafW,
      soundOpen: config.soundOpen || "/sounds/door-open.wav",
      soundClose: config.soundClose || "/sounds/door-close.wav",
      // State
      currentProgress: 0.0, // 0 = closed, 1 = fully open
      targetProgress: 0.0,
      isOpen: false
    };
  });

  // Smooth Hermite / Ease-in-out curve
  function smoothStep(t) {
    return t * t * (3 - 2 * t);
  }

  // Animation & Proximity Update Loop
  // FIX #6 (dt cap): Cap deltaTime to 50ms to prevent doors from teleporting to open/closed
  // when the browser tab resumes from a long idle period.
  // FIX #2 (Event listener leak): Store observer so callers can remove it on scene disposal.
  const doorObserver = scene.onBeforeRenderObservable.add(() => {
    if (!character || !character.capsule) return;
    const playerPos = character.capsule.position;
    // FIX #6: cap dt so a paused-tab resume doesn't skip the smooth door animation
    const deltaTime = Math.min(scene.getEngine().getDeltaTime() / 1000, 0.05);
    if (deltaTime <= 0) return;

    doors.forEach((door) => {
      // Calculate distance between character and doorway threshold
      const dist = Vector3.Distance(
        new Vector3(playerPos.x, 0, playerPos.z),
        new Vector3(door.doorRoot.position.x, 0, door.posZ)
      );

      // Automatic proximity triggering with hysteresis:
      // Open when within openDist (3 units)
      // Close when further than closeDist (5 units)
      if (dist <= door.openDist) {
        if (!door.isOpen) {
          door.isOpen = true;
          door.targetProgress = 1.0;
          // Swing away from the approaching character
          door.swingDir = (playerPos.z < door.posZ) ? 1 : -1;
          playDoorSound('open', door.soundOpen);
        }
      } else if (dist >= door.closeDist) {
        if (door.isOpen) {
          door.isOpen = false;
          door.targetProgress = 0.0;
          playDoorSound('close', door.soundClose);
        }
      }

      // Smooth 0.6s animation interpolation
      const step = deltaTime / door.animDuration;
      if (door.targetProgress > door.currentProgress) {
        door.currentProgress = Math.min(door.targetProgress, door.currentProgress + step);
      } else if (door.targetProgress < door.currentProgress) {
        door.currentProgress = Math.max(door.targetProgress, door.currentProgress - step);
      }

      const eased = smoothStep(door.currentProgress);

      // Apply animation transforms
      if (door.doorType === "swing") {
        // Swing leaves 90 degrees (+PI/2 and -PI/2) flush against walls away from character
        const maxSwing = Math.PI / 2.05; // ~88 degrees
        const dir = door.swingDir || 1;
        door.leftHinge.rotation.y = -dir * eased * maxSwing;
        door.rightHinge.rotation.y = dir * eased * maxSwing;
      } else {
        // Slide leaves sideways into the wall pockets
        const slideOffset = door.leafW * 0.98; // Slide 2.15 units
        door.leftLeaf.position.x = -door.leafW / 2 - eased * slideOffset;
        door.rightLeaf.position.x = door.leafW / 2 + eased * slideOffset;
      }

      // Dynamic collision control:
      // checkCollisions = true while closed, disabled while open so character passes freely
      const shouldCollide = door.currentProgress < 0.15;
      if (door.leftLeaf.checkCollisions !== shouldCollide) {
        door.leftLeaf.checkCollisions = shouldCollide;
        door.rightLeaf.checkCollisions = shouldCollide;
      }
    });
  });

  return { doors, doorObserver }; // FIX #2: expose observer for scene.onBeforeRenderObservable.remove()
}
