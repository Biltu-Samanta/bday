import {
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  SpotLight,
  Texture
} from '@babylonjs/core';

// FIX #5 (Config reload): Hardcoded default frame configuration used when config.json fails to load.
// This ensures the museum opens even if the network request for config.json fails.
const DEFAULT_FRAMES_CONFIG = [
  // Room 1 (5 frames)
  {
    id: "frame-1",
    title: "Winter Solace",
    artist: "Diyu",
    year: "2025",
    caption: "A serene moment captured in soft winter light, radiating quiet warmth and gentle contemplation.",
    image: "/Diyu photos/IMG-20251210-WA0008.jpg",
    width: 2.0,
    height: 2.65,
    position: { room: 1, wall: "west", offset: -25, y: 2.5 }
  },
  {
    id: "frame-2",
    title: "December Glow",
    artist: "Diyu",
    year: "2025",
    caption: "Delicate holiday atmosphere and subtle illumination highlighting quiet moments of happiness.",
    image: "/Diyu photos/IMG-20251212-WA0017.jpg",
    width: 1.25,
    height: 2.8,
    position: { room: 1, wall: "west", offset: -16, y: 2.5 }
  },
  {
    id: "frame-3",
    title: "New Dawn",
    artist: "Diyu",
    year: "2026",
    caption: "Greeting the first bright morning of the new year with optimism, laughter, and open horizons.",
    image: "/Diyu photos/IMG20260101120313.jpg",
    width: 1.5,
    height: 2.67,
    position: { room: 1, wall: "south", offset: 0, y: 2.5 }
  },
  {
    id: "frame-4",
    title: "Golden Twilight",
    artist: "Diyu",
    year: "2026",
    caption: "Sunset colors settling into evening hues, reflecting cherished memories and peaceful stillness.",
    image: "/Diyu photos/IMG20260101175932.jpg",
    width: 1.5,
    height: 2.67,
    position: { room: 1, wall: "east", offset: -25, y: 2.5 }
  },
  {
    id: "frame-5",
    title: "Whispering Breezes",
    artist: "Diyu",
    year: "2026",
    caption: "A candid glance caught mid-conversation, full of natural elegance and spontaneous delight.",
    image: "/Diyu photos/IMG-20260124-WA0007.jpg",
    width: 1.95,
    height: 2.63,
    position: { room: 1, wall: "east", offset: -16, y: 2.5 }
  },
  // Room 2 (5 frames)
  {
    id: "frame-6",
    title: "Spring Awakening",
    artist: "Diyu",
    year: "2026",
    caption: "Midday sun casting crisp shadows as spring blossoms begin to fill the air with life.",
    image: "/Diyu photos/IMG20260320141426.jpg",
    width: 1.5,
    height: 2.67,
    position: { room: 2, wall: "west", offset: -5.5, y: 2.5 }
  },
  {
    id: "frame-7",
    title: "Afternoon Serenade",
    artist: "Diyu",
    year: "2026",
    caption: "A vibrant expression of joy and graceful ease under radiant spring daylight.",
    image: "/Diyu photos/IMG20260320151758.jpg",
    width: 3.4,
    height: 1.91,
    position: { room: 2, wall: "west", offset: 0, y: 2.5 }
  },
  {
    id: "frame-8",
    title: "Sunlit Reverie",
    artist: "Diyu",
    year: "2026",
    caption: "Gentle afternoon rays framing subtle expressions and quiet inner beauty.",
    image: "/Diyu photos/IMG20260325145956.jpg",
    width: 1.5,
    height: 2.67,
    position: { room: 2, wall: "west", offset: 5.5, y: 2.5 }
  },
  {
    id: "frame-9",
    title: "May Blossom",
    artist: "Diyu",
    year: "2026",
    caption: "Early summer breezes bringing vibrant color and carefree laughter to life.",
    image: "/Diyu photos/IMG-20260519-WA0029.jpg",
    width: 1.5,
    height: 2.67,
    position: { room: 2, wall: "east", offset: -3.5, y: 2.5 }
  },
  {
    id: "frame-10",
    title: "Midnight Harmony",
    artist: "Diyu",
    year: "2026",
    caption: "Soft nocturnal mood bathed in ambient moonlight, intimate and deeply atmospheric.",
    image: "/Diyu photos/IMG20261012003411.jpg",
    width: 3.4,
    height: 1.91,
    position: { room: 2, wall: "east", offset: 3.5, y: 2.5 }
  },
  // Room 3 (5 frames)
  {
    id: "frame-11",
    title: "Starlight Reflections",
    artist: "Diyu",
    year: "2026",
    caption: "Quiet night-time serenity captured with genuine warmth and gentle grace.",
    image: "/Diyu photos/IMG20261012003506.jpg",
    width: 3.4,
    height: 1.91,
    position: { room: 3, wall: "west", offset: 15.5, y: 2.5 }
  },
  {
    id: "frame-12",
    title: "Morning Clarity",
    artist: "Diyu",
    year: "2026",
    caption: "A fresh autumn morning filled with radiant clarity, calm spirit, and bright confidence.",
    image: "/Diyu photos/IMG_20261028_094609.png",
    width: 2.3,
    height: 2.3,
    position: { room: 3, wall: "west", offset: 21.0, y: 2.5 }
  },
  {
    id: "frame-13",
    title: "Artistic Elegance",
    artist: "Diyu",
    year: "2026",
    caption: "A stylized modern portrait infused with expressive artistry and delicate color tones.",
    image: "/Diyu photos/Picsart_26-10-16_22-13-33-856.png",
    width: 1.5,
    height: 2.67,
    position: { room: 3, wall: "west", offset: 26.5, y: 2.5 }
  },
  {
    id: "frame-14",
    title: "Eternal Radiance",
    artist: "Diyu",
    year: "2026",
    caption: "Capturing a timeless sparkle and effortless charm in vivid definition.",
    image: "/Diyu photos/file_0000000018248211b1d1f785de60fa40.png",
    width: 2.0,
    height: 2.67,
    position: { room: 3, wall: "east", offset: 17.5, y: 2.5 }
  },
  {
    id: "frame-15",
    title: "Graceful Horizons",
    artist: "Diyu",
    year: "2026",
    caption: "Poised and radiant, celebrating cherished memories that light up every room.",
    image: "/Diyu photos/file_00000000db608211ad9ea0eef5038769.png",
    width: 3.4,
    height: 1.91,
    position: { room: 3, wall: "east", offset: 24.5, y: 2.5 }
  }
];

