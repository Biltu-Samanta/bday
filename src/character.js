import {
  MeshBuilder,
  Vector3,
  ArcRotateCamera,
  SceneLoader,
  TransformNode,
  Scalar,
  Ray
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { museumAudio } from './audio.js';

export async function createCharacter(scene, canvas, shadowGenerator) {
  // 1. Invisible Collision Capsule (Mover Node)
  // Height 1.8 units, radius 0.4 (diameter 0.8)
  const capsule = MeshBuilder.CreateCapsule("playerCapsule", {
    radius: 0.4,
    height: 1.8,
    tessellation: 16,
    subdivisions: 2
  }, scene);

  // Initial starting position: Spawn player in Room 1 near south end facing North (+Z)
  capsule.position = new Vector3(0, 0.0, -26);
  capsule.rotation.y = 0; // Facing +Z (North) towards the center

  // Make capsule invisible and unpickable
  capsule.visibility = 0;
  capsule.isPickable = false;

  // Collision Configuration:
  // Ellipsoid (0.4, 0.9, 0.4) with ellipsoidOffset (0, 0.9, 0)
  // This places the ellipsoid center at y = 0.9, so the bottom of the ellipsoid (y = 0.9 - 0.9 = 0.0)
  // touches the floor exactly at feet level!
  capsule.checkCollisions = true;
  capsule.ellipsoid = new Vector3(0.4, 0.9, 0.4);
  capsule.ellipsoidOffset = new Vector3(0, 0.9, 0);

  // 2. Third-Person Orbit Camera — smooth professional follow with wall collision

  // --- Camera anchor: a TransformNode fixed at shoulder height (1.4m above capsule root)
  const cameraTarget = new TransformNode("cameraShoulderTarget", scene);
  cameraTarget.position = capsule.position.add(new Vector3(0, 1.4, 0));

  // Default / desired radius values (mutated by wall-collision logic each frame)
  const CAM_DEFAULT_RADIUS = 2.8;
  let camTargetRadius = CAM_DEFAULT_RADIUS; // desired radius this frame

  const camera = new ArcRotateCamera(
    "ThirdPersonCamera",
    -Math.PI / 2, // Behind character (facing +Z)
    Math.PI / 2.5, // Slightly above eye level
    CAM_DEFAULT_RADIUS,
    cameraTarget.position.clone(),
    scene
  );

  // --- Radius limits (allow zoom via scroll / pinch)
  camera.lowerRadiusLimit = 1.5;
  camera.upperRadiusLimit = 5.0;

  // --- Vertical angle limits: 0.35 = floor-safe floor, 1.45 = nearly top-down
  camera.lowerBetaLimit = 0.35;
  camera.upperBetaLimit = 1.45;

  camera.minZ = 0.1;
  camera.maxZ = 120.0;
  camera.fov  = 0.9;

  // --- Input / control
  // Disable Babylon's built-in collision (we do our own ray-based wall detection)
  camera.checkCollisions = false;

  // Mouse: left-button drag orbits; scroll zooms
  camera.attachControl(canvas, true);

  // Use left-mouse button (button index 0) for orbit, not right-button
  camera.inputs.attached.pointers.buttons = [0];

  // Scroll wheel precision: lower = faster zoom, higher = slower
  camera.wheelPrecision = 25;

  // Touch: built-in multi-touch support handles pinch-zoom and one-finger orbit
  // (Babylon's ArcRotateCameraPointersInput already supports this natively)

  // Smooth zoom: we manage camera.radius ourselves each frame via Scalar.Lerp,
  // so we initialise the target radius to match the camera's initial radius.
  camTargetRadius = camera.radius;

  // 3. Parent TransformNode called "characterRoot"
  // Its origin is the point on the floor under the character's feet (y = 0)
  const characterRoot = new TransformNode("characterRoot", scene);
  characterRoot.parent = capsule;
  characterRoot.position = Vector3.Zero();
  characterRoot.rotation = Vector3.Zero();

  let idleAnim = null;
  let walkAnim = null;
  let runAnim = null;
  let currentAnim = null;
  let currentModelResult = null;
  let currentGender = "female";

  // Aligns any GLB model so the bottom of its bounding box sits exactly at y = 0 of characterRoot
  async function loadCharacterModel(modelFile) {
    // FIX #1 (Memory Leak): Dispose previous model meshes AND their materials when swapping characters.
    // Previously, m.dispose(false, true) disposed geometry but not materials. Now we explicitly
    // dispose each mesh's material before disposing the mesh itself.
    if (currentModelResult) {
      currentModelResult.animationGroups.forEach((ag) => ag.stop());
      currentModelResult.meshes.forEach((m) => {
        if (shadowGenerator) {
          shadowGenerator.removeShadowCaster(m);
        }
        // FIX #1: Dispose material before mesh to avoid GPU memory leak on character swap
        if (m.material) {
          m.material.dispose(false, true); // dispose material + its textures
        }
        m.dispose(false, false); // dispose geometry only (material already disposed above)
      });
      currentModelResult = null;
      idleAnim = null;
      walkAnim = null;
      runAnim = null;
      currentAnim = null;
    }

    console.log(`[Character] Loading 3D model: /models/${modelFile}`);
    // FIX #4 (Async error): SceneLoader.ImportMeshAsync errors are caught by the caller's try/catch
    const result = await SceneLoader.ImportMeshAsync("", "/models/", modelFile, scene);
    currentModelResult = result;
    // FIX #3 (Null check): Guard against empty mesh array from loader
    if (!result.meshes || result.meshes.length === 0) {
      console.warn(`[Character] No meshes found in model: ${modelFile}`);
      return result;
    }
    const loadedRoot = result.meshes[0];

    // Parent inside characterRoot
    loadedRoot.parent = characterRoot;
    loadedRoot.position = Vector3.Zero();
    loadedRoot.rotation = Vector3.Zero();
    loadedRoot.scaling = new Vector3(1, 1, 1);

    // Collisions belong strictly to the mover capsule, not the internal mesh
    result.meshes.forEach((mesh) => {
      mesh.checkCollisions = false;
      mesh.isPickable = false;
    });

    // Dynamic shadow casting
    if (shadowGenerator) {
      result.meshes.forEach((mesh) => {
        if (mesh.getTotalVertices && mesh.getTotalVertices() > 0) {
          shadowGenerator.addShadowCaster(mesh);
        }
      });
    }

    // 1. Force world matrix calculation on root and all child meshes
    characterRoot.computeWorldMatrix(true);
    loadedRoot.computeWorldMatrix(true);
    result.meshes.forEach((m) => m.computeWorldMatrix(true));

    // 2. Measure raw bounds relative to characterRoot
    const rootPos = characterRoot.getAbsolutePosition();
    const rawBounds = loadedRoot.getHierarchyBoundingVectors(true);
    const rawMinY = rawBounds.min.y - rootPos.y;
    const rawMaxY = rawBounds.max.y - rootPos.y;
    const rawHeight = rawMaxY - rawMinY;

    // 3. Apply scaling to standard human height ~1.8m
    const targetHeight = 1.8;
    const scaleRatio = (rawHeight > 0.05) ? (targetHeight / rawHeight) : 1.0;
    loadedRoot.scaling.setAll(scaleRatio);

    // 4. Recompute hierarchy bounding vectors after scaling
    loadedRoot.computeWorldMatrix(true);
    result.meshes.forEach((m) => m.computeWorldMatrix(true));
    const scaledBounds = loadedRoot.getHierarchyBoundingVectors(true);
    const currentRootY = characterRoot.getAbsolutePosition().y;
    const scaledMinY = scaledBounds.min.y - currentRootY;
    const scaledMaxY = scaledBounds.max.y - currentRootY;
    const finalHeight = scaledMaxY - scaledMinY;

    // 5. Offset the model inside characterRoot so the bottom of its bounding box sits exactly at y = 0 of characterRoot
    loadedRoot.position.y = -scaledMinY;

    // 6. Verify feet alignment with getHierarchyBoundingVectors
    loadedRoot.computeWorldMatrix(true);
    result.meshes.forEach((m) => m.computeWorldMatrix(true));
    const verifiedBounds = loadedRoot.getHierarchyBoundingVectors(true);

    // 7. Log model height and bounding box minimum Y to console for verification
    console.log(`[Character Alignment] =================================`);
    console.log(`[Character Alignment] Active Model: ${modelFile}`);
    console.log(`[Character Alignment] Scaled Height: ${finalHeight.toFixed(4)}m`);
    console.log(`[Character Alignment] Bounding Box Min Y before offset: ${scaledMinY.toFixed(4)}m`);
    console.log(`[Character Alignment] Applied Y Offset: ${(-scaledMinY).toFixed(4)}m`);
    console.log(`[Character Alignment] Verified Feet Bounding Box Min Y: ${verifiedBounds.min.y.toFixed(4)}m (Feet at floor: 0.0000m)`);
    console.log(`[Character Alignment] =================================`);

    // Log available animation names
    const availableAnimNames = result.animationGroups.map((ag) => ag.name);
    console.log(`[Character Model] Available animations in ${modelFile}:`, availableAnimNames);

    // Stop all auto-playing animations
    result.animationGroups.forEach((ag) => ag.stop());

    // Helper to match animation by keywords
    function findAnimation(keywords) {
      for (const kw of keywords) {
        const found = result.animationGroups.find((ag) =>
          ag.name.toLowerCase().includes(kw.toLowerCase())
        );
        if (found) return found;
      }
      return null;
    }

    idleAnim = findAnimation(["idle_neutral", "idle"]);
    walkAnim = findAnimation(["walk", "walking"]);
    runAnim = findAnimation(["run", "running"]) || walkAnim;

    console.log(`[Character Model] Selected Idle:`, idleAnim ? idleAnim.name : "None");
    console.log(`[Character Model] Selected Walk:`, walkAnim ? walkAnim.name : "None");
    console.log(`[Character Model] Selected Run:`, runAnim ? runAnim.name : "None");

    if (idleAnim) {
      idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false);
      currentAnim = idleAnim;
    }

    return result;
  }

  // Load initial model (female.glb)
  try {
    await loadCharacterModel("female.glb");
  } catch (err) {
    // FIX #4 (Async error): Log clearly so missing model doesn't crash silently
    console.error("Failed to load character model female.glb:", err);
  }

  // Swap model between female.glb and male.glb
  async function swapModel(gender) {
    if (gender) {
      currentGender = gender;
    } else {
      currentGender = (currentGender === "female") ? "male" : "female";
    }
    const filename = currentGender === "female" ? "female.glb" : "male.glb";
    // FIX #4 (Async error): Wrap swap in try/catch so a missing GLB doesn't crash the museum
    try {
      await loadCharacterModel(filename);
    } catch (err) {
      console.error(`[Character] Failed to swap model to ${filename}:`, err);
    }
    return currentGender;
  }

  function switchAnimation(targetAnim, speedRatio = 1.0) {
    if (!targetAnim) return;
    if (currentAnim === targetAnim) {
      if (currentAnim.speedRatio !== speedRatio) {
        currentAnim.speedRatio = speedRatio;
      }
      return;
    }
    if (currentAnim) {
      currentAnim.stop();
    }
    currentAnim = targetAnim;
    currentAnim.speedRatio = speedRatio;
    currentAnim.start(true, speedRatio, currentAnim.from, currentAnim.to, false);
  }

  // 4. Input Handling
  const inputMap = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    jump: false
  };

  const onKeyDown = (e) => {
    switch (e.code) {
      case "KeyW":
      case "ArrowUp":
        inputMap.forward = true;
        break;
      case "KeyS":
      case "ArrowDown":
        inputMap.backward = true;
        break;
      case "KeyA":
      case "ArrowLeft":
        inputMap.left = true;
        break;
      case "KeyD":
      case "ArrowRight":
        inputMap.right = true;
        break;
      case "ShiftLeft":
      case "ShiftRight":
        inputMap.sprint = true;
        break;
      case "Space":
        inputMap.jump = true;
        break;
      case "KeyR":
        resetPosition();
        break;
    }
  };

  const onKeyUp = (e) => {
    switch (e.code) {
      case "KeyW":
      case "ArrowUp":
        inputMap.forward = false;
        break;
      case "KeyS":
      case "ArrowDown":
        inputMap.backward = false;
        break;
      case "KeyA":
      case "ArrowLeft":
        inputMap.left = false;
        break;
      case "KeyD":
      case "ArrowRight":
        inputMap.right = false;
        break;
      case "ShiftLeft":
      case "ShiftRight":
        inputMap.sprint = false;
        break;
      case "Space":
        inputMap.jump = false;
        break;
    }
  };

  // FIX #2 (Event listener leak): Store the blur handler in a named function so it can be
  // removed via removeEventListener when the scene is disposed.
  const onWindowBlur = () => {
    inputMap.forward = false;
    inputMap.backward = false;
    inputMap.left = false;
    inputMap.right = false;
    inputMap.sprint = false;
    inputMap.jump = false;
    museumAudio.setWalking(false);
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onWindowBlur);

  let verticalVelocity = 0;
  let isGrounded = true;
  const jumpForce = 5.2;
  const gravity = 15.0;

  function resetPosition() {
    capsule.position = new Vector3(0, 0.0, -26);
    capsule.rotation.y = 0;
    verticalVelocity = 0;
    isGrounded = true;
    camera.alpha = -Math.PI / 2;
    camera.beta = Math.PI / 2.5;
    // Restore full radius limits and reset radius
    camera.lowerRadiusLimit = 1.5;
    camera.upperRadiusLimit = 5.0;
    camera.radius = CAM_DEFAULT_RADIUS;
    camTargetRadius  = CAM_DEFAULT_RADIUS;
    const resetTarget = capsule.position.add(new Vector3(0, 1.4, 0));
    cameraTarget.position.copyFrom(resetTarget);
    camera.target = resetTarget;
    museumAudio.setWalking(false);
  }

  // 5. Movement and Camera Follow Loop
  const walkSpeed = 5.2;
  const sprintSpeed = 8.5;

  let currentVelocity = new Vector3(0, 0, 0);

  const state = {
    isControlLocked: false,  // locked by artwork inspection
    isPaused: false          // locked by pause menu
  };

  scene.onBeforeRenderObservable.add(() => {
    // FIX #6 (Double-tap / delta-time spike bug): Cap delta time to 50ms (20 FPS minimum).
    // Without this cap, a tab switch or heavy frame causes a massive dt spike, launching the
    // character across the room or through walls in a single frame.
    const deltaTime = Math.min(scene.getEngine().getDeltaTime() / 1000, 0.05);
    if (deltaTime <= 0) return;

    // Artwork inspection freezes character input
    if (state.isControlLocked) {
      currentVelocity = Vector3.Zero();
      verticalVelocity = 0;
      switchAnimation(idleAnim, 1.0);
      museumAudio.setWalking(false);
      return;
    }

    // Determine camera horizontal direction vectors
    const forward = camera.getDirection(new Vector3(0, 0, 1));
    forward.y = 0;
    forward.normalize();

    const right = camera.getDirection(new Vector3(1, 0, 0));
    right.y = 0;
    right.normalize();

    // Calculate desired movement vector
    const moveDir = new Vector3(0, 0, 0);
    if (inputMap.forward) moveDir.addInPlace(forward);
    if (inputMap.backward) moveDir.subtractInPlace(forward);
    if (inputMap.right) moveDir.addInPlace(right);
    if (inputMap.left) moveDir.subtractInPlace(right);

    const isMoving = moveDir.lengthSquared() > 0.001;

    if (isMoving) {
      moveDir.normalize();

      // Smoothly rotate capsule towards direction of movement
      const targetHeading = Math.atan2(moveDir.x, moveDir.z);
      let diff = targetHeading - capsule.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      capsule.rotation.y += diff * Math.min(1, deltaTime * 12);

      // Smoothly lerp camera alpha to follow character rotation (stays behind character when walking)
      const targetAlpha = -Math.PI / 2 - capsule.rotation.y;
      let diffAlpha = targetAlpha - camera.alpha;
      while (diffAlpha < -Math.PI) diffAlpha += Math.PI * 2;
      while (diffAlpha > Math.PI) diffAlpha -= Math.PI * 2;
      camera.alpha += diffAlpha * Math.min(1, deltaTime * 3.5);

      // Speed
      const speed = inputMap.sprint ? sprintSpeed : walkSpeed;
      const targetVelocity = moveDir.scale(speed);
      currentVelocity = Vector3.Lerp(currentVelocity, targetVelocity, Math.min(1, deltaTime * 14));

      // Play walk or run animation
      const targetAnim = inputMap.sprint && runAnim ? runAnim : walkAnim;
      const animSpeed = inputMap.sprint ? 1.25 : 1.0;
      switchAnimation(targetAnim, animSpeed);
    } else {
      // Smooth deceleration
      currentVelocity = Vector3.Lerp(currentVelocity, Vector3.Zero(), Math.min(1, deltaTime * 16));

      // Idle animation when stopped
      switchAnimation(idleAnim, 1.0);
    }

    // Jumping physics
    if (inputMap.jump && isGrounded) {
      verticalVelocity = jumpForce;
      isGrounded = false;
    }

    if (!isGrounded) {
      verticalVelocity -= gravity * deltaTime;
    }

    // Displacement vector for this frame (horizontal + vertical)
    const displacement = currentVelocity.scale(deltaTime);
    displacement.y = verticalVelocity * deltaTime;

    // Move capsule with Babylon.js collision detection
    capsule.moveWithCollisions(displacement);

    // Floor boundary clamp & grounded state
    // Museum floor is at y = 0. Capsule bottom is at y = 0 when capsule.position.y = 0.
    if (capsule.position.y <= 0.001) {
      capsule.position.y = 0.0;
      verticalVelocity = 0;
      isGrounded = true;
    } else if (capsule.position.y <= 0.06 && verticalVelocity <= 0) {
      capsule.position.y = 0.0;
      verticalVelocity = 0;
      isGrounded = true;
    }

    // Footstep Sound Effect: triggered when actively moving on floor
    const isActuallyWalking = isMoving && isGrounded && !state.isControlLocked;
    museumAudio.setWalking(isActuallyWalking, inputMap.sprint);

    // ─── A. Smooth Follow: lerp the shoulder TransformNode toward the capsule ───────
    // Only update when the capsule has actually moved to prevent jitter at idle
    const desiredTarget = capsule.position.add(new Vector3(0, 1.4, 0));
    const distToDesired = Vector3.Distance(cameraTarget.position, desiredTarget);
    if (distToDesired > 0.001) {
      // Factor 0.12 per frame — smooth but responsive follow, no snapping
      cameraTarget.position = Vector3.Lerp(cameraTarget.position, desiredTarget, 0.12);
    }
    // Keep the ArcRotateCamera's target in sync with the TransformNode
    camera.target.copyFrom(cameraTarget.position);

    // ─── B. Wall Collision: ray from character head toward camera ─────────────────
    // Head position is 1.6m above capsule root (eye height, slightly above shoulder)
    const headPos  = capsule.position.add(new Vector3(0, 1.6, 0));
    const camPos   = camera.position;           // current world-space camera position
    const toCam    = camPos.subtract(headPos);
    const rayLen   = toCam.length();

    if (rayLen > 0.01) {
      const rayDir = toCam.normalize();
      const wallRay = new Ray(headPos, rayDir, rayLen);

      // pickWithRay only hits meshes with checkCollisions = true (walls, floor, etc.)
      const hit = scene.pickWithRay(wallRay, (mesh) => mesh.checkCollisions === true && !mesh.isPickable === false);

      if (hit && hit.hit && hit.distance < rayLen) {
        // Obstruction found — pull camera in (minus 0.3m buffer so it doesn't clip)
        const safeRadius = Math.max(camera.lowerRadiusLimit, hit.distance - 0.3);
        camTargetRadius = safeRadius;
      } else {
        // Path is clear — smoothly restore toward the desired/user-set radius
        // The user-intended radius is clamped within [lowerRadiusLimit, upperRadiusLimit]
        const restoredRadius = Math.min(
          Math.max(CAM_DEFAULT_RADIUS, camera.lowerRadiusLimit),
          camera.upperRadiusLimit
        );
        camTargetRadius = Scalar.Lerp(camTargetRadius, restoredRadius, 0.08);
      }
    }

    // ─── C. Smooth Zoom: lerp actual radius toward the target each frame ─────────
    // This prevents snapping whether caused by collision or user scroll/pinch
    camera.radius = Scalar.Lerp(camera.radius, camTargetRadius, 0.1);
  });

  // ─── Handle user-initiated scroll / pinch zoom ────────────────────────────────
  // When the user scrolls or pinches, Babylon updates camera.radius directly.
  // We intercept that to update camTargetRadius so our smooth lerp chases the
  // user's intended radius rather than fighting it.
  scene.onAfterRenderObservable.add(() => {
    // If the camera's radius moved more than our lerp would produce in one frame,
    // the user must have scrolled/pinched — adopt it as the new target.
    const lerpDelta = Math.abs(camera.radius - camTargetRadius);
    // Only adopt when camera.radius is within user limits (wall collision didn't override)
    if (lerpDelta > 0.001 && camera.radius >= camera.lowerRadiusLimit && camera.radius <= camera.upperRadiusLimit) {
      camTargetRadius = camera.radius;
    }
  });

  // FIX #2 (Event listener leak): Expose a cleanup function so main.js can call it
  // from scene.onDisposeObservable to remove all window listeners added here.
  function dispose() {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", onWindowBlur);
    museumAudio.setWalking(false);
  }

  return {
    capsule,
    characterRoot,
    camera,
    inputMap,
    resetPosition,
    swapModel,
    dispose,
    get currentGender() { return currentGender; },
    state,
    modelRoot: characterRoot,
    modelHolder: characterRoot
  };
}
