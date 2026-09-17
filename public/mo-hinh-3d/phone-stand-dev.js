import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';

// ─── Scene ───
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd8d6d0);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.05, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;

// ─── Materials ───
const MAT = {
  plastic: new THREE.MeshStandardMaterial({ color: 0x202326, roughness: .44, metalness: .02 }),
  trim: new THREE.MeshPhysicalMaterial({ color: 0x111315, roughness: .15, metalness: .03, clearcoat: .65, clearcoatRoughness: .20 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x090a0b, roughness: .82, metalness: 0 }),
  hardware: new THREE.MeshStandardMaterial({ color: 0x22262a, roughness: .27, metalness: .48 }),
  rib: new THREE.MeshStandardMaterial({ color: 0x121416, roughness: .46, metalness: .03 })
};

// ─── PRODUCT_ROOT (Contains ONLY the 23 stand components) ───
const PRODUCT_ROOT = new THREE.Group();
PRODUCT_ROOT.name = 'phoneStand';
scene.add(PRODUCT_ROOT);
const model = PRODUCT_ROOT; // Alias for backward compatibility

// ─── Helpers ───
function addMesh(g, geo, mat, name, pos = [0, 0, 0], rot = [0, 0, 0]) {
  const m = new THREE.Mesh(geo, mat); m.name = name;
  m.position.set(...pos); m.rotation.set(...rot);
  m.castShadow = true; m.receiveShadow = true;
  g.add(m); return m;
}
function roundedRectShape(w, d, r) {
  const s = new THREE.Shape(), x = -w / 2, z = -d / 2;
  s.moveTo(x + r, z); s.lineTo(x + w - r, z);
  s.quadraticCurveTo(x + w, z, x + w, z + r); s.lineTo(x + w, z + d - r);
  s.quadraticCurveTo(x + w, z + d, x + w - r, z + d); s.lineTo(x + r, z + d);
  s.quadraticCurveTo(x, z + d, x, z + d - r); s.lineTo(x, z + r);
  s.quadraticCurveTo(x, z, x + r, z); return s;
}
function roundedSlab(w, d, h, r, bevel = .12) {
  const geo = new THREE.ExtrudeGeometry(roundedRectShape(w, d, r), {
    depth: h, bevelEnabled: true, bevelSegments: 4, steps: 1,
    bevelSize: bevel, bevelThickness: bevel, curveSegments: 12
  });
  geo.rotateX(Math.PI / 2); geo.translate(0, h / 2, 0);
  geo.computeVertexNormals(); return geo;
}
function roundedPanel(w, h, d, r, bevel = .04) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: d, bevelEnabled: true, bevelSegments: 3, steps: 1,
    bevelSize: bevel, bevelThickness: bevel, curveSegments: 8
  });
  geo.translate(0, 0, -d / 2); geo.computeVertexNormals(); return geo;
}
function cyl(r, h, segments = 40) { return new THREE.CylinderGeometry(r, r, h, segments); }
function orientedCylinder(g, name, a, b, r, mat = MAT.plastic, segments = 32) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const mid = A.clone().add(B).multiplyScalar(.5), dir = B.clone().sub(A);
  const m = addMesh(g, cyl(r, dir.length(), segments), mat, name);
  m.position.copy(mid);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return m;
}
function hookLipShape(w, h, hookH, hookD) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, -h / 2);
  s.lineTo(w / 2, -h / 2);
  s.lineTo(w / 2, h / 2 - hookH);
  s.lineTo(w / 2 - hookD, h / 2 - hookH);
  s.lineTo(w / 2 - hookD, h / 2);
  s.lineTo(-w / 2 + hookD, h / 2);
  s.lineTo(-w / 2 + hookD, h / 2 - hookH);
  s.lineTo(-w / 2, h / 2 - hookH);
  s.closePath();
  return s;
}

// ─── Part registry for explode ───
// Each "explodable part" is a THREE.Group added directly to model
const partsList = []; // { group, label, anchor }
function part(name, label, anchor = false) {
  const g = new THREE.Group();
  g.name = name;
  g.userData.part = true;
  g.userData.label = label;
  model.add(g);
  partsList.push({ group: g, label, anchor });
  return g;
}

// ════════════════════════════════════════════════════════
//  BUILD MODEL — many fine-grained separate parts
// ════════════════════════════════════════════════════════

// ── 1. BASE SHELL — anchor, stays in place ──
const baseShell = part('base_shell', 'Đế (Base)', true);
addMesh(baseShell, roundedSlab(4.72, 4.42, .32, 1.10, .10), MAT.plastic, 'base_top', [0, .22, 0]);
addMesh(baseShell, roundedSlab(4.82, 4.52, .15, 1.15, .07), MAT.trim, 'base_glossy_lower_band', [0, .075, 0]);

// ── 2. MAST SOCKET + FILLET — separate piece ──
const mastSocket = part('mast_socket', 'Ổ cắm cột (Socket)');
addMesh(mastSocket, cyl(.43, .18, 48), MAT.plastic, 'mast_socket_cyl', [0, .48, -.34]);
addMesh(mastSocket, new THREE.TorusGeometry(.38, .08, 14, 48), MAT.trim, 'socket_fillet', [0, .57, -.34], [Math.PI / 2, 0, 0]);

// ── 3. MAST TUBE ──
const mastTube = part('mast_tube', 'Cột (Mast)');
addMesh(mastTube, cyl(.21, 4.72, 40), MAT.plastic, 'mast_cyl', [0, 2.90, -.34]);

// ── 4. MAST SEAM RING ──
const mastSeam = part('mast_seam', 'Viền cột (Mast Seam)');
addMesh(mastSeam, new THREE.TorusGeometry(.21, .03, 10, 40), MAT.trim, 'mast_seam_ring', [0, .58, -.34], [Math.PI / 2, 0, 0]);

// ── 5. LOWER HINGE BARREL ──
const lowerBarrel = part('lower_barrel', 'Thân khớp dưới (Lower Barrel)');
addMesh(lowerBarrel, cyl(.36, .66, 40), MAT.plastic, 'lower_hinge_barrel', [0, 5.30, -.34], [0, 0, Math.PI / 2]);

// ── 6. LOWER AXLE ──
const lowerAxle = part('lower_axle', 'Trục khớp dưới (Lower Axle)');
addMesh(lowerAxle, cyl(.15, .88, 32), MAT.hardware, 'lower_axle_rod', [0, 5.30, -.34], [0, 0, Math.PI / 2]);

// ── 7. LOWER KNOB + RIBS ──
const lowerKnob = part('lower_knob', 'Núm vặn dưới (Lower Knob)');
lowerKnob.position.set(.48, 5.30, -.34);
addMesh(lowerKnob, cyl(.32, .18, 32), MAT.plastic, 'lower_knob_core', [0, 0, 0], [0, 0, Math.PI / 2]);
for (let i = 0; i < 12; i++) {
  const a = i * Math.PI * 2 / 12;
  addMesh(lowerKnob, new THREE.BoxGeometry(.11, .08, .11), MAT.rib, `lower_knob_rib_${i}`,
    [.09, Math.cos(a) * .28, Math.sin(a) * .28], [0, a, 0]);
}

// ── 8. UPPER ARM LINK ──
const upperArm = part('upper_arm', 'Cánh tay nối (Upper Arm)');
orientedCylinder(upperArm, 'upper_link', [0, 5.31, -.34], [-.16, 6.78, .30], .28, MAT.plastic, 40);

// ── 9. UPPER HINGE BARREL ──
const upperBarrel = part('upper_barrel', 'Thân khớp trên (Upper Barrel)');
addMesh(upperBarrel, cyl(.36, .70, 40), MAT.plastic, 'upper_hinge_barrel', [-.16, 6.84, .33], [0, 0, Math.PI / 2]);

// ── 10. UPPER AXLE + CAP ──
const upperAxle = part('upper_axle', 'Trục khớp trên (Upper Axle)');
addMesh(upperAxle, cyl(.15, .86, 32), MAT.hardware, 'upper_axle_rod', [-.16, 6.84, .33], [0, 0, Math.PI / 2]);
addMesh(upperAxle, cyl(.24, .14, 32), MAT.plastic, 'upper_axle_cap', [-.60, 6.84, .33], [0, 0, Math.PI / 2]);

// ── 11. LOCKING LEVER ──
const lever = part('locking_lever', 'Cần khóa (Locking Lever)');
addMesh(lever, new THREE.CapsuleGeometry(.12, .44, 8, 14), MAT.plastic, 'locking_lever_mesh', [.32, 6.65, .42], [0, 0, -.72]);

// ── 12. BALL HEAD HOUSING ──
const ballHousing = part('ball_housing', 'Vỏ đầu bi (Ball Housing)');
orientedCylinder(ballHousing, 'ball_head_housing', [-.16, 6.96, .38], [-.16, 7.42, .92], .50, MAT.plastic, 48);

// ── 13. BALL JOINT (sphere) ──
const ballJoint = part('ball_joint', 'Bi khớp (Ball Joint)');
addMesh(ballJoint, new THREE.SphereGeometry(.30, 32, 20), MAT.hardware, 'ball_sphere', [-.16, 7.54, 1.02]);

// ── 14. BALL STEM ──
const ballStem = part('ball_stem', 'Thân bi (Ball Stem)');
orientedCylinder(ballStem, 'ball_stem_cyl', [-.16, 7.54, 1.02], [-.16, 7.70, 1.24], .13, MAT.hardware, 24);

// ── 15. COLLAR CORE ──
const collarCore = part('collar_core', 'Lõi cổ kẹp (Collar Core)');
addMesh(collarCore, cyl(.46, .34, 40), MAT.rib, 'collar_core_cyl', [-.16, 7.74, 1.36], [Math.PI / 2, 0, 0]);

// ── 16. COLLAR RIBS (as one group) ──
const collarRibs = part('collar_ribs', 'Gờ cổ kẹp (Collar Ribs)');
for (let i = 0; i < 20; i++) {
  const a = i * Math.PI * 2 / 20;
  const x = -.16 + Math.cos(a) * .46, y = 7.74 + Math.sin(a) * .46;
  addMesh(collarRibs, new THREE.BoxGeometry(.085, .12, .38), MAT.rib,
    `collar_rib_${String(i).padStart(2, '0')}`, [x, y, 1.36], [0, 0, a]);
}

// ── 17. BACKPLATE ──
const backplate = part('backplate', 'Tấm lưng kẹp (Backplate)');
addMesh(backplate, roundedPanel(3.30, 1.10, .30, .14), MAT.plastic, 'clamp_backplate', [-.16, 7.78, 1.70]);

