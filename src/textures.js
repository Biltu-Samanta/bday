import { DynamicTexture, StandardMaterial, Color3, Texture } from '@babylonjs/core';

/**
 * Creates textured wallpaper material from image file (e.g. /textures/walls/room-1.jpg)
 */
export function createRoomWallMaterial(scene, imagePath, options = {}) {
  const mat = new StandardMaterial("wallTexMat_" + imagePath, scene);
  const tex = new Texture(imagePath, scene, true, false);
  tex.wrapU = Texture.WRAP_ADDRESSMODE;
  tex.wrapV = Texture.WRAP_ADDRESSMODE;
  tex.anisotropicFilteringLevel = 16;

  mat.diffuseTexture = tex;
  mat.ambientColor = options.ambientColor || new Color3(0.65, 0.65, 0.68);
  mat.specularColor = options.specularColor || new Color3(0.04, 0.04, 0.04);
  mat.specularPower = 20;
  mat.maxSimultaneousLights = 8;

  mat.customTileWidth = options.tileWidth || 2.2;
  mat.customTileHeight = options.tileHeight || 3.2;
  return mat;
}

/**
 * Creates luxury parquet/wood block tile floor material from image file (/textures/floor/download (1).jpg)
 * The texture has a 5x9 block grid, scaled proportionally to maintain square 0.4m wood blocks.
 */
export function createWoodTileFloorMaterial(scene, uScale = 9.0, vScale = 6.11) {
  const mat = new StandardMaterial(`woodTileFloorMat_${uScale}_${vScale}`, scene);
  const tex = new Texture(encodeURI("/textures/floor/download (1).jpg"), scene, true, false);
  tex.wrapU = Texture.WRAP_ADDRESSMODE;
  tex.wrapV = Texture.WRAP_ADDRESSMODE;
  tex.uScale = uScale;
  tex.vScale = vScale;
  tex.anisotropicFilteringLevel = 16;

  mat.diffuseTexture = tex;
  mat.ambientColor = new Color3(0.72, 0.72, 0.72);
  mat.specularColor = new Color3(0.08, 0.08, 0.08); // Satin luster
  mat.specularPower = 20;
  mat.maxSimultaneousLights = 8;
  return mat;
}

export function createGraniteTileFloorMaterial(scene, uScale = 9.0, vScale = 6.11) {
  return createWoodTileFloorMaterial(scene, uScale, vScale);
}



/**
 * Creates a high quality procedural wood parquet texture for Room 1
 */