/**
 * Loads the frame configurations from public/config.json.
 * FIX #5 (Config reload): Falls back to DEFAULT_FRAMES_CONFIG if config.json is missing,
 * unreachable, or malformed — so the museum always opens with at least some frames visible.
 */
export async function loadFrameConfig() {
  try {
    // FIX #4 (Async error): Added explicit .catch chain so a network failure is handled
    // gracefully rather than propagating an unhandled rejection.
    const res = await fetch('/config.json').catch(err => {
      // FIX #4: Network-level fetch failure (offline, 404, CORS) caught here
      console.error('[Frames] fetch(/config.json) network error:', err);
      return null; // Signal failure to the code below
    });

    // FIX #3 (Null check): Guard against null response from the .catch above
    if (!res) {
      console.warn('[Frames] config.json unreachable — using hardcoded default frames.');
      return DEFAULT_FRAMES_CONFIG;
    }

    if (!res.ok) {
      // FIX #5 (Config reload): HTTP error (404, 500, etc.) — use defaults
      console.warn(`[Frames] config.json returned HTTP ${res.status} — using hardcoded default frames.`);
      return DEFAULT_FRAMES_CONFIG;
    }

    const data = await res.json().catch(err => {
      // FIX #4: JSON parse failure (malformed config.json)
      console.error('[Frames] config.json JSON parse error:', err);
      return null;
    });

    // FIX #3 (Null check): Guard against null from failed JSON parse
    if (!data) {
      console.warn('[Frames] config.json invalid JSON — using hardcoded default frames.');
      return DEFAULT_FRAMES_CONFIG;
    }

    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.frames)) return data.frames;

    // FIX #5 (Config reload): Config loaded but has no recognisable frames array — use defaults
    console.warn('[Frames] config.json has no "frames" array — using hardcoded default frames.');
    return DEFAULT_FRAMES_CONFIG;
  } catch (err) {
    // FIX #4 (Async error): Catch-all for any unexpected error
    console.error('[Frames] Unexpected error loading config.json:', err);
    // FIX #5 (Config reload): Museum still opens with default frames
    return DEFAULT_FRAMES_CONFIG;
  }
}

/**
 * Creates picture frames on the museum walls based on config entries.
 * Returns created frame data objects. Call disposeFrames(frames) to free GPU resources.
 */
