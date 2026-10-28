import {
  HighlightLayer,
  Color3,
  Texture,
  DynamicTexture,
  StandardMaterial
} from '@babylonjs/core';

/**
 * Updates or creates a brass placard dynamic texture engraved with the frame's title and artist.
 */
export function updatePlacardTexture(frameData, scene) {
  if (!frameData || !frameData.placardMesh) return;

  if (!frameData.placardDynamicTex) {
    const dt = new DynamicTexture(`placardTex_${frameData.id}`, { width: 512, height: 160 }, scene, false);
    const mat = new StandardMaterial(`placardMat_${frameData.id}`, scene);
    mat.diffuseTexture = dt;
    mat.specularColor = new Color3(0.25, 0.2, 0.08);
    mat.ambientColor = new Color3(0.85, 0.72, 0.35);
    mat.maxSimultaneousLights = 8;
    mat.zOffset = -2;
    frameData.placardMesh.material = mat;
    frameData.placardDynamicTex = dt;
  }

  const dt = frameData.placardDynamicTex;
  const ctx = dt.getContext();

  // Polished brass plate background
  ctx.fillStyle = "#9c7e38";
  ctx.fillRect(0, 0, 512, 160);

  // Subtle metallic horizontal sheen
  const grad = ctx.createLinearGradient(0, 0, 0, 160);
  grad.addColorStop(0, "rgba(255, 235, 170, 0.35)");
  grad.addColorStop(0.5, "rgba(100, 75, 20, 0.15)");
  grad.addColorStop(1, "rgba(40, 28, 5, 0.45)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 160);

  // Inset beveled border
  ctx.strokeStyle = "#4d3910";
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 148);

  ctx.strokeStyle = "rgba(255, 240, 190, 0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 492, 140);

  // Engraved title (dark bronze)
  ctx.fillStyle = "#1e1405";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 30px 'Cinzel', 'Times New Roman', Georgia, serif";

  const rawTitle = frameData.title || "Untitled Artwork";
  const maxTitleChars = 26;
  const displayTitle = rawTitle.length > maxTitleChars ? rawTitle.slice(0, maxTitleChars - 1) + '…' : rawTitle;
  ctx.fillText(displayTitle, 256, 70);

  // Artist line
  ctx.font = "italic 20px 'Times New Roman', Georgia, serif";
  ctx.fillStyle = "#38270b";
  const rawArtist = frameData.artist || "Unknown Artist";
  const displayArtist = rawArtist.length > 32 ? rawArtist.slice(0, 31) + '…' : rawArtist;
  ctx.fillText(displayArtist, 256, 112);

  dt.update();
}

/**
 * Scales the picture canvas plane and outer molding frame cleanly across all wall orientations.
 */
export function applyFrameScale(frameData, scaleW, scaleH) {
  if (!frameData || !frameData.canvasMesh || !frameData.frameMesh) return;

  frameData.scaleW = scaleW;
  frameData.scaleH = scaleH;

  // Scale plane
  frameData.canvasMesh.scaling.x = scaleW;
  frameData.canvasMesh.scaling.y = scaleH;

  // Scale outer molding frame based on wall orientation
  const wall = (frameData.config && frameData.config.position && frameData.config.position.wall)
    ? frameData.config.position.wall.toLowerCase().trim()
    : 'west';

  if (wall === 'west' || wall === 'east') {
    frameData.frameMesh.scaling.z = scaleW;
    frameData.frameMesh.scaling.y = scaleH;
  } else {
    frameData.frameMesh.scaling.x = scaleW;
    frameData.frameMesh.scaling.y = scaleH;
  }

  // Adjust placard Y position so it stays right under the frame
  const canvasH = (frameData.config && frameData.config.height) || 2.1;
  const borderW = 0.24;
  const posY = (frameData.config && frameData.config.position && frameData.config.position.y !== undefined)
    ? parseFloat(frameData.config.position.y)
    : 2.5;

  if (frameData.placardMesh) {
    frameData.placardMesh.position.y = posY - (canvasH * scaleH) / 2 - borderW - 0.22;
  }
}