export function createWoodTexture(scene) {
  const dt = new DynamicTexture("woodDT", 1024, scene, true);
  const ctx = dt.getContext();
  
  // Base wood tone
  ctx.fillStyle = "#8a5832";
  ctx.fillRect(0, 0, 1024, 1024);

  // Draw parquet tiles
  const tileSize = 128;
  for (let x = 0; x < 1024; x += tileSize) {
    for (let y = 0; y < 1024; y += tileSize) {
      const isAlt = ((x / tileSize) + (y / tileSize)) % 2 === 0;
      ctx.fillStyle = isAlt ? "#9d683e" : "#83522c";
      ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

      // Plank grains
      ctx.strokeStyle = "rgba(60, 30, 10, 0.15)";
      ctx.lineWidth = 1;
      const numPlanks = 4;
      const plankW = tileSize / numPlanks;
      for (let p = 0; p < numPlanks; p++) {
        if (isAlt) {
          ctx.beginPath();
          ctx.moveTo(x + p * plankW, y);
          ctx.lineTo(x + p * plankW, y + tileSize);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(x, y + p * plankW);
          ctx.lineTo(x + tileSize, y + p * plankW);
          ctx.stroke();
        }
      }
    }
  }

  // Border seams
  ctx.strokeStyle = "rgba(40, 20, 5, 0.35)";
  ctx.lineWidth = 3;
  for (let x = 0; x <= 1024; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y <= 1024; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  dt.update();
  dt.uScale = 4;
  dt.vScale = 4;

  const mat = new StandardMaterial("woodFloorMat", scene);
  mat.diffuseTexture = dt;
  mat.specularColor = new Color3(0.02, 0.02, 0.02);
  mat.specularPower = 16;
  mat.maxSimultaneousLights = 8;
  return mat;
}

/**
 * Creates an Italian Carrara marble texture for Room 2
 */
export function createMarbleTexture(scene) {
  const dt = new DynamicTexture("marbleDT", 1024, scene, true);
  const ctx = dt.getContext();

  // Polished ivory marble base
  const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
  grad.addColorStop(0, "#f8f7f4");
  grad.addColorStop(0.5, "#ece9e2");
  grad.addColorStop(1, "#f3f0e8");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Procedural veining
  function drawVein(x1, y1, x2, y2, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    let cx = x1;
    let cy = y1;
    const steps = 18;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const targetX = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 45;
      const targetY = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 45;
      ctx.quadraticCurveTo(cx, cy, targetX, targetY);
      cx = targetX;
      cy = targetY;
    }
    ctx.stroke();
  }

  for (let i = 0; i < 15; i++) {
    const x1 = Math.random() * 1024;
    const y1 = Math.random() * 1024;
    const x2 = x1 + (Math.random() - 0.5) * 600;
    const y2 = y1 + (Math.random() - 0.5) * 600;
    drawVein(x1, y1, x2, y2, "rgba(180, 175, 170, 0.25)", 4);
    drawVein(x1 + 10, y1 + 10, x2 + 10, y2 + 10, "rgba(120, 115, 110, 0.15)", 2);
    if (Math.random() > 0.6) {
      drawVein(x1, y1, x2, y2, "rgba(195, 160, 110, 0.18)", 1.5);
    }
  }

  // Fine tile seams
  const tileSize = 256;
  ctx.strokeStyle = "rgba(140, 135, 130, 0.4)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= 1024; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y <= 1024; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  dt.update();
  dt.uScale = 4;
  dt.vScale = 4;

  const mat = new StandardMaterial("marbleFloorMat", scene);
  mat.diffuseTexture = dt;
  mat.specularColor = new Color3(0.04, 0.04, 0.04);
  mat.specularPower = 16;
  mat.maxSimultaneousLights = 8;
  return mat;
}

/**
 * Creates a modern polished obsidian terrazzo texture for Room 3
 */
export function createDarkTileTexture(scene) {
  const dt = new DynamicTexture("darkTileDT", 1024, scene, true);
  const ctx = dt.getContext();

  ctx.fillStyle = "#16171b";
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle terrazzo chips
  for (let i = 0; i < 600; i++) {
    const rx = Math.random() * 1024;
    const ry = Math.random() * 1024;
    const size = 1 + Math.random() * 3;
    const tone = Math.random() > 0.8 ? "rgba(180, 210, 240, 0.3)" : "rgba(80, 85, 95, 0.25)";
    ctx.fillStyle = tone;
    ctx.fillRect(rx, ry, size, size);
  }

  // High-tech tile grid
  const tileSize = 256;
  ctx.strokeStyle = "rgba(50, 60, 80, 0.6)";
  ctx.lineWidth = 3;
  for (let x = 0; x <= 1024; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y <= 1024; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  dt.update();
  dt.uScale = 3;
  dt.vScale = 3;

  const mat = new StandardMaterial("darkTileMat", scene);
  mat.diffuseTexture = dt;
  mat.specularColor = new Color3(0.03, 0.03, 0.03);
  mat.specularPower = 16;
  mat.maxSimultaneousLights = 8;
  return mat;
}

/**
 * Creates museum plaster wall material
 */
export function createWallMaterial(scene, colorHex = "#f0ede6", dark = false) {
  const dt = new DynamicTexture("wallDT_" + colorHex, 512, scene, true);
  const ctx = dt.getContext();

  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle plaster texture stippling
  ctx.fillStyle = dark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.025)";
  for (let i = 0; i < 4000; i++) {
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }

  dt.update();
  dt.uScale = 2;
  dt.vScale = 2;

  const mat = new StandardMaterial("wallMat_" + colorHex, scene);
  mat.diffuseTexture = dt;
  mat.ambientColor = dark ? new Color3(0.45, 0.48, 0.55) : new Color3(0.6, 0.6, 0.6);
  mat.specularColor = new Color3(0.01, 0.01, 0.01);
  mat.specularPower = 16;
  mat.maxSimultaneousLights = 8;
  return mat;
}

/**
 * Creates ceiling material with subtle coffered paneling
 */