export function createFrames(scene, framesConfig, shadowGenerator) {
  const frames = [];

  // Frame molding materials
  const goldFrameMat = new StandardMaterial("frameGoldMat", scene);
  goldFrameMat.diffuseColor = new Color3(0.85, 0.65, 0.22);
  goldFrameMat.specularColor = new Color3(0.2, 0.16, 0.08);
  goldFrameMat.specularPower = 32;
  goldFrameMat.maxSimultaneousLights = 8;
  goldFrameMat.zOffset = -1;

  const darkWoodFrameMat = new StandardMaterial("frameDarkWoodMat", scene);
  darkWoodFrameMat.diffuseColor = new Color3(0.15, 0.11, 0.08);
  darkWoodFrameMat.specularColor = new Color3(0.04, 0.04, 0.04);
  darkWoodFrameMat.maxSimultaneousLights = 8;
  darkWoodFrameMat.zOffset = -1;

  const brassPlacardMat = new StandardMaterial("brassPlacardMat", scene);
  brassPlacardMat.diffuseColor = new Color3(0.8, 0.68, 0.3);
  brassPlacardMat.specularColor = new Color3(0.2, 0.18, 0.08);
  brassPlacardMat.maxSimultaneousLights = 8;
  brassPlacardMat.zOffset = -2; // Slightly higher priority than frame to prevent overlap z-fighting

  // FIX #3 (Null check): Guard against null/undefined framesConfig
  if (!framesConfig || !Array.isArray(framesConfig)) {
    console.warn('[Frames] createFrames received invalid framesConfig — no frames will be created.');
    return frames;
  }

  framesConfig.forEach((item, index) => {
    // FIX #3 (Null check): Guard against malformed config entries
    if (!item || !item.position) {
      console.warn(`[Frames] Frame entry at index ${index} is missing position data — skipping.`);
      return;
    }

    const room = parseInt(item.position.room) || 1;
    const wall = (item.position.wall || "west").toLowerCase().trim();
    const offset = item.position.offset !== undefined ? parseFloat(item.position.offset) : null;
    const posY = item.position.y !== undefined ? parseFloat(item.position.y) : 2.5;

    const canvasW = item.width || 3.2;
    const canvasH = item.height || 2.1;
    const borderW = 0.24;
    const frameDepth = 0.12;

    let frameX = 0;
    let frameZ = 0;
    let canvasX = 0;
    let canvasZ = 0;
    let placardX = 0;
    let placardZ = 0;

    let frameBoxW = 0;
    let frameBoxD = 0;
    let placardW = 0;
    let placardD = 0;

    let canvasRotY = 0;
    let normal = new Vector3(0, 0, 1);
    let targetAlpha = 0;

    // Museum Wall inner faces:
    // Room 1 & 3 West wall inner face: X = -8.75
    // Room 1 & 3 East wall inner face: X = +8.75
    // Room 2 West wall inner face: X = -10.75
    // Room 2 East wall inner face: X = +10.75
    // Room 1 South wall inner face: Z = -31.75
    // Room 3 North wall inner face: Z = +31.75

    if (wall === "west") {
      const wallInnerX = room === 2 ? -10.75 : -8.75;
      const defaultZ = room === 1 ? -20 : (room === 2 ? 0 : 21);
      const z = offset !== null ? offset : defaultZ;

      frameX = wallInnerX + frameDepth / 2; // -8.69 or -10.69
      frameZ = z;
      frameBoxW = frameDepth;
      frameBoxD = canvasW + borderW * 2;

      canvasX = frameX + frameDepth / 2 + 0.02; // -8.61 or -10.61
      canvasZ = z;
      canvasRotY = Math.PI / 2; // Normals point towards +X (East into room)

      placardX = canvasX;
      placardZ = z;
      placardW = 0.04;
      placardD = 0.9;

      normal = new Vector3(1, 0, 0);
      targetAlpha = 0; // Camera at +X looking West at frame
    } else if (wall === "east") {
      const wallInnerX = room === 2 ? 10.75 : 8.75;
      const defaultZ = room === 1 ? -20 : (room === 2 ? 0 : 21);
      const z = offset !== null ? offset : defaultZ;

      frameX = wallInnerX - frameDepth / 2; // 8.69 or 10.69
      frameZ = z;
      frameBoxW = frameDepth;
      frameBoxD = canvasW + borderW * 2;

      canvasX = frameX - frameDepth / 2 - 0.02; // 8.61 or 10.61
      canvasZ = z;
      canvasRotY = -Math.PI / 2; // Normals point towards -X (West into room)

      placardX = canvasX;
      placardZ = z;
      placardW = 0.04;
      placardD = 0.9;

      normal = new Vector3(-1, 0, 0);
      targetAlpha = Math.PI; // Camera at -X looking East at frame
    } else if (wall === "south") {
      const defaultX = 0;
      const x = offset !== null ? offset : defaultX;
      const wallInnerZ = -31.75;

      frameX = x;
      frameZ = wallInnerZ + frameDepth / 2;
      frameBoxW = canvasW + borderW * 2;
      frameBoxD = frameDepth;

      canvasX = x;
      canvasZ = frameZ + frameDepth / 2 + 0.02;
      canvasRotY = Math.PI; // Normals point towards +Z (North into room)

      placardX = x;
      placardZ = canvasZ;
      placardW = 0.9;
      placardD = 0.04;

      normal = new Vector3(0, 0, 1);
      targetAlpha = Math.PI / 2;
    } else if (wall === "north") {
      const defaultX = 0;
      const x = offset !== null ? offset : defaultX;
      const wallInnerZ = 31.75;

      frameX = x;
      frameZ = wallInnerZ - frameDepth / 2;
      frameBoxW = canvasW + borderW * 2;
      frameBoxD = frameDepth;

      canvasX = x;
      canvasZ = frameZ - frameDepth / 2 - 0.02;
      canvasRotY = 0; // Normals point towards -Z (South into room)

      placardX = x;
      placardZ = canvasZ;
      placardW = 0.9;
      placardD = 0.04;

      normal = new Vector3(0, 0, -1);
      targetAlpha = -Math.PI / 2;
    }

    // 1. Ornate Border Frame
    const frameMesh = MeshBuilder.CreateBox(`frame_${item.id || index}`, {
      width: frameBoxW,
      height: canvasH + borderW * 2,
      depth: frameBoxD
    }, scene);
    frameMesh.position = new Vector3(frameX, posY, frameZ);
    frameMesh.material = room === 3 ? darkWoodFrameMat : goldFrameMat;
    frameMesh.checkCollisions = true;
    frameMesh.receiveShadows = false; // Prevent shadow acne/flickering on frame edges

    // 2. Picture Canvas Plane with DoubleSide orientation
    const canvasMesh = MeshBuilder.CreatePlane(`canvas_${item.id || index}`, {
      width: canvasW,
      height: canvasH,
      sideOrientation: Mesh.DOUBLESIDE
    }, scene);
    canvasMesh.position = new Vector3(canvasX, posY, canvasZ);
    canvasMesh.rotation.y = canvasRotY;

    // Image Texture with auto-normalization
    let imagePath = item.image || "";
    if (!imagePath.startsWith('/') && !imagePath.startsWith('http') && !imagePath.startsWith('data:')) {
      imagePath = '/' + imagePath;
    }
    const safeImagePath = imagePath.startsWith('data:') ? imagePath : encodeURI(decodeURI(imagePath));

    const artMat = new StandardMaterial(`artMat_${item.id || index}`, scene);
    // invertY = true ensures upright wall photos without upside-down inversion
    // FIX #4 (Async error): Texture constructor is synchronous but will silently fail if the
    // file is missing. The onLoadError callback logs a warning so it doesn't crash the scene.
    const texture = new Texture(
      safeImagePath,
      scene,
      false,
      true,
      Texture.BILINEAR_SAMPLINGMODE,
      null, // onLoad callback (unused)
      (msg, ex) => {
        // FIX #3 (Null check) + FIX #4: Log a warning if the artwork image is missing
        console.warn(`[Frames] Could not load artwork texture "${imagePath}": ${msg}`, ex);
      }
    );

    // Optional texture rotation support (defaults to 0)
    const rotDeg = parseFloat(item.rotation || item.imageRotation || 0);
    if (rotDeg !== 0) {
      texture.uPivot = 0.5;
      texture.vPivot = 0.5;
      texture.wAng = (rotDeg * Math.PI) / 180;
    }

    artMat.diffuseTexture = texture;
    artMat.specularColor = new Color3(0.02, 0.02, 0.02); // Authentic matte canvas texture
    artMat.ambientColor = new Color3(0.65, 0.65, 0.65);
    artMat.emissiveColor = new Color3(0.3, 0.3, 0.3); // Photos stay bright and colorful under any light
    artMat.backFaceCulling = false;
    artMat.maxSimultaneousLights = 8;
    artMat.zOffset = -1;
    canvasMesh.material = artMat;
    canvasMesh.receiveShadows = false;

    // 3. Brass Informational Placard
    const placardMesh = MeshBuilder.CreateBox(`placard_${item.id || index}`, {
      width: placardW,
      height: 0.28,
      depth: placardD
    }, scene);
    placardMesh.position = new Vector3(placardX, posY - canvasH / 2 - borderW - 0.22, placardZ);
    placardMesh.material = brassPlacardMat;
    placardMesh.receiveShadows = false;

    // 4. Dedicated Gallery Spotlight
    const spotPos = new Vector3(canvasX, posY, canvasZ)
      .add(normal.scale(2.2))
      .add(new Vector3(0, 1.6, 0));
    const spotDir = normal.scale(-1).add(new Vector3(0, -0.65, 0)).normalize();
    // Exponent 2 allows light to fade softly with no visible circle boundary
    const spot = new SpotLight(`spot_frame_${item.id || index}`, spotPos, spotDir, Math.PI / 2.6, 2, scene);
    spot.diffuse = new Color3(1.0, 0.95, 0.88);
    spot.specular = new Color3(0, 0, 0); // Eliminates harsh white glare circle on paintings
    spot.intensity = 1.2;
    spot.range = 8.0;

    // Isolate spotlight to illuminate only its own artwork, frame, placard, and wall
    const includedMeshes = [canvasMesh, frameMesh, placardMesh];
    // FIX #3 (Null check): getMeshByName can return null — already guarded below
    const wallMesh = scene.getMeshByName(`r${room}_${wall}`);
    if (wallMesh) {
      if (wallMesh.material) {
        wallMesh.material.maxSimultaneousLights = 8;
      }
      includedMeshes.push(wallMesh);
    } else {
      // FIX #3: Log a warning if the expected wall mesh is not found (typo in config, etc.)
      console.warn(`[Frames] Wall mesh "r${room}_${wall}" not found in scene — spotlight will not illuminate wall.`);
    }
    spot.includedOnlyMeshes = includedMeshes;

    // Metadata for interaction & inspection
    const frameData = {
      id: item.id || `frame-${index}`,
      config: item,
      title: item.title || "Untitled Artwork",
      artist: item.artist || "Unknown Artist",
      year: item.year || "",
      caption: item.caption || "",
      image: imagePath,
      rotation: rotDeg,
      roomName: `Room ${room}: ${room === 1 ? "The Grand Vestibule" : (room === 2 ? "Central Rotunda" : "Lumina Pavilion")}`,
      wallName: `${wall.charAt(0).toUpperCase() + wall.slice(1)} Wall`,
      frameMesh,
      canvasMesh,
      placardMesh,
      spot,
      // FIX #1 (Memory leak): Store texture reference so disposeFrames() can release GPU memory
      artTexture: texture,
      artMat,
      position: new Vector3(canvasX, posY, canvasZ),
      normal: normal,
      inspectTarget: new Vector3(canvasX, posY, canvasZ),
      targetAlpha: targetAlpha,
      targetBeta: Math.PI / 2.0,
      targetRadius: 2.0
    };

    frameMesh.metadata = frameData;
    canvasMesh.metadata = frameData;
    placardMesh.metadata = frameData;

    frameMesh.isPickable = true;
    canvasMesh.isPickable = true;
    placardMesh.isPickable = true;

    if (shadowGenerator) {
      shadowGenerator.addShadowCaster(frameMesh);
    }

    frames.push(frameData);
  });

  return frames;
}

/**
 * FIX #1 (Memory leak): Dispose all GPU resources (meshes, materials, textures, spotlights)
 * for a set of frames. Call this before replacing frames (e.g., on config reload).
 */
export function disposeFrames(frames) {
  if (!frames) return;
  frames.forEach((f) => {
    try {
      // Dispose spotlight
      if (f.spot) f.spot.dispose();
      // FIX #1: Dispose artwork texture explicitly before disposing material
      if (f.artTexture) f.artTexture.dispose();
      // Dispose canvas material (artMat)
      if (f.artMat) f.artMat.dispose();
      // Dispose meshes (frame, canvas, placard)
      if (f.canvasMesh) f.canvasMesh.dispose();
      if (f.frameMesh) f.frameMesh.dispose();
      if (f.placardMesh) f.placardMesh.dispose();
    } catch (err) {
      console.warn('[Frames] Error during frame disposal:', err);
    }
  });
}