// ── 18. RUBBER CONTACT PAD ──
const rubberPad = part('rubber_pad', 'Đệm cao su (Rubber Pad)');
addMesh(rubberPad, roundedPanel(2.85, .74, .10, .09, .02), MAT.rubber, 'back_contact_pad', [-.16, 7.78, 1.90]);

// ── 19. FIXED JAW BODY ──
const fixedJawBody = part('fixed_jaw_body', 'Thân hàm cố định (Fixed Jaw)');
addMesh(fixedJawBody, roundedPanel(.38, 1.30, .50, .10), MAT.plastic, 'fixed_jaw_panel', [-1.88, 7.78, 1.76]);

// ── 20. FIXED JAW HOOK ──
const fixedJawHook = part('fixed_jaw_hook', 'Móc hàm cố định (Fixed Hook)');
const fhGeo = new THREE.ExtrudeGeometry(hookLipShape(.34, .50, .22, .12), {
  depth: .20, bevelEnabled: true, bevelSegments: 2, bevelSize: .02, bevelThickness: .02
});
fhGeo.translate(0, 0, -.10); fhGeo.computeVertexNormals();
addMesh(fixedJawHook, fhGeo, MAT.plastic, 'fixed_hook_mesh', [-1.72, 7.78, 2.08]);
addMesh(fixedJawHook, roundedPanel(.14, .80, .07, .03, .01), MAT.rubber, 'fixed_jaw_pad', [-1.62, 7.78, 2.18]);

// ── 21. SLIDING JAW BODY ──
const slidingJawBody = part('sliding_jaw_body', 'Thân hàm trượt (Sliding Jaw)');
addMesh(slidingJawBody, roundedPanel(.42, 1.30, .50, .10), MAT.plastic, 'sliding_jaw_panel', [1.56, 7.78, 1.76]);

// ── 22. SLIDING JAW HOOK ──
const slidingJawHook = part('sliding_jaw_hook', 'Móc hàm trượt (Sliding Hook)');
const shGeo = new THREE.ExtrudeGeometry(hookLipShape(.34, .50, .22, .12), {
  depth: .20, bevelEnabled: true, bevelSegments: 2, bevelSize: .02, bevelThickness: .02
});
shGeo.translate(0, 0, -.10); shGeo.computeVertexNormals();
addMesh(slidingJawHook, shGeo, MAT.plastic, 'sliding_hook_mesh', [1.40, 7.78, 2.08]);
addMesh(slidingJawHook, roundedPanel(.14, .80, .07, .03, .01), MAT.rubber, 'sliding_jaw_pad', [1.30, 7.78, 2.18]);

// ── 23. SLIDING RAIL HOUSING ──
const slidingRail = part('sliding_rail', 'Ray trượt (Sliding Rail)');
addMesh(slidingRail, roundedPanel(.54, .66, .22, .08), MAT.plastic, 'sliding_rail_housing', [1.32, 7.78, 1.50]);
addMesh(slidingRail, new THREE.BoxGeometry(.06, .36, .05), MAT.trim, 'sliding_jaw_seam', [1.37, 8.18, 2.10]);

// ── Ground and lighting ──
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(18, 96),
  new THREE.MeshStandardMaterial({ color: 0xb8b5ae, roughness: .92 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -.03;
ground.receiveShadow = true;
scene.add(ground);

scene.add(new THREE.HemisphereLight(0xffffff, 0x69717b, 1.85));
const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
keyLight.position.set(6, 12, 8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -8; keyLight.shadow.camera.right = 8;
keyLight.shadow.camera.top = 12; keyLight.shadow.camera.bottom = -3;
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0x9fc8ff, 1.5);
fillLight.position.set(-7, 8, -5);
scene.add(fillLight);

// ════════════════════════════════════════════════════════
//  CINEMATIC VISUAL SYSTEM — Premium product showcase
// ════════════════════════════════════════════════════════
const origBackground = scene.background.clone();
const origGroundColor = ground.material.color.clone();
const origGroundRoughness = ground.material.roughness;
const origKeyIntensity = keyLight.intensity;
const origKeyColor = keyLight.color.clone();
const origFillIntensity = fillLight.intensity;
const cineAccentLights = [];

// ── Subtle floating sparkle particles ──
const PARTICLE_COUNT = 150;
const particleGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(PARTICLE_COUNT * 3);
const pSpd = new Float32Array(PARTICLE_COUNT);
for (let i = 0; i < PARTICLE_COUNT; i++) {
  pPos[i*3]   = (Math.random() - 0.5) * 30;
  pPos[i*3+1] = Math.random() * 16 - 1;
  pPos[i*3+2] = (Math.random() - 0.5) * 30;
  pSpd[i] = 0.08 + Math.random() * 0.25;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const particleMat = new THREE.PointsMaterial({
  color: 0xffd699, size: 0.04, transparent: true, opacity: 0,
  blending: THREE.AdditiveBlending, depthWrite: false
});
const particles = new THREE.Points(particleGeo, particleMat);
particles.visible = false;
scene.add(particles);

function updateParticles(dt, time) {
  if (!particles.visible) return;
  const arr = particleGeo.attributes.position.array;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    arr[i*3+1] += pSpd[i] * dt;
    if (arr[i*3+1] > 16) { arr[i*3+1] = -1; arr[i*3] = (Math.random()-.5)*30; arr[i*3+2] = (Math.random()-.5)*30; }
    arr[i*3]   += Math.sin(time * 0.6 + i * 1.1) * 0.002;
    arr[i*3+2] += Math.cos(time * 0.5 + i * 0.7) * 0.002;
  }
  particleGeo.attributes.position.needsUpdate = true;
}

// ── Vignette + Letterbox overlay (rendered ON canvas = captured in video) ──
const overlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const overlayScene = new THREE.Scene();

const vignetteMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, depthTest: false,
  uniforms: { intensity: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `
    varying vec2 vUv;
    uniform float intensity;
    void main(){
      vec2 c = vUv - 0.5;
      float d = length(c) * 1.4;
      float v = smoothstep(0.55, 1.35, d) * intensity;
      gl_FragColor = vec4(0.04, 0.03, 0.02, v);
    }
  `
});
overlayScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), vignetteMat));

const letterboxMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
const topBar = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.12), letterboxMat);
topBar.position.set(0, 0.94, 0.01);
overlayScene.add(topBar);
const bottomBar = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.12), letterboxMat);
bottomBar.position.set(0, -0.94, 0.01);
overlayScene.add(bottomBar);

function setupCinematicVisuals() {
  // ── BRIGHT PREMIUM STUDIO (Apple-style product showcase) ──
  // Light background makes dark product POP with clear silhouette
  scene.background = new THREE.Color(0xf2efe9); // warm off-white studio

  // Clean studio floor — light gray with subtle sheen
  ground.material.color.set(0xe5e2dc);
  ground.material.roughness = 0.6;
  ground.material.metalness = 0.12;
  ground.material.needsUpdate = true;

  // Key light: bright warm for product definition
  keyLight.intensity = 5.0;
  keyLight.color.set(0xfff8ee); // warm white

  // Fill: softer, slightly cool for dimension
  fillLight.intensity = 2.2;

  // Strong RIM / BACK lights — essential for dark products!
  // Creates bright edges that outline the product shape clearly
  const configs = [
    { color: 0xffffff, intensity: 8,   pos: [-7, 9, -8] },   // strong back-left rim
    { color: 0xfff5e0, intensity: 6,   pos: [8, 7, -6] },    // warm back-right rim
    { color: 0xf0f4ff, intensity: 4,   pos: [0, 14, 0] },    // top overhead soft
    { color: 0xffeedd, intensity: 3,   pos: [-8, 3, 8] },    // warm front-left fill
    { color: 0xfff8f0, intensity: 2.5, pos: [6, 2, 6] },     // front-right accent
  ];
  for (const cfg of configs) {
    const light = new THREE.PointLight(cfg.color, cfg.intensity, 40);
    light.position.set(...cfg.pos);
    scene.add(light);
    cineAccentLights.push(light);
  }

  // Subtle warm sparkle particles (premium feel, not sci-fi)
  particles.visible = true;
  particleMat.color.set(0xddc080);
  particleMat.opacity = 0.18;
  particleMat.size = 0.035;

  // Light vignette — just enough to guide focus to center
  vignetteMat.uniforms.intensity.value = 0.30;

  // Hide UI panel for clean recording
  const panel = document.getElementById('panel');
  if (panel) panel.style.opacity = '0';
}

function teardownCinematicVisuals() {
  scene.background = origBackground;
  ground.material.color.copy(origGroundColor);
  ground.material.roughness = origGroundRoughness;
  ground.material.metalness = 0;
  ground.material.needsUpdate = true;

  keyLight.intensity = origKeyIntensity;
  keyLight.color.copy(origKeyColor);
  fillLight.intensity = origFillIntensity;

  for (const light of cineAccentLights) {
    scene.remove(light);
    light.dispose();
  }
  cineAccentLights.length = 0;

  particles.visible = false;
  particleMat.opacity = 0;
  particleMat.color.set(0xffd699);
  particleMat.size = 0.04;
  vignetteMat.uniforms.intensity.value = 0;

  const panel = document.getElementById('panel');
  if (panel) panel.style.opacity = '1';
}

// ════════════════════════════════════════════════════════
// ─── DYNAMIC BOX3 CAMERA FRAMING SYSTEM ───
// Calculates Box3 of model, centers target, computes distance based on max dimension & FOV/aspect
// ════════════════════════════════════════════════════════
const DEFAULT_3_4_DIR = new THREE.Vector3(1.0, 0.65, 1.25).normalize();

function computeExactFitDistance(box, cam, viewDir, margin = 0.85) {
  const center = new THREE.Vector3();
  box.getCenter(center);

  const corners = [
    new THREE.Vector3(box.min.x, box.min.y, box.min.z),
    new THREE.Vector3(box.min.x, box.min.y, box.max.z),
    new THREE.Vector3(box.min.x, box.max.y, box.min.z),
    new THREE.Vector3(box.min.x, box.max.y, box.max.z),
    new THREE.Vector3(box.max.x, box.min.y, box.min.z),
    new THREE.Vector3(box.max.x, box.min.y, box.max.z),
    new THREE.Vector3(box.max.x, box.max.y, box.min.z),
    new THREE.Vector3(box.max.x, box.max.y, box.max.z)
  ];

  // Camera coordinate axes
  const w = viewDir.clone().normalize(); // from target towards camera
  const up = new THREE.Vector3(0, 1, 0);
  let u = new THREE.Vector3().crossVectors(up, w);
  if (u.lengthSq() < 0.0001) {
    u = new THREE.Vector3(1, 0, 0);
  } else {
    u.normalize();
  }
  const v = new THREE.Vector3().crossVectors(w, u).normalize();

  const fovRad = THREE.MathUtils.degToRad(cam.fov);
  const tanHalfFovY = Math.tan(fovRad / 2);
  const tanHalfFovX = tanHalfFovY * cam.aspect;

  let maxDist = 0;
  for (const c of corners) {
    const diff = c.clone().sub(center);
    const zProj = diff.dot(w);
    const xProj = Math.abs(diff.dot(u));
    const yProj = Math.abs(diff.dot(v));

    const distY = zProj + yProj / (tanHalfFovY * margin);
    const distX = zProj + xProj / (tanHalfFovX * margin);

    if (distY > maxDist) maxDist = distY;
    if (distX > maxDist) maxDist = distX;
  }

  return Math.max(maxDist, 1.0);
}