/**
 * Rotates the photo plane mesh around its Z axis in real time.
 */
export function applyFrameRotation(frameData, deg) {
  if (!frameData || !frameData.canvasMesh) return;
  frameData.rotation = deg;
  frameData.canvasMesh.rotation.z = (deg * Math.PI) / 180;
}

/**
 * Loads a new image texture onto the canvas plane with a 0.3s fade transition.
 */
export function applyNewPhotoTexture(frameData, scene, imageUrl, onDone, onError) {
  if (!frameData || !frameData.canvasMesh || !frameData.artMat) return;

  const newTex = new Texture(
    imageUrl,
    scene,
    false,
    true,
    Texture.BILINEAR_SAMPLINGMODE,
    () => {
      // Successful load
      if (frameData.artTexture) {
        frameData.artTexture.dispose();
      }
      frameData.artTexture = newTex;
      frameData.artMat.diffuseTexture = newTex;
      frameData.image = imageUrl;

      // Smooth fade transition (opacity 0 -> 1 over 0.3s)
      frameData.artMat.alpha = 0;
      const startTime = performance.now();
      const duration = 300;

      const fade = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        frameData.artMat.alpha = progress;
        if (progress < 1) {
          requestAnimationFrame(fade);
        } else {
          frameData.artMat.alpha = 1.0;
        }
      };
      requestAnimationFrame(fade);

      if (onDone) onDone();
    },
    (msg, ex) => {
      console.warn(`[EditMuseum] Failed to load image "${imageUrl}":`, msg, ex);
      if (onError) onError();
    }
  );
}

/**
 * Loads and restores saved edits from localStorage on page initialization.
 */
export function applySavedEdits(frames, allExhibits, scene) {
  try {
    const raw = localStorage.getItem("museum_edits");
    if (!raw) return;
    const allEdits = JSON.parse(raw);

    frames.forEach((f) => {
      // First ensure placard texture is initialized
      updatePlacardTexture(f, scene);

      const edit = allEdits[f.id];
      if (!edit) return;

      // 1. Photo Texture
      if (edit.image) {
        if (typeof edit.image === 'string' && edit.image.startsWith('blob:')) {
          console.warn(`[EditMuseum] Blob URL for frame "${f.id}" is expired after reload. Showing default.`);
        } else {
          f.image = edit.image;
          const newTex = new Texture(
            edit.image,
            scene,
            false,
            true,
            Texture.BILINEAR_SAMPLINGMODE,
            () => {
              if (f.artTexture) f.artTexture.dispose();
              f.artTexture = newTex;
              f.artMat.diffuseTexture = newTex;
            },
            (msg) => console.warn(`[EditMuseum] Could not load saved texture for "${f.id}":`, msg)
          );
        }
      }

      // 2. Rotation
      if (edit.rotation !== undefined) {
        applyFrameRotation(f, parseFloat(edit.rotation));
      }

      // 3. Size
      if (edit.scaleW !== undefined && edit.scaleH !== undefined) {
        applyFrameScale(f, parseFloat(edit.scaleW), parseFloat(edit.scaleH));
      }

      // 4. Title
      if (edit.title) {
        f.title = edit.title;
        const exhibit = allExhibits.find((e) => e.id === f.id);
        if (exhibit) exhibit.title = edit.title;
        updatePlacardTexture(f, scene);
      }
    });
  } catch (err) {
    console.warn('[EditMuseum] Error applying saved edits:', err);
  }
}

/**
 * Initializes the entire Edit Museum system, DOM controls, side panel, and listeners.
 */
