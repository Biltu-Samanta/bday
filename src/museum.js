import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  Vector4,
  PointLight,
  SpotLight,
  HemisphericLight,
  ShadowGenerator,
  DirectionalLight
} from '@babylonjs/core';

import {
  createWoodTexture,
  createMarbleTexture,
  createWallMaterial,
  createCeilingMaterial,
  createRoomWallMaterial,
  createWoodTileFloorMaterial
} from './textures.js';

export function createMuseum(scene) {
  // 1. Materials
  // Room 1, 2, 3 floor textures
  const floorMatRoom1 = createWoodTileFloorMaterial(scene, 9.0, 6.11);
  const floorMatRoom2 = createWoodTileFloorMaterial(scene, 11.0, 5.56);
  const floorMatRoom3 = createWoodTileFloorMaterial(scene, 9.0, 6.11);
  const ceilingMat = createCeilingMaterial(scene);

  // Textured wall materials loaded according to photo names in public/textures/walls/
  // Room 1: Teal Damask Wallpaper (room-1.jpg)
  const wallMatRoom1 = createRoomWallMaterial(scene, "/textures/walls/room-1.jpg", {
    tileWidth: 2.0,
    tileHeight: 2.5,
    ambientColor: new Color3(0.72, 0.72, 0.74)
  });
  // Room 2: Regal Burgundy/Lotus Wallpaper (room-2.jpg)
  const wallMatRoom2 = createRoomWallMaterial(scene, "/textures/walls/room-2.jpg", {
    tileWidth: 2.0,
    tileHeight: 2.5,
    ambientColor: new Color3(0.68, 0.68, 0.70)
  });
  // Room 3: Emerald & Gold Baroque Wallpaper (room-3.jpg)
  const wallMatRoom3 = createRoomWallMaterial(scene, "/textures/walls/room-3.jpg", {
    tileWidth: 2.0,
    tileHeight: 2.5,
    ambientColor: new Color3(0.65, 0.68, 0.65)
  });

  // Frame and trim materials
  const goldMat = new StandardMaterial("goldMat", scene);
  goldMat.diffuseColor = new Color3(0.85, 0.65, 0.2);
  goldMat.specularColor = new Color3(0.25, 0.2, 0.08);
  goldMat.specularPower = 32;
  goldMat.zOffset = -1;

  const darkWoodMat = new StandardMaterial("darkWoodMat", scene);
  darkWoodMat.diffuseColor = new Color3(0.18, 0.12, 0.08);
  darkWoodMat.specularColor = new Color3(0.05, 0.05, 0.05);

  const whiteMarbleMat = new StandardMaterial("whiteMarbleMat", scene);
  whiteMarbleMat.diffuseColor = new Color3(0.92, 0.9, 0.88);
  whiteMarbleMat.specularColor = new Color3(0.04, 0.04, 0.04);
  whiteMarbleMat.specularPower = 16;

  const neonCyanMat = new StandardMaterial("neonCyanMat", scene);
  neonCyanMat.emissiveColor = new Color3(0.0, 1.0, 1.0);
  neonCyanMat.diffuseColor = new Color3(0.1, 0.3, 0.5);
  neonCyanMat.zOffset = -2;

  const neonMagentaMat = new StandardMaterial("neonMagentaMat", scene);
  neonMagentaMat.emissiveColor = new Color3(1.0, 0.2, 0.85);
  neonMagentaMat.diffuseColor = new Color3(0.4, 0.1, 0.3);
  neonMagentaMat.zOffset = -2;

  // Group container for organization
  const museumRoot = MeshBuilder.CreateBox("museumRoot", { size: 0.1 }, scene);
  museumRoot.isVisible = false;

  // Helper to create walls with collisions and uniform texture tiling
  function createWall(name, width, height, depth, pos, mat, options = {}) {
    const tw = (mat && mat.customTileWidth) ? mat.customTileWidth : 2.0;
    const th = (mat && mat.customTileHeight) ? mat.customTileHeight : 2.5;

    const uX = Math.max(0.1, width / tw);
    const uZ = Math.max(0.1, depth / tw);
    const vY = Math.max(0.1, height / th);
    const vTop = Math.max(0.1, depth / th);

    const uStart0 = options.uStart0 !== undefined ? options.uStart0 : 0;
    const uStart1 = options.uStart1 !== undefined ? options.uStart1 : 0;
    const uStart2 = options.uStart2 !== undefined ? options.uStart2 : 0;
    const uStart3 = options.uStart3 !== undefined ? options.uStart3 : 0;

    const faceUV = new Array(6);
    faceUV[0] = new Vector4(uStart0, 0, uStart0 + uX, vY); // Front (+Z)
    faceUV[1] = new Vector4(uStart1, 0, uStart1 + uX, vY); // Back (-Z)
    faceUV[2] = new Vector4(uStart2, 0, uStart2 + uZ, vY); // Right (+X)
    faceUV[3] = new Vector4(uStart3, 0, uStart3 + uZ, vY); // Left (-X)
    faceUV[4] = new Vector4(0, 0, uX, vTop); // Top (+Y)
    faceUV[5] = new Vector4(0, 0, uX, vTop); // Bottom (-Y)

    const wall = MeshBuilder.CreateBox(name, { width, height, depth, faceUV, wrap: true }, scene);
    wall.position = pos;
    wall.material = mat;
    wall.checkCollisions = true;
    wall.receiveShadows = true;
    wall.parent = museumRoot;
    return wall;
  }

  // ==========================================
  // FLOORS & CEILINGS
  // ==========================================
  // Room 1 Floor: X[-9, 9], Z[-32, -10] (Depth 22) - Rustic End-Grain Wood Block Floor (download (1).jpg)
  const floor1 = MeshBuilder.CreateGround("floor1", { width: 18, height: 22 }, scene);
  floor1.position = new Vector3(0, 0, -21);
  floor1.material = floorMatRoom1;
  floor1.checkCollisions = true;
  floor1.receiveShadows = true;

  // Room 2 Floor: X[-11, 11], Z[-10, 10] (Depth 20) - Rustic End-Grain Wood Block Floor (download (1).jpg)
  const floor2 = MeshBuilder.CreateGround("floor2", { width: 22, height: 20 }, scene);
  floor2.position = new Vector3(0, 0, 0);
  floor2.material = floorMatRoom2;
  floor2.checkCollisions = true;
  floor2.receiveShadows = true;

  // Room 3 Floor: X[-9, 9], Z[10, 32] (Depth 22) - Rustic End-Grain Wood Block Floor (download (1).jpg)
  const floor3 = MeshBuilder.CreateGround("floor3", { width: 18, height: 22 }, scene);
  floor3.position = new Vector3(0, 0, 21);
  floor3.material = floorMatRoom3;
  floor3.checkCollisions = true;
  floor3.receiveShadows = true;

  // Ceilings (Height = 5.0)
  const ceiling1 = MeshBuilder.CreatePlane("ceiling1", { width: 18, height: 22 }, scene);
  ceiling1.position = new Vector3(0, 5.0, -21);
  ceiling1.rotation.x = -Math.PI / 2;
  ceiling1.material = ceilingMat;
  ceiling1.checkCollisions = true;

  const ceiling2 = MeshBuilder.CreatePlane("ceiling2", { width: 22, height: 20 }, scene);
  ceiling2.position = new Vector3(0, 5.0, 0);
  ceiling2.rotation.x = -Math.PI / 2;
  ceiling2.material = ceilingMat;
  ceiling2.checkCollisions = true;

  const ceiling3 = MeshBuilder.CreatePlane("ceiling3", { width: 18, height: 22 }, scene);
  ceiling3.position = new Vector3(0, 5.0, 21);
  ceiling3.rotation.x = -Math.PI / 2;
  ceiling3.material = ceilingMat;
  ceiling3.checkCollisions = true;

  // ==========================================
  // WALLS & DOORWAYS
  // ==========================================
  const wallH = 5.0;
  const wallT = 0.5; // thickness
  const doorW = 4.4;
  const doorH = 3.8;
  const lintelH = wallH - doorH; // 1.2

  // --- ROOM 1 OUTER WALLS (room-1.jpg Teal Damask Wallpaper) ---
  // Solid South Wall (Z = -32)
  createWall("r1_south", 18, wallH, wallT, new Vector3(0, wallH / 2, -32), wallMatRoom1);

  // West Wall (X = -9, Z: -32 to -10)
  createWall("r1_west", wallT, wallH, 22, new Vector3(-9, wallH / 2, -21), wallMatRoom1);
  // East Wall (X = +9, Z: -32 to -10)
  createWall("r1_east", wallT, wallH, 22, new Vector3(9, wallH / 2, -21), wallMatRoom1);

  // --- DOORWAY 1-2 (Z = -10) ---
  // Left wall segment (X: -9 to -2.7) - shortened so column sits flush without hidden overlap
  const d1LeftW = 6.3; // 9 - 2.7
  createWall("door1_left", d1LeftW, wallH, wallT, new Vector3(-5.85, wallH / 2, -10), wallMatRoom1);
  // Right wall segment (X: +2.7 to +9) - offset so pattern turns the North-East corner seamlessly
  createWall("door1_right", d1LeftW, wallH, wallT, new Vector3(5.85, wallH / 2, -10), wallMatRoom1, { uStart1: -0.15 });
  // Lintel over Doorway 1
  createWall("door1_lintel", doorW, lintelH, wallT, new Vector3(0, doorH + lintelH / 2, -10), wallMatRoom1);

  // Decorative Arch Columns for Doorway 1 (flanks doorway from X = -2.7 to -2.2, depth 0.68 prevents coplanar z-fighting)
  const archColL1 = MeshBuilder.CreateBox("archColL1", { width: 0.5, height: doorH, depth: 0.68 }, scene);
  archColL1.position = new Vector3(-2.45, doorH / 2, -10);
  archColL1.material = darkWoodMat;
  archColL1.checkCollisions = true;
  archColL1.receiveShadows = false;

  const archColR1 = MeshBuilder.CreateBox("archColR1", { width: 0.5, height: doorH, depth: 0.68 }, scene);
  archColR1.position = new Vector3(2.45, doorH / 2, -10);
  archColR1.material = darkWoodMat;
  archColR1.checkCollisions = true;
  archColR1.receiveShadows = false;

  // Doorway 1 Archway Trim Header (caps columns and lintel bottom with slight depth margin)
  const archHeader1 = MeshBuilder.CreateBox("archHeader1", { width: doorW + 1.1, height: 0.35, depth: 0.74 }, scene);
  archHeader1.position = new Vector3(0, doorH + 0.175, -10);
  archHeader1.material = goldMat;
  archHeader1.receiveShadows = false;

  // Doorway 1 Floor Saddle Threshold (covers floor seam cleanly)
  const threshold1 = MeshBuilder.CreateBox("threshold1", { width: 4.42, height: 0.015, depth: 0.52 }, scene);
  threshold1.position = new Vector3(0, 0.0075, -10);
  threshold1.material = darkWoodMat;
  threshold1.receiveShadows = false;

  // --- ROOM 2 (ROTUNDA) WALLS (room-2.jpg Regal Burgundy/Lotus Wallpaper) ---
  // Because Room 2 is wider (X: -11 to +11), there are stepped shoulders at Z = -10 and Z = +10
  // South shoulders at Z = -10:
  createWall("r2_shoulder_sw", 1.98, wallH, wallT, new Vector3(-9.99, wallH / 2, -10), wallMatRoom2);
  createWall("r2_shoulder_se", 1.98, wallH, wallT, new Vector3(9.99, wallH / 2, -10), wallMatRoom2);

  // West Wall (X = -11, Z: -10 to +10)
  createWall("r2_west", wallT, wallH, 20, new Vector3(-11, wallH / 2, 0), wallMatRoom2);
  // East Wall (X = +11, Z: -10 to +10)
  createWall("r2_east", wallT, wallH, 20, new Vector3(11, wallH / 2, 0), wallMatRoom2);

  // North shoulders at Z = +10:
  createWall("r2_shoulder_nw", 1.98, wallH, wallT, new Vector3(-9.99, wallH / 2, 10), wallMatRoom2);
  createWall("r2_shoulder_ne", 1.98, wallH, wallT, new Vector3(9.99, wallH / 2, 10), wallMatRoom2);

  // --- DOORWAY 2-3 (Z = +10) ---
  // Left wall segment (X: -9 to -2.7)
  createWall("door2_left", d1LeftW, wallH, wallT, new Vector3(-5.85, wallH / 2, 10), wallMatRoom2);
  // Right wall segment (X: +2.7 to +9)
  createWall("door2_right", d1LeftW, wallH, wallT, new Vector3(5.85, wallH / 2, 10), wallMatRoom2, { uStart1: -0.15 });
  // Lintel over Doorway 2
  createWall("door2_lintel", doorW, lintelH, wallT, new Vector3(0, doorH + lintelH / 2, 10), wallMatRoom2);

  // Decorative Arch Columns for Doorway 2 (X: -2.7 to -2.2 and +2.2 to +2.7)
  const archColL2 = MeshBuilder.CreateBox("archColL2", { width: 0.5, height: doorH, depth: 0.68 }, scene);
  archColL2.position = new Vector3(-2.45, doorH / 2, 10);
  archColL2.material = darkWoodMat;
  archColL2.checkCollisions = true;
  archColL2.receiveShadows = false;

  const archColR2 = MeshBuilder.CreateBox("archColR2", { width: 0.5, height: doorH, depth: 0.68 }, scene);
  archColR2.position = new Vector3(2.45, doorH / 2, 10);
  archColR2.material = darkWoodMat;
  archColR2.checkCollisions = true;
  archColR2.receiveShadows = false;

  // Doorway 2 Archway Trim Header
  const archHeader2 = MeshBuilder.CreateBox("archHeader2", { width: doorW + 1.1, height: 0.35, depth: 0.74 }, scene);
  archHeader2.position = new Vector3(0, doorH + 0.175, 10);
  archHeader2.material = goldMat;
  archHeader2.receiveShadows = false;

  // Doorway 2 Floor Saddle Threshold
  const threshold2 = MeshBuilder.CreateBox("threshold2", { width: 4.42, height: 0.015, depth: 0.52 }, scene);
  threshold2.position = new Vector3(0, 0.0075, 10);
  threshold2.material = darkWoodMat;
  threshold2.receiveShadows = false;

  // --- ROOM 3 (MODERN PAVILION) WALLS (room-3.jpg Emerald & Gold Baroque Wallpaper) ---
  // West Wall (X = -9, Z: +10 to +32)
  createWall("r3_west", wallT, wallH, 22, new Vector3(-9, wallH / 2, 21), wallMatRoom3);
  // East Wall (X = +9, Z: +10 to +32)
  createWall("r3_east", wallT, wallH, 22, new Vector3(9, wallH / 2, 21), wallMatRoom3);

  // --- ROOM 3 NORTH WALL (Solid wall sealing Room 3 at Z = +32) ---
  createWall("r3_north", 18, wallH, wallT, new Vector3(0, wallH / 2, 32), wallMatRoom3);

  // Modern Neon Cornice Accents along Room 3 Ceiling
  const neonStripW = MeshBuilder.CreateBox("neonStripW", { width: 0.08, height: 0.08, depth: 21.6 }, scene);
  neonStripW.position = new Vector3(-8.68, 4.94, 21);
  neonStripW.material = neonCyanMat;
  neonStripW.receiveShadows = false;
  neonStripW.parent = museumRoot;

  const neonStripE = MeshBuilder.CreateBox("neonStripE", { width: 0.08, height: 0.08, depth: 21.6 }, scene);
  neonStripE.position = new Vector3(8.68, 4.94, 21);
  neonStripE.material = neonCyanMat;
  neonStripE.receiveShadows = false;
  neonStripE.parent = museumRoot;

  // Baseboard trim around rooms for premium museum finish
  function createBaseboard(name, width, depth, pos) {
    const bb = MeshBuilder.CreateBox(name, { width, height: 0.24, depth }, scene);
    bb.position = pos;
    bb.material = darkWoodMat;
    bb.receiveShadows = false;
    bb.parent = museumRoot;
    return bb;
  }
  createBaseboard("bb_r1_s", 17.4, 0.12, new Vector3(0, 0.12, -31.68));
  createBaseboard("bb_r3_n", 17.4, 0.12, new Vector3(0, 0.12, 31.68));

  // ==========================================
  // LIGHTING DESIGN
  // ==========================================
  // Hemispheric Ambient Light (Warm gallery ambient fill)
  const hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
  hemiLight.diffuse = new Color3(0.92, 0.9, 0.86);
  hemiLight.groundColor = new Color3(0.28, 0.26, 0.23);
  hemiLight.specular = new Color3(0, 0, 0);
  hemiLight.intensity = 0.75;

  // Room 1 Chandelier / Warm Downlight
  const r1Light = new PointLight("r1Light", new Vector3(0, 4.4, -18), scene);
  r1Light.diffuse = new Color3(1.0, 0.92, 0.82);
  r1Light.specular = new Color3(0, 0, 0);
  r1Light.intensity = 0.9;
  r1Light.range = 20;

  // SpotLight on Room 1 Centerpiece
  const spotPed1 = new SpotLight("spotPed1", new Vector3(0, 4.6, -18), new Vector3(0, -1, 0), Math.PI / 3, 2, scene);
  spotPed1.diffuse = new Color3(1.0, 0.92, 0.8);
  spotPed1.specular = new Color3(0, 0, 0);
  spotPed1.intensity = 1.0;
  spotPed1.range = 10;

  // Room 2 Grand Chandelier PointLight
  const r2Light = new PointLight("r2Light", new Vector3(0, 4.5, 0), scene);
  r2Light.diffuse = new Color3(1.0, 0.95, 0.88);
  r2Light.specular = new Color3(0, 0, 0);
  r2Light.intensity = 0.9;
  r2Light.range = 24;

  // Top-down soft directional light for floor contact shadows in Room 2
  const dirLight = new DirectionalLight("dirLight", new Vector3(0, -1, 0), scene);
  dirLight.position = new Vector3(0, 4.8, 0);
  dirLight.specular = new Color3(0, 0, 0);
  dirLight.intensity = 0.5;

  const shadowGenerator = new ShadowGenerator(1024, dirLight);
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.blurKernel = 32;
  shadowGenerator.bias = 0.0005;
  shadowGenerator.normalBias = 0.02;

  // Room 3 Modern Luminescent Lights
  const r3Light = new PointLight("r3Light", new Vector3(0, 4.2, 17), scene);
  r3Light.diffuse = new Color3(0.75, 0.9, 1.0);
  r3Light.specular = new Color3(0, 0, 0);
  r3Light.intensity = 0.9;
  r3Light.range = 20;

  const r3FillLight = new PointLight("r3FillLight", new Vector3(0, 4.2, 23), scene);
  r3FillLight.diffuse = new Color3(0.9, 0.8, 1.0);
  r3FillLight.specular = new Color3(0, 0, 0);
  r3FillLight.intensity = 0.9;
  r3FillLight.range = 20;

  // ==========================================
  // ARCHITECTURAL COLUMNS (Room 2 Rotunda)
  // ==========================================
  const columnPositions = [
    new Vector3(-6.5, 0, -5.5),
    new Vector3(6.5, 0, -5.5),
    new Vector3(-6.5, 0, 5.5),
    new Vector3(6.5, 0, 5.5)
  ];

  columnPositions.forEach((pos, idx) => {
    // Plinth base
    const colBase = MeshBuilder.CreateCylinder(`colBase_${idx}`, { diameter: 1.2, height: 0.4 }, scene);
    colBase.position = new Vector3(pos.x, 0.2, pos.z);
    colBase.material = whiteMarbleMat;
    colBase.checkCollisions = true;

    // Shaft
    const colShaft = MeshBuilder.CreateCylinder(`colShaft_${idx}`, { diameter: 0.8, height: 4.2, tessellation: 24 }, scene);
    colShaft.position = new Vector3(pos.x, 2.5, pos.z);
    colShaft.material = whiteMarbleMat;
    colShaft.checkCollisions = true;

    // Capital
    const colCap = MeshBuilder.CreateCylinder(`colCap_${idx}`, { diameter: 1.2, height: 0.4 }, scene);
    colCap.position = new Vector3(pos.x, 4.8, pos.z);
    colCap.material = whiteMarbleMat;

    shadowGenerator.addShadowCaster(colShaft);
  });

  // Exhibits array for interactive inspection
  const exhibits = [];

  // ==========================================
  // ROOM 1 CENTERPIECE: The Golden Polyhedron
  // ==========================================
  const ped1 = MeshBuilder.CreateBox("pedestal1", { width: 1.6, height: 1.1, depth: 1.6 }, scene);
  ped1.position = new Vector3(0, 0.55, -18);
  ped1.material = darkWoodMat;
  ped1.checkCollisions = true;
  shadowGenerator.addShadowCaster(ped1);

  const ped1Rim = MeshBuilder.CreateBox("ped1Rim", { width: 1.7, height: 0.08, depth: 1.7 }, scene);
  ped1Rim.position = new Vector3(0, 1.1, -18);
  ped1Rim.material = goldMat;

  const mobiusMesh = MeshBuilder.CreatePolyhedron("mobiusMesh", { type: 2, size: 0.65 }, scene);
  mobiusMesh.position = new Vector3(0, 1.95, -18);
  mobiusMesh.material = goldMat;
  shadowGenerator.addShadowCaster(mobiusMesh);

  exhibits.push({
    id: "sculpt_polyhedron",
    title: "Harmonia Polyhedrica",
    artist: "Marcus Bennett",
    year: "1932",
    room: "Room 1: The Grand Vestibule",
    description: "Hand-chiseled bronze and 24-karat gold leaf polyhedral lattice exploring symmetrical cosmic geometries.",
    position: new Vector3(0, 1.5, -18)
  });

  // ==========================================
  // ROOM 2 CENTERPIECE: The Celestial Knot
  // ==========================================
  // Tiered circular marble dais
  const daisLower = MeshBuilder.CreateCylinder("daisLower", { diameter: 4.4, height: 0.25 }, scene);
  daisLower.position = new Vector3(0, 0.125, 0);
  daisLower.material = whiteMarbleMat;
  daisLower.checkCollisions = true;

  const daisUpper = MeshBuilder.CreateCylinder("daisUpper", { diameter: 2.6, height: 0.45 }, scene);
  daisUpper.position = new Vector3(0, 0.475, 0);
  daisUpper.material = darkWoodMat;
  daisUpper.checkCollisions = true;

  const daisRim = MeshBuilder.CreateTorus("daisRim", { diameter: 2.64, thickness: 0.07, tessellation: 48 }, scene);
  daisRim.position = new Vector3(0, 0.68, 0);
  daisRim.material = goldMat;
  daisRim.receiveShadows = false;

  // Bronze Torus Knot
  const knotMat = new StandardMaterial("knotMat", scene);
  knotMat.diffuseColor = new Color3(0.8, 0.45, 0.2);
  knotMat.specularColor = new Color3(1.0, 0.8, 0.6);
  knotMat.specularPower = 96;

  const torusKnot = MeshBuilder.CreateTorusKnot("torusKnot", {
    radius: 0.8,
    tube: 0.22,
    radialSegments: 96,
    tubularSegments: 32,
    p: 2,
    q: 3
  }, scene);
  torusKnot.position = new Vector3(0, 1.9, 0);
  torusKnot.material = knotMat;
  shadowGenerator.addShadowCaster(torusKnot);

  exhibits.push({
    id: "sculpt_torus",
    title: "The Celestial Knot",
    artist: "Aurelia Thorne",
    year: "1988",
    room: "Room 2: Central Rotunda",
    description: "Polished phosphor bronze casting of a trefoil topological singularity, illuminated by gallery skylights.",
    position: new Vector3(0, 1.8, 0)
  });

  // ==========================================
  // ROOM 3 CENTERPIECE: The Prismatic Lumina
  // ==========================================
  // Modern glowing plinth
  const ped3 = MeshBuilder.CreateBox("pedestal3", { width: 1.8, height: 0.9, depth: 1.8 }, scene);
  ped3.position = new Vector3(0, 0.45, 18);
  ped3.material = darkWoodMat;
  ped3.checkCollisions = true;

  // Luminous ring accents around pedestal (inset below plinth top at Y = 0.9 to avoid coplanar overlap)
  const ped3LightStrip = MeshBuilder.CreateBox("ped3Strip", { width: 1.84, height: 0.06, depth: 1.84 }, scene);
  ped3LightStrip.position = new Vector3(0, 0.84, 18);
  ped3LightStrip.material = neonCyanMat;
  ped3LightStrip.receiveShadows = false;

  // Glass Icosahedron with inner core and orbiting rings
  const crystalMat = new StandardMaterial("crystalMat", scene);
  crystalMat.diffuseColor = new Color3(0.1, 0.3, 0.5);
  crystalMat.emissiveColor = new Color3(0.05, 0.2, 0.35);
  crystalMat.specularColor = new Color3(0.9, 0.95, 1.0);
  crystalMat.alpha = 0.82;
  crystalMat.specularPower = 128;

  const crystalMesh = MeshBuilder.CreateIcoSphere("crystalMesh", { radius: 0.75, subdivisions: 2 }, scene);
  crystalMesh.position = new Vector3(0, 1.95, 18);
  crystalMesh.material = crystalMat;

  const innerCore = MeshBuilder.CreateSphere("innerCore", { diameter: 0.4 }, scene);
  innerCore.position = new Vector3(0, 1.95, 18);
  innerCore.material = neonMagentaMat;

  const orbitRing = MeshBuilder.CreateTorus("orbitRing", { diameter: 2.2, thickness: 0.04, tessellation: 64 }, scene);
  orbitRing.position = new Vector3(0, 1.95, 18);
  orbitRing.rotation.x = Math.PI / 4;
  orbitRing.material = neonCyanMat;

  // Local light for Room 3 centerpiece
  const crystalLight = new PointLight("crystalLight", new Vector3(0, 2.0, 18), scene);
  crystalLight.diffuse = new Color3(0.2, 0.8, 1.0);
  crystalLight.specular = new Color3(0, 0, 0);
  crystalLight.intensity = 0.8;
  crystalLight.range = 8;

  // (Wall frames loaded dynamically from config.json)

  exhibits.push({
    id: "sculpt_lumina",
    title: "Prismatic Singularity",
    artist: "Sora Takahashi & KAI Studio",
    year: "2023",
    room: "Room 3: Lumina Pavilion",
    description: "Optically clear fused quartz faceted polyhedron with a quantum-dot luminescent core and levitating gyro rings.",
    position: new Vector3(0, 1.9, 18)
  });

  // Animated elements loop
  // FIX #6 (Double-tap bug): Cap dt to 0.05s (20 FPS min) to prevent runaway rotations
  // when the browser tab loses focus and then resumes with a massive accumulated delta.
  // FIX #2 (Event listener leak): Store the observer handle so it can be removed on disposal.
  const animObserver = scene.onBeforeRenderObservable.add(() => {
    const dt = Math.min(scene.getEngine().getDeltaTime() / 1000, 0.05); // FIX #6: dt cap
    // Rotate Room 1 polyhedron
    mobiusMesh.rotation.y += dt * 0.5;
    mobiusMesh.rotation.x += dt * 0.25;

    // Rotate Room 2 Torus Knot
    torusKnot.rotation.y += dt * 0.4;

    // Rotate Room 3 Crystal & Orbit Ring
    crystalMesh.rotation.y += dt * 0.3;
    orbitRing.rotation.z += dt * 0.8;
    orbitRing.rotation.x = Math.PI / 4 + Math.sin(Date.now() * 0.002) * 0.15;
  });

  return {
    museumRoot,
    exhibits,
    shadowGenerator,
    // FIX #2 (Event listener leak): Expose animObserver so main.js can call
    // scene.onBeforeRenderObservable.remove(animObserver) when disposing the scene.
    animObserver
  };
}