function getModelBoundingInfo(customDir = null, margin = 0.85) {
  // Include the existing parent transform before the first render. The bounds
  // still contain PRODUCT_ROOT only; no scene siblings (ground/lights) enter it.
  PRODUCT_ROOT.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(PRODUCT_ROOT);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z, 0.1);

  const viewDir = customDir ? customDir.clone().normalize() : DEFAULT_3_4_DIR.clone();
  const distance = computeExactFitDistance(box, camera, viewDir, margin);

  return { box, center, size, maxDim, distance, viewDir };
}

function fitCameraToObject(useDefaultAngle = false, smooth = false) {
  let viewDir;
  if (useDefaultAngle) {
    viewDir = DEFAULT_3_4_DIR.clone();
  } else {
    viewDir = camera.position.clone().sub(controls.target);
    if (viewDir.lengthSq() < 0.0001) {
      viewDir = DEFAULT_3_4_DIR.clone();
    } else {
      viewDir.normalize();
    }
  }

  const { center, distance } = getModelBoundingInfo(viewDir, 0.85);
  const desiredCamPos = center.clone().addScaledVector(viewDir, distance);

  if (smooth) {
    controls.target.lerp(center, 0.15);
    camera.position.lerp(desiredCamPos, 0.15);
    camera.lookAt(controls.target);
  } else {
    controls.target.copy(center);
    camera.position.copy(desiredCamPos);
    camera.lookAt(controls.target);
    controls.update();
  }
}

// Startup framing is applied after all assembled-part state is initialized below.

// ─── Camera views (Front, Side, Rear, Top, 3/4 Hero) ───
const viewDirections = {
  hero: DEFAULT_3_4_DIR.clone(),
  front: new THREE.Vector3(0, 0, 1),
  side: new THREE.Vector3(-1, 0, 0),
  rear: new THREE.Vector3(0, 0, -1),
  top: new THREE.Vector3(0, 1, 0.0001).normalize()
};

document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => {
  document.querySelectorAll('[data-view]').forEach(btn => btn.classList.remove('active'));
  b.classList.add('active');

  const dir = (viewDirections[b.dataset.view] || DEFAULT_3_4_DIR).clone().normalize();
  const { center, distance } = getModelBoundingInfo(dir, 0.85);
  controls.target.copy(center);
  camera.position.copy(center).addScaledVector(dir, distance);
  camera.lookAt(controls.target);
  controls.update();
});

// ════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════
//  CHAOTIC EXPLODE, DRAG & DROP AND ASSEMBLE SYSTEM
// ════════════════════════════════════════════════════════

function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}
let currentRng = seededRandom(42069);

// Data structure per part
const explodeData = [];
for (const entry of partsList) {
  const g = entry.group;
  const origPos = g.position.clone();
  const origRot = new THREE.Euler().copy(g.rotation);
  const origQuat = new THREE.Quaternion().setFromEuler(origRot);

  explodeData.push({
    group: g,
    label: entry.label,
    anchor: entry.anchor,
    origPos,
    origRot,
    origQuat,
    offset: new THREE.Vector3(),
    rotAxis: new THREE.Vector3(0, 1, 0),
    rotAngle: 0,
    startPos: origPos.clone(),
    startQuat: origQuat.clone(),
    targetPos: origPos.clone(),
    targetQuat: origQuat.clone()
  });
}

function randomizeOffsets(useNewRng = false) {
  const rng = useNewRng ? Math.random : currentRng;
  for (const d of explodeData) {
    if (d.anchor) {
      d.offset.set(0, 0, 0);
      d.rotAxis.set(0, 1, 0);
      d.rotAngle = 0;
      continue;
    }
    const theta = rng() * Math.PI * 2;
    const phi = rng() * Math.PI * 0.55 + 0.15;
    const dist = 3.5 + rng() * 5.5;
    d.offset.set(
      Math.sin(phi) * Math.cos(theta) * dist,
      Math.cos(phi) * dist + 1.0,
      Math.sin(phi) * Math.sin(theta) * dist
    );
    d.rotAxis.set(rng() - .5, rng() - .5, rng() - .5).normalize();
    d.rotAngle = (rng() - .5) * Math.PI * 4;
  }
}
randomizeOffsets(false); // initial trajectory setup

// Animation state
let animMode = null; // 'assemble' | 'explode' | null
let animT = 0;
const ANIM_SPEED = 1.35;

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function updateStatus(text) {
  const el = document.getElementById('status');
  if (el) el.textContent = text;
}

function updateSlider(val) {
  const slider = document.getElementById('explode-slider');
  const label = document.getElementById('slider-label');
  const clamped = Math.max(0, Math.min(100, Math.round(val)));
  if (slider) slider.value = clamped;
  if (label) label.textContent = clamped + '%';
}

function resetAllPartsToAssembled() {
  for (const d of explodeData) {
    d.group.visible = true;
    d.group.position.copy(d.origPos);
    d.group.quaternion.copy(d.origQuat);
  }
  updateSlider(0);
}

function startAssemble() {
  stopCinematic();
  animMode = 'assemble';
  animT = 0;
  for (const d of explodeData) {
    d.startPos.copy(d.group.position);
    d.startQuat.copy(d.group.quaternion);
    d.targetPos.copy(d.origPos);
    d.targetQuat.copy(d.origQuat);
  }
  updateStatus('🔧 Đang gom tất cả linh kiện về đúng khớp...');
}

function startExplode(regenerate = false) {
  stopCinematic();
  if (regenerate) randomizeOffsets(true);
  animMode = 'explode';
  animT = 0;
  for (const d of explodeData) {
    d.startPos.copy(d.group.position);
    d.startQuat.copy(d.group.quaternion);
    if (d.anchor) {
      d.targetPos.copy(d.origPos);
      d.targetQuat.copy(d.origQuat);
    } else {
      d.targetPos.copy(d.origPos).add(d.offset);
      const q = new THREE.Quaternion().setFromAxisAngle(d.rotAxis, d.rotAngle);
      d.targetQuat.copy(d.origQuat).premultiply(q);
    }
  }
  updateStatus(regenerate ? '🎲 Tung linh kiện ngẫu nhiên theo hướng mới...' : '💥 Đang bung nổ linh kiện...');
}

function toggleExplodeAssemble() {
  let totalDist = 0;
  for (const d of explodeData) {
    if (!d.anchor) totalDist += d.group.position.distanceTo(d.origPos);
  }
  if (totalDist > 2.0) {
    startAssemble();
  } else {
    startExplode(false);
  }
}

// ── Slider manual scrub ──
document.getElementById('explode-slider')?.addEventListener('input', (e) => {
  stopCinematic();
  animMode = null;
  const factor = parseInt(e.target.value) / 100;
  for (const d of explodeData) {
    if (d.anchor) continue;
    d.group.position.lerpVectors(d.origPos, d.origPos.clone().add(d.offset), factor);
    const q = new THREE.Quaternion().setFromAxisAngle(d.rotAxis, d.rotAngle * factor);
    d.group.quaternion.copy(d.origQuat).premultiply(q);
  }
  const label = document.getElementById('slider-label');
  if (label) label.textContent = `${e.target.value}%`;
  updateStatus(`Thủ công: ${e.target.value}%`);
});

// ── Highlight Material ──
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let highlightedGroup = null;
const hlMat = new THREE.MeshStandardMaterial({
  color: 0xe8572a, roughness: .3, metalness: .1, emissive: 0x441500, emissiveIntensity: .4
});
const savedMats = new Map();

function highlightPart(group, label) {
  if (highlightedGroup) {
    highlightedGroup.traverse(c => { if (c.isMesh && savedMats.has(c)) c.material = savedMats.get(c); });
    savedMats.clear();
    highlightedGroup = null;
  }
  if (group) {
    highlightedGroup = group;
    group.traverse(c => { if (c.isMesh) { savedMats.set(c, c.material); c.material = hlMat; } });
    updateStatus(`📌 ${label || group.name}`);
  }
}

// ── DRAG & DROP IN 3D SPACE ──
let isDragging = false;
let draggedEntry = null;
let dragPointerStart = { x: 0, y: 0 };
let hasMovedPointer = false;
const dragPlane = new THREE.Plane();
const planeIntersect = new THREE.Vector3();
const dragOffset = new THREE.Vector3();
const camDir = new THREE.Vector3();

function getPartFromObject(obj) {
  while (obj.parent && obj.parent !== model) obj = obj.parent;
  return obj.userData.part ? obj : null;
}

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || isCinematic) return; // Left click only, not while cinematic
  dragPointerStart = { x: e.clientX, y: e.clientY };
  hasMovedPointer = false;

  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(model.children, true);

  if (hits.length > 0) {
    const partGroup = getPartFromObject(hits[0].object);
    if (partGroup) {
      const entry = explodeData.find(d => d.group === partGroup);
      if (entry) {
        if (entry.anchor) {
          highlightPart(partGroup, entry.label + ' (Đế cố định làm mốc)');
          return;
        }
        isDragging = true;
        draggedEntry = entry;
        controls.enabled = false;
        animMode = null;

        camera.getWorldDirection(camDir);
        dragPlane.setFromNormalAndCoplanarPoint(camDir.negate(), partGroup.position);
        if (raycaster.ray.intersectPlane(dragPlane, planeIntersect)) {
          dragOffset.copy(planeIntersect).sub(partGroup.position);
        }
        renderer.domElement.style.cursor = 'grabbing';
      }
    }
  }
});