export function createCeilingMaterial(scene) {
  const dt = new DynamicTexture("ceilingDT", 512, scene, true);
  const ctx = dt.getContext();

  ctx.fillStyle = "#e8e5dc";
  ctx.fillRect(0, 0, 512, 512);

  // Subtle grid panels
  ctx.strokeStyle = "rgba(140, 135, 125, 0.35)";
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 492, 492);
  ctx.strokeRect(40, 40, 432, 432);

  dt.update();
  dt.uScale = 3;
  dt.vScale = 3;

  const mat = new StandardMaterial("ceilingMat", scene);
  mat.diffuseTexture = dt;
  mat.specularColor = new Color3(0, 0, 0); // No shine on ceiling
  mat.specularPower = 8;
  mat.maxSimultaneousLights = 8;
  return mat;
}

/**
 * Creates artistic paintings on dynamic textures
 */
export function createArtworkMaterial(scene, type = "landscape") {
  const dt = new DynamicTexture("artDT_" + type, 512, 512, scene, true);
  const ctx = dt.getContext();

  if (type === "landscape") {
    // Classical Golden Sunset Impressionism
    const sky = ctx.createLinearGradient(0, 0, 0, 340);
    sky.addColorStop(0, "#2c3e50");
    sky.addColorStop(0.4, "#e67e22");
    sky.addColorStop(0.7, "#f39c12");
    sky.addColorStop(1, "#f1c40f");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 512, 512);

    // Glowing sun
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(256, 260, 42, 0, Math.PI * 2);
    ctx.fill();

    // Soft mountains / hills
    ctx.fillStyle = "#1e2b37";
    ctx.beginPath();
    ctx.moveTo(0, 360);
    ctx.lineTo(140, 290);
    ctx.lineTo(260, 340);
    ctx.lineTo(390, 280);
    ctx.lineTo(512, 330);
    ctx.lineTo(512, 512);
    ctx.lineTo(0, 512);
    ctx.closePath();
    ctx.fill();

    // Water reflection
    ctx.fillStyle = "rgba(243, 156, 18, 0.4)";
    for (let y = 370; y < 512; y += 8) {
      ctx.fillRect(180 + Math.sin(y) * 20, y, 150 + Math.sin(y * 2) * 40, 4);
    }
  } else if (type === "geometric") {
    // Bauhaus / De Stijl geometric composition
    ctx.fillStyle = "#f5f0ea";
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = "#b83b32";
    ctx.fillRect(40, 40, 200, 220);

    ctx.fillStyle = "#1d3557";
    ctx.fillRect(270, 40, 200, 140);

    ctx.fillStyle = "#e9c46a";
    ctx.fillRect(270, 200, 200, 270);

    ctx.fillStyle = "#264653";
    ctx.fillRect(40, 280, 200, 190);

    // Grid lines
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 10;
    ctx.strokeRect(40, 40, 430, 430);
    ctx.beginPath();
    ctx.moveTo(255, 40);
    ctx.lineTo(255, 470);
    ctx.moveTo(40, 260);
    ctx.lineTo(255, 260);
    ctx.moveTo(255, 190);
    ctx.lineTo(470, 190);
    ctx.stroke();
  } else if (type === "nebula") {
    // Deep cosmic nebulas
    ctx.fillStyle = "#090a10";
    ctx.fillRect(0, 0, 512, 512);

    const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 260);
    grad.addColorStop(0, "rgba(168, 85, 247, 0.9)");
    grad.addColorStop(0.4, "rgba(59, 130, 246, 0.6)");
    grad.addColorStop(0.8, "rgba(14, 165, 233, 0.2)");
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Stars
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 180; i++) {
      const sx = Math.random() * 512;
      const sy = Math.random() * 512;
      const r = Math.random() * 2;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === "modern") {
    // Minimalist Color Field & Gold Leaf
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(0.5, "#1e1b4b");
    grad.addColorStop(1, "#312e81");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Gold leaf arcs
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(256, 256, 140, 0.2 * Math.PI, 1.3 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = "rgba(251, 191, 36, 0.25)";
    ctx.beginPath();
    ctx.arc(256, 256, 100, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(256, 256, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  dt.update();

  const mat = new StandardMaterial("artMat_" + type, scene);
  mat.diffuseTexture = dt;
  mat.specularColor = new Color3(0.2, 0.2, 0.2);
  mat.specularPower = 32;
  return mat;
}