export function initEditMode({
  scene,
  canvas,
  character,
  frames,
  allExhibits,
  isMobile
}) {
  let isEditMode = false;
  let selectedFrame = null;
  let highlightLayer = null;

  // DOM Elements
  const btnEditMuseum   = document.getElementById('btn-edit-museum');
  const editOverlay     = document.getElementById('edit-mode-overlay');
  const editBanner      = document.getElementById('edit-mode-banner');
  const editTooltip     = document.getElementById('frame-edit-tooltip');
  const editPanel       = document.getElementById('edit-frame-panel');
  const btnClosePanel   = document.getElementById('btn-close-edit-panel');
  const editToast       = document.getElementById('edit-toast');

  // Side Panel Controls
  const panelBadge      = document.getElementById('edit-panel-badge');
  const editPhotoThumb  = document.getElementById('edit-photo-thumb');
  const fileInput       = document.getElementById('edit-file-input');
  const btnUploadPhoto  = document.getElementById('btn-upload-photo');
  const btnUseUrl       = document.getElementById('btn-use-url');
  const editUrlRow      = document.getElementById('edit-url-row');
  const editUrlInput    = document.getElementById('edit-url-input');
  const btnApplyUrl     = document.getElementById('btn-apply-url');
  const editUrlError    = document.getElementById('edit-url-error');

  const rotateSlider    = document.getElementById('edit-rotate-slider');
  const rotateVal       = document.getElementById('edit-rotate-val');
  const btnRotLeft      = document.getElementById('btn-rot-left');
  const btnRotRight     = document.getElementById('btn-rot-right');
  const btnRot180       = document.getElementById('btn-rot-180');
  const btnRotReset     = document.getElementById('btn-rot-reset');

  const widthSlider     = document.getElementById('edit-width-slider');
  const widthVal        = document.getElementById('edit-width-val');
  const heightSlider    = document.getElementById('edit-height-slider');
  const heightVal       = document.getElementById('edit-height-val');
  const lockAspectCheck = document.getElementById('edit-lock-aspect');
  const btnResizeReset  = document.getElementById('btn-resize-reset');

  const titleInput      = document.getElementById('edit-title-input');
  const btnSaveFrame    = document.getElementById('btn-save-frame-edit');

  // Ensure all initial frames have placards rendered
  frames.forEach((f) => updatePlacardTexture(f, scene));

  // Load saved edits from localStorage
  applySavedEdits(frames, allExhibits, scene);

  // Toast Helper
  let toastTimer = null;
  function showToast(msg) {
    if (!editToast) return;
    editToast.textContent = msg;
    editToast.classList.add('visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      editToast.classList.remove('visible');
    }, 2000);
  }

  // Highlight Layer Management
  function getHighlightLayer() {
    if (!highlightLayer) {
      highlightLayer = new HighlightLayer("museumEditHL", scene, {
        camera: character.camera
      });
      highlightLayer.innerGlow = false;
      highlightLayer.outerGlow = true;
      highlightLayer.blurHorizontalSize = 0.8;
      highlightLayer.blurVerticalSize = 0.8;
    }
    return highlightLayer;
  }

  function applyHighlights() {
    const hl = getHighlightLayer();
    hl.removeAllMeshes();

    const yellowColor = new Color3(1.0, 0.85, 0.2);
    const whiteColor = new Color3(1.0, 1.0, 1.0);

    frames.forEach((f) => {
      const isSelected = selectedFrame && selectedFrame.id === f.id;
      const color = isSelected ? whiteColor : yellowColor;
      if (f.frameMesh) hl.addMesh(f.frameMesh, color);
      if (f.canvasMesh) hl.addMesh(f.canvasMesh, color);
    });
  }

  function clearHighlights() {
    if (highlightLayer) {
      highlightLayer.removeAllMeshes();
    }
  }

  // Open Side Panel for a Frame
  function openPanelForFrame(frameData) {
    selectedFrame = frameData;
    applyHighlights();

    if (!editPanel) return;

    if (panelBadge) {
      panelBadge.textContent = `${frameData.roomName} • ${frameData.wallName}`;
    }

    if (editPhotoThumb) {
      editPhotoThumb.src = frameData.image || "";
    }

    if (editUrlRow) editUrlRow.classList.add('hidden');
    if (editUrlError) editUrlError.classList.add('hidden');
    if (editUrlInput) editUrlInput.value = "";

    // Rotation
    const curRot = frameData.rotation || 0;
    if (rotateSlider) rotateSlider.value = curRot;
    if (rotateVal) rotateVal.textContent = `${Math.round(curRot)}°`;

    // Size
    const curW = frameData.scaleW !== undefined ? frameData.scaleW : 1.0;
    const curH = frameData.scaleH !== undefined ? frameData.scaleH : 1.0;
    if (widthSlider) widthSlider.value = curW;
    if (widthVal) widthVal.textContent = `${curW.toFixed(1)}x`;
    if (heightSlider) heightSlider.value = curH;
    if (heightVal) heightVal.textContent = `${curH.toFixed(1)}x`;

    // Title
    if (titleInput) {
      titleInput.value = frameData.title || "";
    }

    // Slide in panel
    editPanel.classList.add('active');
    editPanel.setAttribute('aria-hidden', 'false');
  }

  function closePanel() {
    if (editPanel) {
      editPanel.classList.remove('active');
      editPanel.setAttribute('aria-hidden', 'true');
    }
    selectedFrame = null;
    if (isEditMode) {
      applyHighlights();
    }
  }

  // Enter Edit Mode
  function enterEditMode() {
    if (isEditMode) return;
    isEditMode = true;

    // Cursor is always visible
    canvas.style.cursor = 'default';

    // Pause character movement input
    character.state.isControlLocked = true;

    // Show dim overlay and top banner
    if (editOverlay) editOverlay.classList.remove('hidden');
    if (editBanner) editBanner.classList.remove('hidden');

    // Update bottom-right button to "✅ Done Editing"
    if (btnEditMuseum) {
      btnEditMuseum.classList.add('done-mode');
      btnEditMuseum.innerHTML = `
        <span class="btn-edit-icon">✅</span>
        <span class="btn-edit-text">Done Editing</span>
      `;
      btnEditMuseum.title = "Done Editing (E)";
    }

    // Highlight all photo frames with yellow outline
    applyHighlights();
  }

  // Exit Edit Mode
  function exitEditMode() {
    if (!isEditMode) return;
    isEditMode = false;

    // Remove all highlights
    clearHighlights();

    // Close side panel
    closePanel();

    // Hide dim overlay, banner, tooltip
    if (editOverlay) editOverlay.classList.add('hidden');
    if (editBanner) editBanner.classList.add('hidden');
    if (editTooltip) editTooltip.classList.add('hidden');

    // Restore bottom-right button
    if (btnEditMuseum) {
      btnEditMuseum.classList.remove('done-mode');
      btnEditMuseum.innerHTML = `
        <span class="btn-edit-icon">✏️</span>
        <span class="btn-edit-text">Edit Museum</span>
      `;
      btnEditMuseum.title = "Edit Museum (E)";
    }

    // Resume character movement
    character.state.isControlLocked = false;

    showToast("Changes saved!");
  }

  // Toggle Edit Mode
  function toggleEditMode() {
    if (isEditMode) {
      exitEditMode();
    } else {
      enterEditMode();
    }
  }

  // Edit Button Click
  if (btnEditMuseum) {
    btnEditMuseum.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleEditMode();
    });
  }

  if (btnClosePanel) {
    btnClosePanel.addEventListener('click', closePanel);
  }

  // --- Photo Section ---
  if (btnUploadPhoto && fileInput) {
    btnUploadPhoto.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', () => {
      if (!selectedFrame) return;
      const file = fileInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64DataUrl = e.target.result;
        applyNewPhotoTexture(
          selectedFrame,
          scene,
          base64DataUrl,
          () => {
            if (editPhotoThumb) editPhotoThumb.src = base64DataUrl;
            if (editUrlError) editUrlError.classList.add('hidden');
          },
          () => {
            if (editUrlError) {
              editUrlError.textContent = "⚠️ Could not load image file.";
              editUrlError.classList.remove('hidden');
            }
          }
        );
      };
      reader.readAsDataURL(file);
      fileInput.value = ""; // Reset for re-selection
    });
  }

  if (btnUseUrl && editUrlRow) {
    btnUseUrl.addEventListener('click', () => {
      editUrlRow.classList.toggle('hidden');
      if (!editUrlRow.classList.contains('hidden') && editUrlInput) {
        editUrlInput.focus();
      }
    });
  }

  function handleApplyUrl() {
    if (!selectedFrame || !editUrlInput) return;
    const url = editUrlInput.value.trim();
    if (!url) return;

    if (editUrlError) editUrlError.classList.add('hidden');

    applyNewPhotoTexture(
      selectedFrame,
      scene,
      url,
      () => {
        if (editPhotoThumb) editPhotoThumb.src = url;
        if (editUrlError) editUrlError.classList.add('hidden');
        if (editUrlRow) editUrlRow.classList.add('hidden');
      },
      () => {
        if (editUrlError) {
          editUrlError.textContent = "⚠️ Could not load image. Check the URL.";
          editUrlError.classList.remove('hidden');
        }
      }
    );
  }

  if (btnApplyUrl) btnApplyUrl.addEventListener('click', handleApplyUrl);
  if (editUrlInput) {
    editUrlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleApplyUrl();
    });
  }

  // --- Rotate Section ---
  function updateRotation(newDeg) {
    if (!selectedFrame) return;
    const deg = (newDeg % 360 + 360) % 360;
    applyFrameRotation(selectedFrame, deg);
    if (rotateSlider) rotateSlider.value = deg;
    if (rotateVal) rotateVal.textContent = `${Math.round(deg)}°`;
  }

  if (rotateSlider) {
    rotateSlider.addEventListener('input', (e) => {
      updateRotation(parseFloat(e.target.value));
    });
  }

  if (btnRotLeft) {
    btnRotLeft.addEventListener('click', () => {
      const cur = selectedFrame ? (selectedFrame.rotation || 0) : 0;
      updateRotation(cur - 90);
    });
  }

  if (btnRotRight) {
    btnRotRight.addEventListener('click', () => {
      const cur = selectedFrame ? (selectedFrame.rotation || 0) : 0;
      updateRotation(cur + 90);
    });
  }

  if (btnRot180) {
    btnRot180.addEventListener('click', () => {
      const cur = selectedFrame ? (selectedFrame.rotation || 0) : 0;
      updateRotation(cur + 180);
    });
  }

  if (btnRotReset) {
    btnRotReset.addEventListener('click', () => {
      updateRotation(0);
    });
  }

  // --- Resize Section ---
  function updateWidth(newW) {
    if (!selectedFrame) return;
    const clampedW = Math.max(0.5, Math.min(4.0, parseFloat(newW)));
    let clampedH = selectedFrame.scaleH !== undefined ? selectedFrame.scaleH : 1.0;

    if (lockAspectCheck && lockAspectCheck.checked) {
      const oldW = selectedFrame.scaleW !== undefined ? selectedFrame.scaleW : 1.0;
      const ratio = oldW > 0 ? clampedH / oldW : 1.0;
      clampedH = Math.max(0.5, Math.min(3.0, parseFloat((clampedW * ratio).toFixed(1))));
    }

    applyFrameScale(selectedFrame, clampedW, clampedH);

    if (widthSlider) widthSlider.value = clampedW;
    if (widthVal) widthVal.textContent = `${clampedW.toFixed(1)}x`;
    if (heightSlider) heightSlider.value = clampedH;
    if (heightVal) heightVal.textContent = `${clampedH.toFixed(1)}x`;
  }

  function updateHeight(newH) {
    if (!selectedFrame) return;
    const clampedH = Math.max(0.5, Math.min(3.0, parseFloat(newH)));
    let clampedW = selectedFrame.scaleW !== undefined ? selectedFrame.scaleW : 1.0;

    if (lockAspectCheck && lockAspectCheck.checked) {
      const oldH = selectedFrame.scaleH !== undefined ? selectedFrame.scaleH : 1.0;
      const ratio = oldH > 0 ? clampedW / oldH : 1.0;
      clampedW = Math.max(0.5, Math.min(4.0, parseFloat((clampedH * ratio).toFixed(1))));
    }

    applyFrameScale(selectedFrame, clampedW, clampedH);

    if (widthSlider) widthSlider.value = clampedW;
    if (widthVal) widthVal.textContent = `${clampedW.toFixed(1)}x`;
    if (heightSlider) heightSlider.value = clampedH;
    if (heightVal) heightVal.textContent = `${clampedH.toFixed(1)}x`;
  }

  if (widthSlider) {
    widthSlider.addEventListener('input', (e) => {
      updateWidth(e.target.value);
    });
  }

  if (heightSlider) {
    heightSlider.addEventListener('input', (e) => {
      updateHeight(e.target.value);
    });
  }

  if (btnResizeReset) {
    btnResizeReset.addEventListener('click', () => {
      if (!selectedFrame) return;
      applyFrameScale(selectedFrame, 1.0, 1.0);
      if (widthSlider) widthSlider.value = 1.0;
      if (widthVal) widthVal.textContent = "1.0x";
      if (heightSlider) heightSlider.value = 1.0;
      if (heightVal) heightVal.textContent = "1.0x";
    });
  }

  // --- Title Section ---
  if (titleInput) {
    titleInput.addEventListener('input', () => {
      if (!selectedFrame) return;
      const newTitle = titleInput.value;
      selectedFrame.title = newTitle;

      // Update in allExhibits
      const exhibit = allExhibits.find((e) => e.id === selectedFrame.id);
      if (exhibit) exhibit.title = newTitle;

      // Update 3D brass placard
      updatePlacardTexture(selectedFrame, scene);
    });
  }

  // --- Save Button ---
  if (btnSaveFrame) {
    btnSaveFrame.addEventListener('click', () => {
      if (!selectedFrame) return;

      try {
        const raw = localStorage.getItem("museum_edits");
        const allEdits = raw ? JSON.parse(raw) : {};

        allEdits[selectedFrame.id] = {
          image: selectedFrame.image,
          rotation: selectedFrame.rotation || 0,
          scaleW: selectedFrame.scaleW !== undefined ? selectedFrame.scaleW : 1.0,
          scaleH: selectedFrame.scaleH !== undefined ? selectedFrame.scaleH : 1.0,
          title: selectedFrame.title || ""
        };

        localStorage.setItem("museum_edits", JSON.stringify(allEdits));
        showToast("✅ Saved!");
      } catch (err) {
        console.warn('[EditMuseum] Error saving to localStorage:', err);
        showToast("⚠️ Failed to save to local storage.");
      }
    });
  }

  // --- Picking & Tooltip in Edit Mode ---
  function getFrameFromMesh(mesh) {
    if (!mesh) return null;
    if (mesh.metadata && mesh.metadata.config && mesh.metadata.canvasMesh) {
      return mesh.metadata;
    }
    // Search by name match
    const match = frames.find((f) => f.frameMesh === mesh || f.canvasMesh === mesh || f.placardMesh === mesh);
    return match || null;
  }

  function handleCanvasClick(pickResult) {
    if (!isEditMode) return false;

    if (pickResult.hit && pickResult.pickedMesh) {
      const frameData = getFrameFromMesh(pickResult.pickedMesh);
      if (frameData) {
        openPanelForFrame(frameData);
        return true;
      }
    }
    return false;
  }

  function handlePointerHover(evt) {
    if (!isEditMode || !editTooltip) return;

    const pick = scene.pick(scene.pointerX, scene.pointerY);
    if (pick.hit && pick.pickedMesh) {
      const frameData = getFrameFromMesh(pick.pickedMesh);
      if (frameData) {
        editTooltip.style.left = `${evt.clientX}px`;
        editTooltip.style.top = `${evt.clientY}px`;
        editTooltip.classList.remove('hidden');
        canvas.style.cursor = 'pointer';
        return;
      }
    }

    editTooltip.classList.add('hidden');
    canvas.style.cursor = 'default';
  }

  window.addEventListener('pointermove', (evt) => {
    if (isEditMode) {
      handlePointerHover(evt);
    }
  });

  return {
    isActive: () => isEditMode,
    isPanelOpen: () => Boolean(editPanel && editPanel.classList.contains('active')),
    closePanel,
    enter: enterEditMode,
    exit: exitEditMode,
    toggle: toggleEditMode,
    handleCanvasClick,
    dispose: () => {
      clearHighlights();
      if (highlightLayer) highlightLayer.dispose();
    }
  };
}