renderer.domElement.addEventListener('pointermove', (e) => {
  if (isCinematic) return;
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;

  if (isDragging && draggedEntry) {
    if (Math.hypot(e.clientX - dragPointerStart.x, e.clientY - dragPointerStart.y) > 4) {
      hasMovedPointer = true;
    }
    raycaster.setFromCamera(mouse, camera);
    if (raycaster.ray.intersectPlane(dragPlane, planeIntersect)) {
      const newPos = planeIntersect.sub(dragOffset);
      if (newPos.y < 0.05) newPos.y = 0.05; // keep above floor
      draggedEntry.group.position.copy(newPos);
      updateStatus(`🖐️ Đang kéo: ${draggedEntry.label}`);
    }
    return;
  }

  // Hover cursor feedback
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(model.children, true);
  if (hits.length > 0) {
    const partGroup = getPartFromObject(hits[0].object);
    if (partGroup) {
      const entry = explodeData.find(d => d.group === partGroup);
      renderer.domElement.style.cursor = (entry && !entry.anchor) ? 'grab' : 'pointer';
      return;
    }
  }
  renderer.domElement.style.cursor = 'default';
});

window.addEventListener('pointerup', () => {
  if (isDragging && draggedEntry) {
    controls.enabled = true;
    renderer.domElement.style.cursor = 'grab';
    if (hasMovedPointer) {
      updateStatus(`📍 Đã thả "${draggedEntry.label}" tới chỗ này • Bấm "Lắp lại" để bay về khớp!`);
      updateSlider(50);
    } else {
      highlightPart(draggedEntry.group, draggedEntry.label);
    }
    isDragging = false;
    draggedEntry = null;
  }
});

// ════════════════════════════════════════════════════════
//  CINEMATIC DIRECTOR & VIDEO RECORDER
// ════════════════════════════════════════════════════════
let isCinematic = false;
let cineTime = 0;
const CINE_TOTAL = 20.2;
let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];

// Specific references for screw animation & camera
const knobEntry = explodeData.find(d => d.group.name === 'lower_knob');
const cineCamPos = new THREE.Vector3();
const cineCamTarget = new THREE.Vector3();
const cineShotA = { position: new THREE.Vector3(), target: new THREE.Vector3() };
const cineShotB = { position: new THREE.Vector3(), target: new THREE.Vector3() };

// Directions are unitless. Targets and distances are rebuilt from current
// world-space bounds so every shot follows PRODUCT_ROOT and moving parts.
const CINE_DIR_FRONT = new THREE.Vector3(0.08, 0.10, 1).normalize();
const CINE_DIR_KNOB_WIDE = new THREE.Vector3(0.72, 0.20, 1).normalize();
const CINE_DIR_KNOB_CLOSE = new THREE.Vector3(1, 0.10, 0.48).normalize();
const CINE_DIR_WIDE = new THREE.Vector3(0.82, 0.34, 1).normalize();
const CINE_DIR_SWEEP_LEFT = new THREE.Vector3(-0.75, 0.48, 1).normalize();
const CINE_DIR_SWEEP_REAR = new THREE.Vector3(-1, 0.28, -0.62).normalize();

function getCinematicShot(subject, viewDir, margin = 0.82, distanceScale = 1, out = cineShotA) {
  PRODUCT_ROOT.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(subject || PRODUCT_ROOT);
  box.getCenter(out.target);
  const dir = viewDir.clone().normalize();
  const distance = computeExactFitDistance(box, camera, dir, margin) * distanceScale;
  out.position.copy(out.target).addScaledVector(dir, distance);
  return out;
}

function blendCinematicShots(from, to, t) {
  cineCamPos.lerpVectors(from.position, to.position, t);
  cineCamTarget.lerpVectors(from.target, to.target, t);
}

function setCinematicRootShotBetween(fromDir, toDir, t, margin = 0.76, distanceScale = 1.08) {
  const dir = fromDir.clone().lerp(toDir, t).normalize();
  const shot = getCinematicShot(PRODUCT_ROOT, dir, margin, distanceScale);
  cineCamPos.copy(shot.position);
  cineCamTarget.copy(shot.target);
}

