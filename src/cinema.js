import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  DynamicTexture,
  PointLight,
  SpotLight
} from '@babylonjs/core';

/**
 * Cinema Hall (Room 4) Controller
 * Manages the West Wall big video screen, interactive Red/Yellow toggle button,
 * automatic cinema room light dimming, and cinematic audiovisual playback.
 */
export function createCinema(scene, museumRoot) {
  // ==========================================
  // 1. Big Screen Geometry (West Wall, X = -8.85, Z = 44)
  // ==========================================
  const screenW = 10.5; // Width along Z axis
  const screenH = 4.3;  // Height along Y axis
  const screenCenter = new Vector3(-8.85, 2.5, 44);

  // Black frame border around the screen
  const frameBorder = MeshBuilder.CreateBox("cinemaScreenFrame", {
    width: 0.15,
    height: screenH + 0.35,
    depth: screenW + 0.4
  }, scene);
  frameBorder.position = new Vector3(-8.92, 2.5, 44);
  const frameBorderMat = new StandardMaterial("cinemaFrameMat", scene);
  frameBorderMat.diffuseColor = new Color3(0.04, 0.04, 0.05);
  frameBorderMat.specularColor = new Color3(0.15, 0.15, 0.18);
  frameBorderMat.specularPower = 64;
  frameBorder.material = frameBorderMat;
  frameBorder.receiveShadows = false;
  if (museumRoot) frameBorder.parent = museumRoot;

  // Screen Plane facing East (+X into room)
  const screenMesh = MeshBuilder.CreatePlane("cinemaScreenMesh", {
    width: screenW,
    height: screenH
  }, scene);
  screenMesh.position = screenCenter;
  screenMesh.rotation.y = Math.PI / 2; // Face East (+X)
  if (museumRoot) screenMesh.parent = museumRoot;

  // Dynamic Texture for Video Playback (1280 x 720 HD)
  const texW = 1280;
  const texH = 720;
  const dynamicTex = new DynamicTexture("cinemaVideoTexture", { width: texW, height: texH }, scene, false);
  dynamicTex.hasAlpha = false;

  const screenMat = new StandardMaterial("cinemaScreenMat", scene);
  screenMat.diffuseTexture = dynamicTex;
  screenMat.emissiveColor = new Color3(0.9, 0.9, 0.9);
  screenMat.specularColor = new Color3(0, 0, 0);
  screenMat.backFaceCulling = false;
  screenMesh.material = screenMat;

  // ==========================================
  // 2. Physical 3D Button beside Screen
  // ==========================================
  // Wall console plate mounted beside screen on West Wall (Z = 50.0, Y = 1.45)
  const buttonPlate = MeshBuilder.CreateBox("cinemaButtonPlate", {
    width: 0.08,
    height: 0.7,
    depth: 0.55
  }, scene);
  buttonPlate.position = new Vector3(-8.72, 1.45, 50.0);
  const plateMat = new StandardMaterial("cinemaPlateMat", scene);
  plateMat.diffuseColor = new Color3(0.12, 0.13, 0.16);
  plateMat.specularColor = new Color3(0.3, 0.3, 0.35);
  plateMat.specularPower = 32;
  buttonPlate.material = plateMat;
  buttonPlate.isPickable = true;
  buttonPlate.metadata = { isCinemaButton: true };
  if (museumRoot) buttonPlate.parent = museumRoot;

  // Button Bezel Trim (Metallic ring)
  const buttonBezel = MeshBuilder.CreateCylinder("cinemaButtonBezel", {
    diameter: 0.38,
    height: 0.09
  }, scene);
  buttonBezel.position = new Vector3(-8.66, 1.45, 50.0);
  buttonBezel.rotation.z = Math.PI / 2; // Axis points East
  const bezelMat = new StandardMaterial("cinemaBezelMat", scene);
  bezelMat.diffuseColor = new Color3(0.7, 0.6, 0.3); // Brass bezel
  buttonBezel.material = bezelMat;
  buttonBezel.isPickable = true;
  buttonBezel.metadata = { isCinemaButton: true };
  if (museumRoot) buttonBezel.parent = museumRoot;

  // Interactive Push Button (Red when OFF, Yellow when PLAYING)
  const buttonMesh = MeshBuilder.CreateCylinder("cinemaPushButton", {
    diameter: 0.28,
    height: 0.12
  }, scene);
  buttonMesh.position = new Vector3(-8.61, 1.45, 50.0);
  buttonMesh.rotation.z = Math.PI / 2; // Axis points East
  buttonMesh.isPickable = true;
  buttonMesh.metadata = { isCinemaButton: true };
  if (museumRoot) buttonMesh.parent = museumRoot;

  const buttonRedMat = new StandardMaterial("buttonRedMat", scene);
  buttonRedMat.diffuseColor = new Color3(0.95, 0.1, 0.1);
  buttonRedMat.emissiveColor = new Color3(0.85, 0.05, 0.05);
  buttonRedMat.specularColor = new Color3(1.0, 0.5, 0.5);
  buttonRedMat.specularPower = 48;

  const buttonYellowMat = new StandardMaterial("buttonYellowMat", scene);
  buttonYellowMat.diffuseColor = new Color3(1.0, 0.85, 0.05);
  buttonYellowMat.emissiveColor = new Color3(0.95, 0.8, 0.0);
  buttonYellowMat.specularColor = new Color3(1.0, 1.0, 0.6);
  buttonYellowMat.specularPower = 64;

  buttonMesh.material = buttonRedMat; // Initial: OFF = RED

  // Button Label Indicator Light
  const buttonGlow = new PointLight("buttonGlow", new Vector3(-8.5, 1.45, 50.0), scene);
  buttonGlow.diffuse = new Color3(1.0, 0.1, 0.1);
  buttonGlow.intensity = 0.5;
  buttonGlow.range = 2.8;

  // ==========================================
  // 3. Cinema Room Lighting & Dimming
  // ==========================================
  // Main Room 4 Ceiling Chandelier / Downlight
  const r4CeilingLight = new PointLight("r4CeilingLight", new Vector3(0, 4.4, 44), scene);
  r4CeilingLight.diffuse = new Color3(0.95, 0.88, 0.78);
  r4CeilingLight.intensity = 0.85; // Bright when OFF
  r4CeilingLight.range = 24;

  // Room 4 Wall Sconces
  const r4Sconce1 = new PointLight("r4Sconce1", new Vector3(8.5, 3.2, 38), scene);
  r4Sconce1.diffuse = new Color3(1.0, 0.85, 0.65);
  r4Sconce1.intensity = 0.6;
  r4Sconce1.range = 14;

  const r4Sconce2 = new PointLight("r4Sconce2", new Vector3(8.5, 3.2, 50), scene);
  r4Sconce2.diffuse = new Color3(1.0, 0.85, 0.65);
  r4Sconce2.intensity = 0.6;
  r4Sconce2.range = 14;

  // Soft ambient projector light from screen towards audience
  const screenProjectorLight = new SpotLight(
    "screenProjectorLight",
    new Vector3(-8.6, 2.5, 44),
    new Vector3(1, -0.15, 0),
    Math.PI / 2.2,
    2,
    scene
  );
  screenProjectorLight.diffuse = new Color3(0.4, 0.6, 0.9);
  screenProjectorLight.intensity = 0.0; // Activated when movie plays
  screenProjectorLight.range = 18;

  // Target lighting intensities
  let targetCeilingIntensity = 0.85;
  let targetSconceIntensity = 0.60;
  let targetProjectorIntensity = 0.0;

  // ==========================================
  // 4. Cinema Audio Synthesizer (Movie Soundtrack)
  // ==========================================
  let audioCtx = null;
  let cinemaMasterGain = null;
  let movieOscs = [];
  let isPlaying = false;

  function initCinemaAudio() {
    if (audioCtx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();

    cinemaMasterGain = audioCtx.createGain();
    cinemaMasterGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    cinemaMasterGain.connect(audioCtx.destination);
  }

  function startMovieAudio() {
    initCinemaAudio();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    cinemaMasterGain.gain.cancelScheduledValues(now);
    cinemaMasterGain.gain.linearRampToValueAtTime(0.35, now + 1.2);

    // Stop existing nodes
    movieOscs.forEach(o => {
      try { o.stop(); o.disconnect(); } catch (_) {}
    });
    movieOscs = [];

    // Cinematic Chord (D Minor Epic Film Score)
    const chordFreqs = [73.42, 110, 146.83, 220, 261.63, 293.66, 349.23, 440];
    chordFreqs.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = idx % 2 === 0 ? "sawtooth" : "triangle";
      osc.frequency.setValueAtTime(freq, now);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(320 + idx * 80, now);

      // Slow epic sweeping filter
      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      lfo.frequency.setValueAtTime(0.12 + idx * 0.02, now);
      lfoGain.gain.setValueAtTime(140, now);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      gain.gain.setValueAtTime(0.025 / (idx + 1), now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(cinemaMasterGain);

      osc.start(now);
      lfo.start(now);
      movieOscs.push(osc, lfo);
    });
  }

  function stopMovieAudio() {
    if (!audioCtx || !cinemaMasterGain) return;
    const now = audioCtx.currentTime;
    cinemaMasterGain.gain.cancelScheduledValues(now);
    cinemaMasterGain.gain.linearRampToValueAtTime(0.0001, now + 0.8);
    setTimeout(() => {
      movieOscs.forEach(o => {
        try { o.stop(); o.disconnect(); } catch (_) {}
      });
      movieOscs = [];
    }, 900);
  }

  function playButtonClickSound() {
    try {
      const ctx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (_) {}
  }

  // ==========================================
  // 5. Procedural Video Renderer Loop
  // ==========================================
  const ctx2d = dynamicTex.getContext();
  let animTime = 0;
  let videoFrameId = null;

  // Starfield particles for cinematic motion scene
  const stars = [];
  for (let i = 0; i < 160; i++) {
    stars.push({
      x: Math.random() * texW,
      y: Math.random() * texH,
      size: Math.random() * 2.5 + 0.5,
      speed: Math.random() * 1.5 + 0.5,
      color: Math.random() > 0.5 ? '#38bdf8' : (Math.random() > 0.5 ? '#f472b6' : '#e5b869')
    });
  }

  // Draw Standby / "Press Button to Play" Screen
  function drawStandbyScreen() {
    ctx2d.fillStyle = "#0a0c12";
    ctx2d.fillRect(0, 0, texW, texH);

    // Subtle cinema grid pattern
    ctx2d.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx2d.lineWidth = 1;
    for (let x = 0; x < texW; x += 64) {
      ctx2d.beginPath();
      ctx2d.moveTo(x, 0);
      ctx2d.lineTo(x, texH);
      ctx2d.stroke();
    }
    for (let y = 0; y < texH; y += 64) {
      ctx2d.beginPath();
      ctx2d.moveTo(0, y);
      ctx2d.lineTo(texW, y);
      ctx2d.stroke();
    }

    // Theater Title Badge
    ctx2d.textAlign = "center";
    ctx2d.textBaseline = "middle";

    ctx2d.font = "bold 26px 'Cinzel', serif, Georgia";
    ctx2d.fillStyle = "#e5b869";
    ctx2d.letterSpacing = "6px";
    ctx2d.fillText("GALERIE D'ART • CINÉMA HALL", texW / 2, texH / 2 - 90);

    // Standby icon
    ctx2d.beginPath();
    ctx2d.arc(texW / 2, texH / 2, 45, 0, Math.PI * 2);
    ctx2d.fillStyle = "rgba(229, 184, 105, 0.12)";
    ctx2d.fill();
    ctx2d.strokeStyle = "#e5b869";
    ctx2d.lineWidth = 3;
    ctx2d.stroke();

    // Play triangle
    ctx2d.beginPath();
    ctx2d.moveTo(texW / 2 - 14, texH / 2 - 22);
    ctx2d.lineTo(texW / 2 + 22, texH / 2);
    ctx2d.lineTo(texW / 2 - 14, texH / 2 + 22);
    ctx2d.closePath();
    ctx2d.fillStyle = "#e5b869";
    ctx2d.fill();

    // Red button prompt message
    ctx2d.font = "500 22px 'Inter', sans-serif";
    ctx2d.fillStyle = "#f8fafc";
    ctx2d.fillText("STANDBY • PRESS THE RED BUTTON TO START", texW / 2, texH / 2 + 95);

    ctx2d.font = "400 15px 'Inter', sans-serif";
    ctx2d.fillStyle = "#94a3b8";
    ctx2d.fillText("Button located on the console to the right of the screen", texW / 2, texH / 2 + 130);

    dynamicTex.update();
  }

  // Draw Live Movie Feature Screen
  function renderMovieFrame() {
    animTime += 0.03;

    // 1. Cosmic Aurora Background
    const bgGrad = ctx2d.createRadialGradient(texW / 2, texH / 2, 80, texW / 2, texH / 2, texW * 0.7);
    const pulse1 = Math.sin(animTime * 0.8) * 0.15 + 0.2;
    const pulse2 = Math.cos(animTime * 0.6) * 0.15 + 0.2;
    bgGrad.addColorStop(0, `rgba(30, 58, 138, ${pulse1})`);
    bgGrad.addColorStop(0.5, `rgba(88, 28, 135, ${pulse2})`);
    bgGrad.addColorStop(1, "#05060a");
    ctx2d.fillStyle = bgGrad;
    ctx2d.fillRect(0, 0, texW, texH);

    // 2. Animated Starfield
    stars.forEach(s => {
      s.x -= s.speed * 2.5;
      if (s.x < 0) s.x = texW;
      ctx2d.beginPath();
      ctx2d.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx2d.fillStyle = s.color;
      ctx2d.fill();
    });

    // 3. Floating 3D Geometric Ring Visualizer
    const cx = texW / 2;
    const cy = texH / 2;
    const numRings = 4;
    for (let r = 0; r < numRings; r++) {
      const radius = 110 + r * 38;
      const rot = animTime * (r % 2 === 0 ? 0.7 : -0.7) + (r * Math.PI) / 4;
      ctx2d.save();
      ctx2d.translate(cx, cy);
      ctx2d.rotate(rot);
      ctx2d.beginPath();
      ctx2d.ellipse(0, 0, radius, radius * 0.45, 0, 0, Math.PI * 2);
      ctx2d.strokeStyle = r === 0 ? "#38bdf8" : (r === 1 ? "#fbbf24" : (r === 2 ? "#f472b6" : "#a78bfa"));
      ctx2d.lineWidth = 2.5;
      ctx2d.stroke();
      ctx2d.restore();
    }

    // Central Core Pulse
    const coreRad = 35 + Math.sin(animTime * 3) * 6;
    const coreGrad = ctx2d.createRadialGradient(cx, cy, 2, cx, cy, coreRad);
    coreGrad.addColorStop(0, "#ffffff");
    coreGrad.addColorStop(0.4, "#38bdf8");
    coreGrad.addColorStop(1, "transparent");
    ctx2d.fillStyle = coreGrad;
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, coreRad, 0, Math.PI * 2);
    ctx2d.fill();

    // 4. Cinema Title & Live Player Overlays
    ctx2d.textAlign = "center";
    ctx2d.fillStyle = "#ffffff";
    ctx2d.font = "bold 32px 'Cinzel', serif, Georgia";
    ctx2d.letterSpacing = "4px";
    ctx2d.fillText("THE ARCHITECTURE OF LIGHT", cx, 85);

    ctx2d.font = "500 16px 'Inter', sans-serif";
    ctx2d.fillStyle = "#7dd3fc";
    ctx2d.letterSpacing = "2px";
    ctx2d.fillText("FEATURE PRESENTATION • 4K ULTRA-WIDE", cx, 125);

    // Subtitle card
    const captions = [
      "In the beginning, geometry defined the sacred space...",
      "Form follows thought across neoclassical corridors...",
      "Bronze, gold, and light converge into eternity...",
      "The cinematic sanctuary: where art dances with shadow."
    ];
    const captionIdx = Math.floor(animTime * 0.15) % captions.length;
    ctx2d.font = "italic 20px 'Cinzel', serif, Georgia";
    ctx2d.fillStyle = "#fef08a";
    ctx2d.fillText(captions[captionIdx], cx, texH - 110);

    // 5. Bottom Transport Bar & Timecode
    ctx2d.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx2d.fillRect(0, texH - 52, texW, 52);

    // Progress bar
    const progress = (animTime * 0.04) % 1.0;
    ctx2d.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx2d.fillRect(40, texH - 42, texW - 80, 6);
    ctx2d.fillStyle = "#f59e0b";
    ctx2d.fillRect(40, texH - 42, (texW - 80) * progress, 6);

    // Playing indicator & timecode
    ctx2d.textAlign = "left";
    ctx2d.font = "bold 14px monospace";
    ctx2d.fillStyle = "#fbbf24";
    ctx2d.fillText("▶ PLAYING", 40, texH - 18);

    const curSec = Math.floor(animTime * 2) % 360;
    const m = String(Math.floor(curSec / 60)).padStart(2, '0');
    const s = String(curSec % 60).padStart(2, '0');
    ctx2d.fillStyle = "#e2e8f0";
    ctx2d.fillText(`00:${m}:${s} / 00:06:00`, 140, texH - 18);

    ctx2d.textAlign = "right";
    ctx2d.fillStyle = "#94a3b8";
    ctx2d.fillText("PRESS YELLOW BUTTON TO PAUSE", texW - 40, texH - 18);

    dynamicTex.update();
  }

  // Draw initial standby frame
  drawStandbyScreen();

  // ==========================================
  // 6. Play / Stop Control Functionality
  // ==========================================
  function toggleVideo() {
    isPlaying = !isPlaying;
    playButtonClickSound();

    if (isPlaying) {
      // 1. Button turns YELLOW
      buttonMesh.material = buttonYellowMat;
      buttonGlow.diffuse = new Color3(1.0, 0.85, 0.0);
      buttonGlow.intensity = 0.8;

      // 2. Cinema room lights AUTOMATICALLY DIM DOWN
      targetCeilingIntensity = 0.06; // Dim cinema mode
      targetSconceIntensity = 0.04;
      targetProjectorIntensity = 0.65; // Screen glow activates

      // 3. Start Movie Audio
      startMovieAudio();

      // 4. Start Video Render Loop
      const loop = () => {
        if (!isPlaying) return;
        renderMovieFrame();
        videoFrameId = requestAnimationFrame(loop);
      };
      videoFrameId = requestAnimationFrame(loop);
    } else {
      // 1. Button turns RED
      buttonMesh.material = buttonRedMat;
      buttonGlow.diffuse = new Color3(1.0, 0.05, 0.05);
      buttonGlow.intensity = 0.4;

      // 2. Cinema room lights AUTOMATICALLY BECOME BRIGHT AGAIN
      targetCeilingIntensity = 0.85; // Full bright mode
      targetSconceIntensity = 0.60;
      targetProjectorIntensity = 0.0;

      // 3. Stop Movie Audio
      stopMovieAudio();

      // 4. Cancel animation loop and render standby screen
      if (videoFrameId) {
        cancelAnimationFrame(videoFrameId);
        videoFrameId = null;
      }
      drawStandbyScreen();
    }

    return isPlaying;
  }

  // Set button click handler
  buttonMesh.metadata = {
    isCinemaButton: true,
    action: toggleVideo
  };

  // Smooth lighting transitions in render observable
  // FIX #6 (dt cap): Cap deltaTime to 50ms to prevent lighting from jumping on tab resume.
  // FIX #2 (Event listener leak): Store the observer so dispose() can remove it.
  const lightingObserver = scene.onBeforeRenderObservable.add(() => {
    // FIX #6: cap dt at 0.05s so a paused-tab resume doesn't snap lights instantly
    const dt = Math.min(scene.getEngine().getDeltaTime() / 1000, 0.05);
    if (dt <= 0) return;

    // Smooth lighting lerp over ~1.2s
    const lerpSpeed = Math.min(1, dt * 2.8);
    r4CeilingLight.intensity += (targetCeilingIntensity - r4CeilingLight.intensity) * lerpSpeed;
    r4Sconce1.intensity += (targetSconceIntensity - r4Sconce1.intensity) * lerpSpeed;
    r4Sconce2.intensity += (targetSconceIntensity - r4Sconce2.intensity) * lerpSpeed;
    screenProjectorLight.intensity += (targetProjectorIntensity - screenProjectorLight.intensity) * lerpSpeed;
  });

  // FIX #1/#2 (Memory/listener leak): dispose() stops the video RAF loop and removes the
  // scene observer so nothing keeps running after the scene is destroyed.
  function disposeCinema() {
    if (videoFrameId) {
      cancelAnimationFrame(videoFrameId);
      videoFrameId = null;
    }
    if (lightingObserver) {
      scene.onBeforeRenderObservable.remove(lightingObserver);
    }
    // FIX #1: Dispose dynamic texture and screen material to free GPU memory
    if (dynamicTex) dynamicTex.dispose();
    if (screenMat) screenMat.dispose();
    if (frameBorderMat) frameBorderMat.dispose();
  }

  return {
    screenMesh,
    buttonMesh,
    buttonPlate,
    buttonBezel,
    r4CeilingLight,
    r4Sconce1,
    r4Sconce2,
    screenProjectorLight,
    toggleVideo,
    dispose: disposeCinema, // FIX #1/#2: expose cleanup for scene disposal
    get isPlaying() { return isPlaying; },
    buttonPosition: new Vector3(-8.61, 1.45, 50.0)
  };
}