function startCinematic(recordVideo = false) {
  // Reset any drag/highlight/state
  if (highlightedGroup) {
    highlightedGroup.traverse(c => { if (c.isMesh && savedMats.has(c)) c.material = savedMats.get(c); });
    savedMats.clear();
    highlightedGroup = null;
  }
  animMode = null;
  resetAllPartsToAssembled();
  model.position.set(0, 0, 0);
  model.rotation.set(0, 0, 0);

  // Activate cinematic visuals
  setupCinematicVisuals();

  // Build the opening shot from the current assembled world-space bounds.
  const openingShot = getCinematicShot(PRODUCT_ROOT, CINE_DIR_FRONT, 0.82, 1);
  camera.position.copy(openingShot.position);
  controls.target.copy(openingShot.target);
  camera.lookAt(controls.target);
  controls.enabled = false;

  cineTime = 0;
  isCinematic = true;
  isRecording = recordVideo;

  const bar = document.getElementById('cine-bar');
  if (bar) bar.style.display = 'block';
  const fill = document.getElementById('cine-fill');
  if (fill) fill.style.width = '0%';

  if (recordVideo) {
    recordedChunks = [];
    try {
      const stream = renderer.domElement.captureStream(60);
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';

      mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 16000000 });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `phone-stand-cinematic-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 150);
        updateStatus('🎥 Video đã được tải về máy thành công!');
      };
      mediaRecorder.start();
      updateStatus('🔴 Đang ghi hình phim Cinematic 60fps...');
    } catch (err) {
      console.warn('MediaRecorder error:', err);
      updateStatus('⚠️ Trình duyệt chưa hỗ trợ MediaRecorder canvas, đang phát xem trước...');
    }
  } else {
    updateStatus('🎬 Bắt đầu phân cảnh Cinematic...');
  }
}

function stopCinematic() {
  if (!isCinematic) return;
  isCinematic = false;
  controls.enabled = true;
  if (typeof clearAllPartLockFlashes === 'function') clearAllPartLockFlashes();
  if (typeof assemblyScan !== 'undefined') assemblyScan.visible = false;
  if (typeof highTechTrail !== 'undefined') highTechTrail.visible = false;
  if (typeof setHighTechRim === 'function') setHighTechRim(0);
  model.position.set(0, 0, 0);
  model.rotation.set(0, 0, 0);
  if (typeof resetImpactShake === 'function') resetImpactShake();
  teardownCinematicVisuals();
  fitCameraToObject(true, false);

  const bar = document.getElementById('cine-bar');
  if (bar) bar.style.display = 'none';

  if (isRecording && mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    isRecording = false;
  }
}

function updateCinematicTimeline(dt) {
  cineTime += dt;
  const progress = Math.min(1, cineTime / CINE_TOTAL);
  const fill = document.getElementById('cine-fill');
  if (fill) fill.style.width = (progress * 100) + '%';

  // ── PHASE 1: [0.0s - 2.0s] Tĩnh lặng (Stillness) ──
  if (cineTime < 2.0) {
    model.position.set(0, 0, 0);
    model.rotation.set(0, 0, 0);
    const opening = getCinematicShot(PRODUCT_ROOT, CINE_DIR_FRONT, 0.82, 1);
    cineCamPos.copy(opening.position);
    cineCamTarget.copy(opening.target);
    updateStatus('🎬 [Phân cảnh 1] Không gian tĩnh lặng... Mọi thứ bình thường.');
    updateSlider(0);
  }
  // ── PHASE 2: [2.0s - 4.5s] Rung nhẹ bất thường (Micro Tremor / Tension) ──
  else if (cineTime < 4.5) {
    const u = (cineTime - 2.0) / 2.5; // 0 to 1
    // High frequency subtle shudder
    const tremorAmp = Math.sin(u * Math.PI) * 0.026;
    model.position.x = (Math.sin(cineTime * 55) + (Math.random() - 0.5) * 0.6) * tremorAmp;
    model.position.z = (Math.cos(cineTime * 48) + (Math.random() - 0.5) * 0.6) * tremorAmp;
    model.rotation.z = Math.sin(cineTime * 40) * tremorAmp * 0.25;

    const opening = getCinematicShot(PRODUCT_ROOT, CINE_DIR_FRONT, 0.82, 1, cineShotA);
    const detail = getCinematicShot(knobEntry?.group || PRODUCT_ROOT, CINE_DIR_KNOB_WIDE, 0.68, 2.2, cineShotB);
    blendCinematicShots(opening, detail, u * u);

    updateStatus('🎬 [Phân cảnh 2] Sản phẩm bắt đầu rung rất nhẹ... Có gì đó bất thường bên trong!');
  }
  // ── PHASE 3: [4.5s - 9.0s] Con ốc ở khớp từ từ tự xoay lỏng (Creepy Slow Unscrewing) ──
  else if (cineTime < 9.0) {
    const u = (cineTime - 4.5) / 4.5; // 0 to 1
    model.position.set(0, 0, 0);
    model.rotation.set(0, 0, 0);

    const smoothU = u * u * (3 - 2 * u);

    // Screw slowly rotates counter-clockwise and translates outward
    if (knobEntry) {
      const unscrewRot = smoothU * Math.PI * 4; // 2 full slow eerie turns
      const unscrewDist = smoothU * 0.45;       // slides out by 0.45 along +X
      knobEntry.group.position.x = knobEntry.origPos.x + unscrewDist;
      knobEntry.group.rotation.x = knobEntry.origRot.x - unscrewRot;
      // Micro creak vibration
      knobEntry.group.position.y = knobEntry.origPos.y + Math.sin(cineTime * 32) * 0.004 * (1 - smoothU);
    }

    const detailWide = getCinematicShot(knobEntry?.group || PRODUCT_ROOT, CINE_DIR_KNOB_WIDE, 0.68, 2.2, cineShotA);
    const detailClose = getCinematicShot(knobEntry?.group || PRODUCT_ROOT, CINE_DIR_KNOB_CLOSE, 0.62, 1.45, cineShotB);
    blendCinematicShots(detailWide, detailClose, smoothU);

    updateStatus('🎬 [Phân cảnh 3] Con ốc ở khớp từ từ tự xoay lỏng ra... Chậm rãi rợn người...');
    updateSlider(Math.round(u * 15));
  }
  // ── PHASE 4: [9.0s - 11.5s] Camera giật lùi nhanh & Nổ tung Exploded View ──
  else if (cineTime < 11.5) {
    const u = (cineTime - 9.0) / 2.5; // 0 to 1
    const pullBackEase = 1 - Math.pow(1 - u, 4); // fast snap recoil

    // Explode all parts outward
    const explodeEase = easeOutBack(Math.min(1, u * 1.12));
    for (const d of explodeData) {
      if (d.anchor) continue;
      d.group.position.set(
        d.origPos.x + d.offset.x * explodeEase,
        d.origPos.y + d.offset.y * explodeEase,
        d.origPos.z + d.offset.z * explodeEase
      );
      const q = new THREE.Quaternion().setFromAxisAngle(d.rotAxis, d.rotAngle * explodeEase);
      d.group.quaternion.copy(d.origQuat).premultiply(q);
    }

    const detail = getCinematicShot(knobEntry?.group || PRODUCT_ROOT, CINE_DIR_KNOB_CLOSE, 0.62, 1.45, cineShotA);
    const wide = getCinematicShot(PRODUCT_ROOT, CINE_DIR_WIDE, 0.76, 1.08, cineShotB);
    blendCinematicShots(detail, wide, pullBackEase);

    if (cineTime < 9.6) {
      const shock = (1 - (cineTime - 9.0) / 0.6) * wide.position.distanceTo(wide.target) * 0.012;
      cineCamPos.x += (Math.random() - 0.5) * shock;
      cineCamPos.y += (Math.random() - 0.5) * shock;
    }

    updateStatus('🎬 [Phân cảnh 4] Camera giật lùi nhanh — Toàn bộ linh kiện bung nổ exploded view!');
    updateSlider(Math.round(Math.min(100, explodeEase * 100)));
  }
  // ── PHASE 5: [11.5s - 15.5s] Camera đổi góc lướt qua các chi tiết lơ lửng ──
  else if (cineTime < 15.5) {
    const u = (cineTime - 11.5) / 4.0; // 0 to 1

    // Zero-gravity subtle floating motion
    for (let i = 0; i < explodeData.length; i++) {
      const d = explodeData[i];
      if (d.anchor) continue;
      const bob = Math.sin(cineTime * 2.2 + i * 0.75) * 0.10;
      d.group.position.y = (d.origPos.y + d.offset.y) + bob;
    }

    // Cinematic multi-angle sweep, fitted to the live exploded bounds.
    if (u < 0.5) {
      const segU = u / 0.5;
      setCinematicRootShotBetween(CINE_DIR_WIDE, CINE_DIR_SWEEP_LEFT, segU);
    } else {
      const segU = (u - 0.5) / 0.5;
      setCinematicRootShotBetween(CINE_DIR_SWEEP_LEFT, CINE_DIR_SWEEP_REAR, segU);
    }

    updateStatus('🎬 [Phân cảnh 5] Camera đổi góc lướt qua các chi tiết đang trôi nổi lơ lửng...');
    updateSlider(100);
  }
  // ── PHASE 6: [15.5s - 18.5s] Đảo chiều & Toàn bộ linh kiện ráp trở lại ──
  else if (cineTime < 18.5) {
    const u = (cineTime - 15.5) / 3.0; // 0 to 1
    const assembleEase = easeOutBack(Math.min(1, u));

    for (const d of explodeData) {
      if (d.anchor) continue;
      const expPos = d.origPos.clone().add(d.offset);
      d.group.position.lerpVectors(expPos, d.origPos, assembleEase);

      const q = new THREE.Quaternion().setFromAxisAngle(d.rotAxis, d.rotAngle * (1 - assembleEase));
      d.group.quaternion.copy(d.origQuat).premultiply(q);
    }

    // The knob screws back in, leaving tiny fraction for final snap
    if (knobEntry) {
      const knobRemaining = (1 - assembleEase);
      knobEntry.group.position.x = knobEntry.origPos.x + knobRemaining * 0.45;
      knobEntry.group.rotation.x = knobEntry.origRot.x - knobRemaining * Math.PI * 4;
    }

    setCinematicRootShotBetween(CINE_DIR_SWEEP_REAR, CINE_DIR_FRONT, u, 0.78, 1.08);

    updateStatus('🎬 [Phân cảnh 6] Linh kiện đảo chiều — Từng chi tiết tự ráp trở lại khớp cũ...');
    updateSlider(Math.round((1 - assembleEase) * 100));
  }
  // ── PHASE 7: [18.5s - 20.2s] Con ốc cuối xoay khít & Rung giật chốt hạ! ──
  else if (cineTime < 20.2) {
    const shudderT = cineTime - 18.5;

    // Con ốc khóa cứng hoàn toàn vào khớp
    if (knobEntry) {
      knobEntry.group.position.copy(knobEntry.origPos);
      knobEntry.group.rotation.copy(knobEntry.origRot);
    }
    for (const d of explodeData) {
      d.group.position.copy(d.origPos);
      d.group.quaternion.copy(d.origQuat);
    }

    const opening = getCinematicShot(PRODUCT_ROOT, CINE_DIR_FRONT, 0.82, 1);
    cineCamPos.copy(opening.position);
    cineCamTarget.copy(opening.target);

    // Mechanical snap shudder
    if (shudderT < 0.5) {
      const damp = Math.exp(-shudderT * 10) * Math.sin(shudderT * 50) * 0.055;
      model.position.y = damp;
      model.rotation.z = damp * 0.35;
      cineCamPos.y += damp * 0.6;
    } else {
      model.position.set(0, 0, 0);
      model.rotation.set(0, 0, 0);
    }

    updateStatus('🎬 [Phân cảnh 7] Con ốc cuối xoay chặt — Cú rung giật chốt hạ!');
    updateSlider(0);
  }
  // ── FINISHED ──
  else {
    stopCinematic();
    resetAllPartsToAssembled();
    fitCameraToObject(true, false);
    updateStatus('🎬 [Hoàn thành] Đã lắp xong hoàn chỉnh — Sản phẩm trở lại trạng thái ban đầu!');
    return;
  }

  // APPLY CAMERA ORIENTATION EXPLICITLY EVERY FRAME
  camera.position.copy(cineCamPos);
  controls.target.copy(cineCamTarget);
  camera.lookAt(cineCamTarget);
}

// ── Buttons ──
// High-tech sequential assembly. This only animates existing part groups.
const ASSEMBLY_TOTAL = 24.0;
const assemblyByName = new Map(explodeData.map(d => [d.group.name, d]));
const av = (x, y, z) => new THREE.Vector3(x, y, z);
const ASSEMBLY_STAGES = [
  {start:0,end:3,status:'[1/7] Khóa cụm chân đế & ổ cắm...',dir:av(.65,.16,1),margin:.72,dist:1.24,parts:[['base_shell',av(-5.8,.12,1),'slide'],['mast_socket',av(0,3.4,0),'drop']]},
  {start:3,end:6,status:'[2/7] Khớp trụ chịu lực chính & vòng chặn...',dir:av(.8,.22,1),margin:.71,dist:1.22,parts:[['mast_tube',av(0,5.8,0),'drop'],['mast_seam',av(-2.8,.15,0),'slide']]},
  {start:6,end:9,status:'[3/7] Lắp bản lề dưới, trục & siết núm khóa...',dir:av(1,.12,.48),margin:.65,dist:1.82,parts:[['lower_barrel',av(-3.4,0,0),'slide'],['lower_axle',av(3.5,0,0),'slide'],['lower_knob',av(3.2,0,0),'screw']]},
  {start:9,end:12.2,status:'[4/7] Hạ tay đòn, khóa khớp trên & cần gạt...',dir:av(.78,.28,1),margin:.67,dist:1.55,parts:[['upper_arm',av(0,4.5,-.6),'drop'],['upper_barrel',av(-3,.3,0),'slide'],['upper_axle',av(3,.3,0),'slide'],['locking_lever',av(.2,3.2,-.3),'drop']]},
  {start:12.2,end:15.5,status:'[5/7] Căn tâm khớp cầu & siết vòng ren...',dir:av(.72,.16,1),margin:.63,dist:1.58,parts:[['ball_housing',av(0,3.2,-1.5),'drop'],['ball_joint',av(0,2.7,.5),'drop'],['ball_stem',av(0,2.8,.7),'drop'],['collar_core',av(0,0,3),'screw'],['collar_ribs',av(0,0,3.4),'screw']]},
  {start:15.5,end:18,status:'[6/7] Ép tấm lưng & đệm cao su vào cụm cầu...',dir:av(.58,.05,1),margin:.65,dist:1.55,parts:[['backplate',av(0,.3,3.5),'slide'],['rubber_pad',av(0,0,3.8),'slide']]},
  {start:18,end:21.4,status:'[7/7] Nạp ray trượt & khóa cặp ngàm chính xác...',dir:av(.55,.08,1),margin:.66,dist:1.48,parts:[['fixed_jaw_body',av(-4,0,.2),'slide'],['fixed_jaw_hook',av(-3.4,0,.4),'slide'],['sliding_rail',av(4,0,0),'slide'],['sliding_jaw_body',av(4.8,0,.2),'slide'],['sliding_jaw_hook',av(4.3,0,.4),'slide']]},
  {start:21.4,end:24,status:'[SYSTEM READY] Lắp ráp hoàn tất • Hiệu chuẩn quang học...',dir:av(1,.58,1.32),margin:.84,dist:1.02,parts:[]}
];
const assemblyScanMat=new THREE.MeshBasicMaterial({color:0xb9edff,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
const assemblyScan=new THREE.Mesh(new THREE.PlaneGeometry(5.6,.035),assemblyScanMat);assemblyScan.visible=false;assemblyScan.renderOrder=9;scene.add(assemblyScan);
function aClamp(t){return Math.max(0,Math.min(1,t));} function aEase(t){return 1-Math.pow(1-t,3);} function aExpo(t){return t>=1?1:1-Math.pow(2,-10*t);}
function assemblyBox(subjects){PRODUCT_ROOT.updateWorldMatrix(true,true);const b=new THREE.Box3();for(const s of subjects)b.expandByObject(s);return b.isEmpty()?new THREE.Box3().setFromObject(PRODUCT_ROOT):b;}
function assemblyShot(subjects,dir,margin,scale,out){const box=assemblyBox(subjects);box.getCenter(out.target);const d=dir.clone().normalize();out.position.copy(out.target).addScaledVector(d,computeExactFitDistance(box,camera,d,margin)*scale);return out;}
// Lock confirmation is emitted by the seated part itself, never by a billboard.
// Temporary clones are disposed and the exact original material objects are restored.
const PART_LOCK_FLASH_SECONDS=.26;
const partLockFlashCache=new Map();
let partLockFlashSeen=new Set();
function flashMaterial(source,intensity){const material=source.clone();if(material.emissive?.isColor)material.emissive.set(0x55cfff);else material.emissive=new THREE.Color(0x55cfff);material.emissiveIntensity=intensity;material.needsUpdate=true;return material;}
function flashPartLock(group,intensity=1){partLockFlashSeen.add(group);group.traverse(mesh=>{if(!mesh.isMesh)return;let cached=partLockFlashCache.get(mesh);if(!cached){const original=mesh.material,flashed=Array.isArray(original)?original.map(mat=>flashMaterial(mat,intensity)):flashMaterial(original,intensity);cached={group,original,flashed};partLockFlashCache.set(mesh,cached);mesh.material=flashed;}const materials=Array.isArray(cached.flashed)?cached.flashed:[cached.flashed];for(const material of materials)material.emissiveIntensity=intensity;});}
function clearPartLockFlash(group){for(const[mesh,cached]of partLockFlashCache){if(cached.group!==group)continue;mesh.material=cached.original;const materials=Array.isArray(cached.flashed)?cached.flashed:[cached.flashed];for(const material of materials)material.dispose();partLockFlashCache.delete(mesh);}}
function beginPartLockFlashFrame(){partLockFlashSeen=new Set();}
function endPartLockFlashFrame(){const activeGroups=new Set([...partLockFlashCache.values()].map(cached=>cached.group));for(const group of activeGroups)if(!partLockFlashSeen.has(group))clearPartLockFlash(group);}
function clearAllPartLockFlashes(){const groups=new Set([...partLockFlashCache.values()].map(cached=>cached.group));for(const group of groups)clearPartLockFlash(group);partLockFlashSeen.clear();}
function partLockIntensity(elapsed){const p=aClamp(elapsed/PART_LOCK_FLASH_SECONDS);return Math.pow(Math.sin(p*Math.PI),.72)*Math.exp(-p*1.15)*2.35;}
function parkAssemblyParts(){for(const stage of ASSEMBLY_STAGES)for(const [name,offset,motion]of stage.parts){const d=assemblyByName.get(name);d.group.position.copy(d.origPos).add(offset);d.group.quaternion.copy(d.origQuat);const axis=motion==='screw'?av(1,0,0):av(0,1,0);d.group.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis,motion==='screw'?Math.PI*3:.1));}}
function assemblePart(d,offset,motion,t){const travel=aExpo(aClamp(t/.82));d.group.position.lerpVectors(d.origPos.clone().add(offset),d.origPos,travel);const axis=motion==='screw'?av(1,0,0):av(0,1,0),angle=(1-travel)*(motion==='screw'?Math.PI*3:.1);d.group.quaternion.copy(d.origQuat).premultiply(new THREE.Quaternion().setFromAxisAngle(axis,angle));if(t>.82){const s=(t-.82)/.18,sh=Math.sin(s*Math.PI*4)*Math.exp(-s*5)*.02;d.group.position.copy(d.origPos).addScaledVector(offset.clone().normalize(),sh);}}
function legacyStartHighTechAssembly(recordVideo=false){startCinematic(recordVideo);cineTime=0;parkAssemblyParts();updateStatus('⚙️ Khởi tạo chu trình lắp ráp chính xác...');}
function legacyUpdateHighTechAssembly(dt=0){
  cineTime=Math.min(ASSEMBLY_TOTAL,cineTime+dt);const progress=cineTime/ASSEMBLY_TOTAL,fill=document.getElementById('cine-fill');if(fill)fill.style.width=(progress*100)+'%';
  const index=ASSEMBLY_STAGES.findIndex(s=>cineTime>=s.start&&cineTime<s.end);if(index<0){stopCinematic();resetAllPartsToAssembled();fitCameraToObject(true,false);updateStatus('✅ [SYSTEM READY] 23 linh kiện đã khóa khớp • Sản phẩm sẵn sàng.');return;}
  const stage=ASSEMBLY_STAGES[index],u=aClamp((cineTime-stage.start)/(stage.end-stage.start));parkAssemblyParts();
  for(let s=0;s<ASSEMBLY_STAGES.length;s++)for(const[name]of ASSEMBLY_STAGES[s].parts)assemblyByName.get(name).group.visible=s<=index;
  for(let s=0;s<index;s++)for(const[name]of ASSEMBLY_STAGES[s].parts){const d=assemblyByName.get(name);d.group.position.copy(d.origPos);d.group.quaternion.copy(d.origQuat);}for(let i=0;i<stage.parts.length;i++){const[name,offset,motion]=stage.parts[i],d=assemblyByName.get(name),pt=aClamp((u-i*(.62/Math.max(1,stage.parts.length)))/.38);assemblePart(d,offset,motion,pt);}
  const subjects=stage.parts.length?stage.parts.map(p=>assemblyByName.get(p[0]).group):[PRODUCT_ROOT],shot=assemblyShot(subjects,stage.dir,stage.margin,stage.dist,cineShotB);if(index){const prev=ASSEMBLY_STAGES[index-1],ps=prev.parts.length?prev.parts.map(p=>assemblyByName.get(p[0]).group):[PRODUCT_ROOT];assemblyShot(ps,prev.dir,prev.margin,prev.dist,cineShotA);blendCinematicShots(cineShotA,shot,aEase(aClamp(u/.28)));}else{cineCamPos.copy(shot.position);cineCamTarget.copy(shot.target);}
  beginPartLockFlashFrame();for(let i=0;i<stage.parts.length;i++){const end=.12+(i+1)*(.80/stage.parts.length),elapsed=(u-end)*(stage.end-stage.start);if(elapsed>=0&&elapsed<PART_LOCK_FLASH_SECONDS)flashPartLock(assemblyByName.get(stage.parts[i][0]).group,partLockIntensity(elapsed));}endPartLockFlashFrame();
  assemblyScan.visible=index===7;if(assemblyScan.visible){assemblyScan.position.set(-.16,.18+aEase(u)*8.05,2.38);assemblyScan.quaternion.copy(camera.quaternion);assemblyScanMat.opacity=Math.sin(u*Math.PI)*.42;assemblyShot([PRODUCT_ROOT],av(-.35,.32,1),.78,1.12,cineShotA);assemblyShot([PRODUCT_ROOT],stage.dir,stage.margin,stage.dist,cineShotB);blendCinematicShots(cineShotA,cineShotB,aEase(u));}
  updateStatus(stage.status);updateSlider(progress*100);camera.position.copy(cineCamPos);controls.target.copy(cineCamTarget);camera.lookAt(cineCamTarget);
}
function legacySeekHighTechAssembly(seconds){if(!isCinematic)legacyStartHighTechAssembly(false);cineTime=Math.max(0,Math.min(ASSEMBLY_TOTAL-.001,seconds));legacyUpdateHighTechAssembly(0);}

// ─── IRON-MAN STYLE 15.5 SECOND ASSEMBLY DIRECTOR ───
const HIGH_TECH_TOTAL = 15.5;
const HIGH_TECH_STAGES = [
  {start:3.50,end:4.72,status:'[1/7] Khóa cụm chân đế & ổ cắm...',parts:[['base_shell','slide'],['mast_socket','drop']]},
  {start:4.72,end:5.94,status:'[2/7] Hạ trụ chịu lực & khóa đường seam...',parts:[['mast_tube','drop'],['mast_seam','slide']]},
  {start:5.94,end:7.30,status:'[3/7] Ghép khớp khuỷu dưới & siết núm ren...',parts:[['lower_barrel','slide'],['lower_axle','slide'],['lower_knob','screw']]},
  {start:7.30,end:8.82,status:'[4/7] Khóa tay đòn, khớp trên & cần gạt...',parts:[['upper_arm','drop'],['upper_barrel','slide'],['upper_axle','slide'],['locking_lever','lever']]},
  {start:8.82,end:10.62,status:'[5/7] Nạp khớp cầu & siết vòng cổ ren...',parts:[['ball_housing','drop'],['ball_joint','drop'],['ball_stem','drop'],['collar_core','screw'],['collar_ribs','screw']]},
  {start:10.62,end:11.82,status:'[6/7] Ép tấm lưng kẹp & đệm cao su...',parts:[['backplate','slide'],['rubber_pad','slide']]},
  {start:11.82,end:13.50,status:'[7/7] Nạp ray trượt & đóng cặp ngàm...',parts:[['fixed_jaw_body','slide'],['fixed_jaw_hook','slide'],['sliding_rail','slide'],['sliding_jaw_body','slide'],['sliding_jaw_hook','slide']]}
];
const highTechOrder=HIGH_TECH_STAGES.flatMap(stage=>stage.parts.map(part=>part[0]));
const highTechPark=new Map();
const highTechPartCenters=new Map();
for(const name of highTechOrder){const d=assemblyByName.get(name);highTechPartCenters.set(name,new THREE.Box3().setFromObject(d.group).getCenter(new THREE.Vector3()));}
for(let i=0;i<highTechOrder.length;i++){
  const d=assemblyByName.get(highTechOrder[i]),golden=i*2.399963,ring=7.5+(i%5)*.52;
  const desiredCenter=av(Math.cos(golden)*ring,.15+(i/22)*10.5+Math.sin(i*1.73)*1.1,Math.sin(golden)*(6.2+(i%4)*.55));
  highTechPark.set(d.group.name,d.origPos.clone().add(desiredCenter).sub(highTechPartCenters.get(d.group.name)));
}
function highTechPartCenter(d,out){return out.copy(highTechPartCenters.get(d.group.name)).add(d.group.position).sub(d.origPos);}

// One subtle additive tail follows the currently flying component. It is a scene helper,
// so PRODUCT_ROOT remains exactly the original 23 component groups.
const highTechTrailMat=new THREE.LineBasicMaterial({color:0x65d9ff,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
const highTechTrailPts=[av(0,0,0),av(0,0,0),av(0,0,0),av(0,0,0)];
const highTechTrail=new THREE.Line(new THREE.BufferGeometry().setFromPoints(highTechTrailPts),highTechTrailMat);
highTechTrail.visible=false;highTechTrail.frustumCulled=false;highTechTrail.renderOrder=9;scene.add(highTechTrail);

// Zero-file synthesized mechanical audio. Context creation/resume happens from the start gesture.
let highTechAudio=null,highTechHum=null;
function getHighTechAudio(){if(!highTechAudio){const AC=window.AudioContext||window.webkitAudioContext;if(AC)highTechAudio=new AC();}if(highTechAudio?.state==='suspended')highTechAudio.resume();return highTechAudio;}
function highTechNoise(ctx,duration=.08){const b=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/a.length,2);return b;}
function stopTremorSound(){if(!highTechHum)return;for(const n of highTechHum)try{n.stop();}catch{}highTechHum=null;}
function playTremorSound(){const c=getHighTechAudio();if(!c)return;stopTremorSound();const now=c.currentTime,sub=c.createOscillator(),trem=c.createOscillator(),lp=c.createBiquadFilter(),body=c.createGain(),depth=c.createGain();sub.type='sine';sub.frequency.setValueAtTime(50,now);sub.frequency.exponentialRampToValueAtTime(84,now+1.45);lp.type='lowpass';lp.frequency.value=135;lp.Q.value=.7;body.gain.setValueAtTime(.0001,now);body.gain.exponentialRampToValueAtTime(.09,now+.16);body.gain.setTargetAtTime(.055,now+.45,.3);body.gain.exponentialRampToValueAtTime(.0001,now+1.48);trem.type='sine';trem.frequency.value=7.2;depth.gain.value=.014;trem.connect(depth).connect(body.gain);sub.connect(lp).connect(body).connect(c.destination);sub.start(now);trem.start(now);sub.stop(now+1.5);trem.stop(now+1.5);highTechHum=[sub,trem];}
function playMetalImpact(pitch=1,delay=0,level=1){const c=getHighTechAudio();if(!c)return;const at=c.currentTime+delay,src=c.createBufferSource(),split=c.createGain(),master=c.createGain();src.buffer=highTechNoise(c,.029);master.gain.setValueAtTime(level,at);master.gain.exponentialRampToValueAtTime(.0001,at+.075);src.connect(split);for(const hz of [2200,4500]){const bp=c.createBiquadFilter(),g=c.createGain();bp.type='bandpass';bp.frequency.value=hz*pitch;bp.Q.value=hz===2200?9:11;g.gain.value=hz===2200?.13:.085;split.connect(bp).connect(g).connect(master);}master.connect(c.destination);const thump=c.createOscillator(),tg=c.createGain();thump.type='sine';thump.frequency.setValueAtTime(110*pitch,at);thump.frequency.exponentialRampToValueAtTime(45,at+.025);tg.gain.setValueAtTime(.045*level,at);tg.gain.exponentialRampToValueAtTime(.0001,at+.032);thump.connect(tg).connect(c.destination);src.start(at);thump.start(at);thump.stop(at+.035);}
function playExplodeSound(){const c=getHighTechAudio();if(!c)return;const now=c.currentTime;playMetalImpact(.72,0,1.25);const src=c.createBufferSource(),hp=c.createBiquadFilter(),lp=c.createBiquadFilter(),g=c.createGain();src.buffer=highTechNoise(c,.18);hp.type='highpass';hp.frequency.value=260;lp.type='lowpass';lp.frequency.setValueAtTime(2400,now);lp.frequency.exponentialRampToValueAtTime(620,now+.17);g.gain.setValueAtTime(.13,now);g.gain.exponentialRampToValueAtTime(.0001,now+.18);src.connect(hp).connect(lp).connect(g).connect(c.destination);src.start(now);}
function playSnapSound(pitch=1,delay=0,level=1){playMetalImpact(pitch,delay,level);}

// ── DIRECTIONAL IMPACT SHAKE (model-level recoil from part snaps) ──
let shakeEnergy = 0;
const shakeDir = new THREE.Vector3();
let shakeClock = 0;
function resetImpactShake() { shakeEnergy = 0; shakeDir.set(0, 0, 0); shakeClock = 0; }
function addImpactImpulse(dir, mag) {
  shakeDir.copy(dir);
  shakeEnergy = Math.min(0.06, shakeEnergy + mag);
  shakeClock = 0;
}
function updateImpactShake(dt) {
  if (shakeEnergy < 0.001) return;
  shakeClock += dt;
  const amp = shakeEnergy * Math.exp(-shakeClock * 10);
  const wave = Math.sin(shakeClock * 42);
  model.position.x += shakeDir.x * amp * wave;
  model.position.y += Math.abs(shakeDir.y) * amp * wave * 0.3;
  model.position.z += shakeDir.z * amp * wave;
  model.rotation.z += amp * wave * 0.35;
  shakeEnergy *= (1 - dt * 5);
  if (shakeEnergy < 0.001) shakeEnergy = 0;
}
function playFinalLockSound(){const c=getHighTechAudio();if(!c)return;playSnapSound(.72,0,1.25);playSnapSound(.94,.065,.95);const now=c.currentTime;[2860,4380,6120].forEach((frequency,i)=>{const o=c.createOscillator(),bp=c.createBiquadFilter(),g=c.createGain(),delay=.11+i*.018;o.type='sine';o.frequency.value=frequency;bp.type='bandpass';bp.frequency.value=frequency;bp.Q.value=10;g.gain.setValueAtTime(.0001,now+delay);g.gain.exponentialRampToValueAtTime(.018,now+.018+delay);g.gain.exponentialRampToValueAtTime(.0001,now+.55+delay);o.connect(bp).connect(g).connect(c.destination);o.start(now+delay);o.stop(now+.62+delay);});}

const highTechOriginalMaterials=new Map();
let highTechRimAmount=0;
function setHighTechRim(amount){
  highTechRimAmount=amount;
  PRODUCT_ROOT.traverse(mesh=>{if(!mesh.isMesh)return;if(!highTechOriginalMaterials.has(mesh))highTechOriginalMaterials.set(mesh,mesh.material);if(amount<=0){mesh.material=highTechOriginalMaterials.get(mesh);return;}const source=highTechOriginalMaterials.get(mesh),mat=source.clone();mat.emissive=new THREE.Color(0x55cfff);mat.emissiveIntensity=amount*1.35;if(mat.color)mat.color.lerp(new THREE.Color(0xb9efff),amount*.18);mesh.material=mat;});
  if(amount<=0)highTechOriginalMaterials.clear();
}
function parkHighTechParts(floatTime=0){for(const d of explodeData){const p=highTechPark.get(d.group.name),i=highTechOrder.indexOf(d.group.name);d.group.visible=true;d.group.position.copy(p);d.group.position.y+=Math.sin(floatTime*2.4+i*.83)*.09;d.group.position.x+=Math.sin(floatTime*1.1+i*1.37)*.055;d.group.position.z+=Math.cos(floatTime*0.9+i*1.61)*.055;d.group.quaternion.copy(d.origQuat);const axis=av(Math.sin(i),1,Math.cos(i)).normalize();d.group.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis,.25*Math.sin(floatTime*.8+i)));}}
function flyHighTechPart(d, motion, t) {
  const start = highTechPark.get(d.group.name);
  const flight = aClamp(t / .85);

  // Approach direction (park → assembled)
  const approachDir = d.origPos.clone().sub(start);
  const approachLen = approachDir.length();
  if (approachLen > 0.001) approachDir.divideScalar(approachLen);

  // Wind-up jerk-back then magnetic snap forward
  let travel;
  if (flight < 0.18) {
    // Jerk BACK: part moves away from target (wind-up)
    const backT = flight / 0.18;
    travel = -0.10 * Math.sin(backT * Math.PI * 0.5);
  } else {
    // Snap FORWARD: exponential acceleration into slot
    const fwdT = (flight - 0.18) / 0.82;
    travel = -0.10 * (1 - fwdT * fwdT) + aExpo(fwdT);
    travel = Math.min(1.0, travel);
  }

  d.group.position.lerpVectors(start, d.origPos, travel);

  // In-flight rotation
  let axis = av(0, 1, 0), turn = .12;
  if (motion === 'screw') { axis = av(1, 0, 0); turn = Math.PI * 5; }
  if (motion === 'lever') { axis = av(1, 0, 0); turn = Math.PI * .48; }
  d.group.quaternion.copy(d.origQuat).premultiply(
    new THREE.Quaternion().setFromAxisAngle(axis, (1 - Math.max(0, travel)) * turn)
  );

  // Impact phase: directional damped recoil + mechanical rattle
  if (t > .85) {
    const s = (t - .85) / .15;

    // Primary recoil: damped oscillation along approach direction
    const decay = Math.exp(-s * 4.5);
    const recoil = Math.sin(s * Math.PI * 6.5) * decay * 0.058;

    // Secondary high-freq mechanical rattle
    const rattle = Math.sin(s * Math.PI * 19) * Math.exp(-s * 12) * 0.009;

    d.group.position.copy(d.origPos);
    d.group.position.addScaledVector(approachDir, -(recoil + rattle));

    // Rotational wobble perpendicular to approach direction
    const perpAxis = new THREE.Vector3().crossVectors(approachDir, av(0, 1, 0));
    if (perpAxis.lengthSq() < 0.001) perpAxis.set(1, 0, 0);
    perpAxis.normalize();
    const wobble = Math.sin(s * Math.PI * 7.5) * decay * 0.038;
    d.group.quaternion.copy(d.origQuat).premultiply(
      new THREE.Quaternion().setFromAxisAngle(perpAxis, wobble)
    );
  }

  return flight;
}
const highTechCameraStartPos=new THREE.Vector3(),highTechCameraStartTarget=new THREE.Vector3();
const HIGH_TECH_CENTER=av(0,4.35,.35);
function aSmoother(t){t=aClamp(t);return t*t*t*(t*(t*6-15)+10);}
function frameHighTechAssembly(time){
  const rise=aSmoother((time-2.7)/10.4),dolly=aSmoother((time-3.15)/5.2);
  const finish=aSmoother((time-13.25)/2.15);
  const openingBlend=aSmoother(time/1.35);
  const target=HIGH_TECH_CENTER.clone();target.y+=.85*rise;

  // 360° orbit during assembly (replaces gentle sway)
  const orbitT=aClamp((time-2.5)/11.0);
  const orbitAngle=orbitT*Math.PI*2;
  const elevate=0.15+0.08*Math.sin(orbitT*Math.PI); // higher at back view
  const radius=THREE.MathUtils.lerp(29.0,22.0,dolly);

  const dir=av(Math.sin(orbitAngle),elevate,Math.cos(orbitAngle)).normalize();
  const heroDir=DEFAULT_3_4_DIR.clone().normalize();
  dir.lerp(heroDir,finish).normalize();

  const scriptedPos=target.clone().addScaledVector(dir,THREE.MathUtils.lerp(radius,15.5,finish));
  cineCamPos.lerpVectors(highTechCameraStartPos,scriptedPos,openingBlend);
  cineCamTarget.lerpVectors(highTechCameraStartTarget,target,openingBlend);
}
let highTechEvents=new Set(),lastHighTechTime=0;
function startHighTechAssembly(recordVideo=false){getHighTechAudio();highTechCameraStartPos.copy(camera.position);highTechCameraStartTarget.copy(controls.target);startCinematic(recordVideo);camera.position.copy(highTechCameraStartPos);controls.target.copy(highTechCameraStartTarget);camera.lookAt(controls.target);cineTime=0;lastHighTechTime=0;highTechEvents.clear();assemblyScan.visible=false;highTechTrail.visible=false;clearAllPartLockFlashes();setHighTechRim(0);resetAllPartsToAssembled();resetImpactShake();playTremorSound();updateStatus('⚡ [PHASE 1] Nạp năng lượng • Khóa ổn định 23 linh kiện...');}
function updateHighTechAssembly(dt=0){
  lastHighTechTime=cineTime;cineTime=Math.min(HIGH_TECH_TOTAL,cineTime+dt);const progress=cineTime/HIGH_TECH_TOTAL,fill=document.getElementById('cine-fill');if(fill)fill.style.width=(progress*100)+'%';
  beginPartLockFlashFrame();assemblyScan.visible=false;highTechTrail.visible=false;setHighTechRim(0);model.position.set(0,0,0);model.rotation.set(0,0,0);
  if(cineTime<1.5){resetAllPartsToAssembled();const amp=Math.sin(cineTime/1.5*Math.PI)*.018;model.position.x=Math.sin(cineTime*63)*amp;model.position.z=Math.cos(cineTime*57)*amp;model.rotation.z=Math.sin(cineTime*49)*amp*.22;updateStatus('⚡ [PHASE 1] Pre-activation • Lõi cơ khí đang tăng áp...');}
  else if(cineTime<3.5){const u=aClamp((cineTime-1.5)/2);if(!highTechEvents.has('explode')&&lastHighTechTime<1.5){highTechEvents.add('explode');stopTremorSound();playExplodeSound();addImpactImpulse(av(0,1,0),0.05);}for(let i=0;i<explodeData.length;i++){const d=explodeData[i],p=highTechPark.get(d.group.name),e=easeOutBack(aClamp(u*1.18));d.group.visible=true;d.group.position.lerpVectors(d.origPos,p,e);d.group.position.y+=Math.sin(cineTime*2.5+i)*.06*u;d.group.quaternion.copy(d.origQuat).premultiply(new THREE.Quaternion().setFromAxisAngle(d.rotAxis,d.rotAngle*.16*e));}updateStatus('💥 [PHASE 2] Zero-G release • 23 linh kiện đang lơ lửng...');}
  else if(cineTime<13.5){parkHighTechParts(cineTime);const index=HIGH_TECH_STAGES.findIndex(s=>cineTime>=s.start&&cineTime<s.end),stage=HIGH_TECH_STAGES[index],u=aClamp((cineTime-stage.start)/(stage.end-stage.start));for(let s=0;s<index;s++)for(const[name]of HIGH_TECH_STAGES[s].parts){const d=assemblyByName.get(name);d.group.position.copy(d.origPos);d.group.quaternion.copy(d.origQuat);}for(let i=0;i<stage.parts.length;i++){const[name,motion]=stage.parts[i],d=assemblyByName.get(name),slot=.62/Math.max(1,stage.parts.length),localStart=.03+i*slot,pt=aClamp((u-localStart)/.34),flight=flyHighTechPart(d,motion,pt),snapU=localStart+.34*.85,event=`snap-${index}-${i}`,snapTime=stage.start+(stage.end-stage.start)*snapU,flashElapsed=cineTime-snapTime;if(!highTechEvents.has(event)&&lastHighTechTime<snapTime&&cineTime>=snapTime){highTechEvents.add(event);playSnapSound(.88+(i%4)*.09);addImpactImpulse(av(0,0,0).subVectors(d.origPos,highTechPark.get(d.group.name)).normalize(),0.04);}if(flashElapsed>=0&&flashElapsed<PART_LOCK_FLASH_SECONDS)flashPartLock(d.group,partLockIntensity(flashElapsed));if(flight>0&&flight<.85){const now=highTechPartCenter(d,new THREE.Vector3()),back=highTechPartCenters.get(name).clone().add(highTechPark.get(name)).sub(d.origPos),fade=1-aClamp((flight-.70)/.15);highTechTrailPts[0].copy(now);highTechTrailPts[1].lerpVectors(now,back,.08);highTechTrailPts[2].lerpVectors(now,back,.17);highTechTrailPts[3].lerpVectors(now,back,.28);highTechTrail.geometry.setFromPoints(highTechTrailPts);highTechTrailMat.opacity=.5*fade;highTechTrail.visible=true;}}updateStatus(`⚙️ [PHASE 3] ${stage.status}`);}
  else if(cineTime<15.5){resetAllPartsToAssembled();const u=(cineTime-13.5)/2,shock=Math.sin(u*Math.PI*8)*Math.exp(-u*8)*.045;model.position.x=shock;model.rotation.z=shock*.28;if(!highTechEvents.has('final')){highTechEvents.add('final');playFinalLockSound();addImpactImpulse(av(0,-1,0),0.05);}endPartLockFlashFrame();setHighTechRim(Math.pow(Math.sin(Math.min(1,u/.72)*Math.PI),1.5));updateStatus(u<.75?'🔒 [PHASE 4] Khóa tổng thể • Xác nhận quang học...':'⚙️ [SYSTEM READY] 23 linh kiện đã khóa khớp • Hoàn thiện 100%');}
  else{setHighTechRim(0);stopCinematic();resetAllPartsToAssembled();fitCameraToObject(true,false);updateStatus('⚙️ [SYSTEM READY] 23 linh kiện đã khóa khớp • Hoàn thiện 100%');return;}
  endPartLockFlashFrame();updateImpactShake(dt);PRODUCT_ROOT.updateWorldMatrix(true,true);frameHighTechAssembly(cineTime);updateSlider(progress*100);camera.position.copy(cineCamPos);controls.target.copy(cineCamTarget);camera.lookAt(cineCamTarget);
}
function seekHighTechAssembly(seconds){if(!isCinematic)startHighTechAssembly(false);cineTime=Math.max(0,Math.min(HIGH_TECH_TOTAL-.001,seconds));lastHighTechTime=cineTime;updateHighTechAssembly(0);}
function freezeHighTechAssembly(seconds){seekHighTechAssembly(seconds);isCinematic=false;controls.enabled=false;}

document.getElementById('btn-explode')?.addEventListener('click', () => startExplode(false));
document.getElementById('btn-assemble')?.addEventListener('click', () => startAssemble());
document.getElementById('btn-random')?.addEventListener('click', () => startExplode(true));
document.getElementById('btn-toggle')?.addEventListener('click', toggleExplodeAssemble);
document.getElementById('btn-cinematic')?.addEventListener('click', () => startHighTechAssembly(false));
document.getElementById('btn-record')?.addEventListener('click', () => startHighTechAssembly(true));

// ── Keyboard ──
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'e' || e.key === 'E') startExplode(false);
  if (e.key === 'a' || e.key === 'A') startAssemble();
  if (e.key === 'r' || e.key === 'R') startExplode(true);
  if (e.key === 'c' || e.key === 'C') startHighTechAssembly(false);
  if (e.key === 'v' || e.key === 'V') startHighTechAssembly(true);
  if (e.key === ' ') { e.preventDefault(); toggleExplodeAssemble(); }
});

// Initial status
updateStatus(`${partsList.length} linh kiện • Kéo thả tự do • Bấm "⚙️ Lắp ráp công nghệ" để xem!`);

// ─── Animation loop ───
// Apply startup framing only after all 23 assembled parts and their animation state exist.
// No later startup code writes camera.position, controls.target, or camera.lookAt.
fitCameraToObject(true, false);

let lastTime = performance.now();
renderer.setAnimationLoop(() => {
  const now = performance.now();
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;

  // Cinematic sequence active
  if (isCinematic) {
    updateHighTechAssembly(dt);
  }
  // Standard explode/assemble transition
  else if (animMode) {
    animT += dt * ANIM_SPEED;
    const progress = Math.min(1, animT);
    const ease = easeOutBack(progress);

    for (const d of explodeData) {
      d.group.position.lerpVectors(d.startPos, d.targetPos, ease);
      d.group.quaternion.slerpQuaternions(d.startQuat, d.targetQuat, ease);
    }

    // Dynamic framing during explode / assemble: smoothly adapts to expanding/contracting bounds
    fitCameraToObject(false, true);

    const sliderVal = animMode === 'assemble' ? (1 - progress) * 100 : progress * 100;
    updateSlider(sliderVal);

    if (progress >= 1) {
      for (const d of explodeData) {
        d.group.position.copy(d.targetPos);
        d.group.quaternion.copy(d.targetQuat);
      }
      fitCameraToObject(false, false);
      if (animMode === 'assemble') {
        updateStatus('🔧 Đã lắp xong hoàn chỉnh — 23 linh kiện về đúng vị trí!');
        updateSlider(0);
      } else {
        updateStatus('💥 Đã bung tỏa — bạn có thể nắm kéo linh kiện tới bất kỳ đâu!');
        updateSlider(100);
      }
      animMode = null;
    }
  }

  if (!isCinematic) {
    controls.update();
  }
  renderer.render(scene, camera);

  // Cinematic overlay pass (vignette + letterbox) — rendered ON canvas = captured in video
  if (isCinematic && vignetteMat.uniforms.intensity.value > 0) {
    renderer.autoClear = false;
    renderer.render(overlayScene, overlayCamera);
    renderer.autoClear = true;
  }

  // Update particles
  if (isCinematic) {
    updateParticles(dt, performance.now() * 0.001);
  }
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  if (!isCinematic) {
    fitCameraToObject(false, false);
  }
});

window.phoneStand = {
  model,
  parts: partsList,
  materials: MAT,
  startAssemble,
  startExplode,
  startCinematic,
  startHighTechAssembly,
  seekHighTechAssembly,
  freezeHighTechAssembly,
  getAssemblyQA: () => {
    const index = HIGH_TECH_STAGES.findIndex(s => cineTime >= s.start && cineTime < s.end);
    camera.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(PRODUCT_ROOT), center = new THREE.Vector3(); box.getCenter(center);
    const corners=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])corners.push(new THREE.Vector3(x,y,z).project(camera));
    const maxNdc=Math.max(...corners.flatMap(p=>[Math.abs(p.x),Math.abs(p.y)]));
    return { time:cineTime, stage:index+1, partCount:partsList.length, target:controls.target.toArray(),
      subjectCenter:center.toArray(), targetError:controls.target.distanceTo(center), maxNdc,
      camera:camera.position.toArray(), trailVisible:highTechTrail.visible, activePartFlashes:partLockFlashSeen.size,
      rimAmount:highTechRimAmount,
      status:document.getElementById('status')?.textContent };
  },
  stopCinematic,
  fitCameraToObject,
  getModelBoundingInfo,
  explodeData
};
