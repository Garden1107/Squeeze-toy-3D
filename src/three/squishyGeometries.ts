/**
 * Procedural 3D Geometries for Squishy & Slime Toys
 * Generates subdivided high-density meshes ready for vertex deformation physics.
 */
import * as THREE from 'three';

export type SquishyShape =
  | 'bear'
  | 'cat_paw'
  | 'peach'
  | 'dumpling'
  | 'slime_pool'
  | 'stress_ball'
  | 'duck'
  | 'puppy';

export function createSquishyGeometry(shape: SquishyShape): THREE.BufferGeometry {
  let geom: THREE.BufferGeometry;

  switch (shape) {
    case 'bear':
      geom = createBearGeometry();
      break;
    case 'cat_paw':
      geom = createCatPawGeometry();
      break;
    case 'peach':
      geom = createPeachGeometry();
      break;
    case 'dumpling':
      geom = createDumplingGeometry();
      break;
    case 'slime_pool':
      geom = createSlimePoolGeometry();
      break;
    case 'duck':
      geom = createDuckGeometry();
      break;
    case 'puppy':
      geom = createPuppyGeometry();
      break;
    case 'stress_ball':
    default:
      geom = createStressBallGeometry();
      break;
  }

  // Ensure smooth normals and tangents
  geom.computeVertexNormals();
  return geom;
}

/**
 * Cute Bear Mallangi: Round head with bulging cheeks, snout, and two rounded ears
 */
function createBearGeometry(): THREE.BufferGeometry {
  const sphere = new THREE.SphereGeometry(1.3, 72, 54);
  const pos = sphere.attributes.position;
  const count = pos.count;
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Flatten slightly on bottom
    if (y < -0.8) {
      y = THREE.MathUtils.lerp(y, -0.8, 0.4);
    }

    // Chubby cheeks bulge (lower sides)
    const cheekDist = Math.hypot(Math.abs(x) - 0.75, y + 0.15, z - 0.5);
    if (cheekDist < 0.9) {
      const b = (1 - cheekDist / 0.9) * 0.35;
      x += Math.sign(x) * b * 0.7;
      z += b * 0.5;
    }

    // Snout protrusion (front center)
    const snoutDist = Math.hypot(x, y + 0.05, z - 1.1);
    if (snoutDist < 0.8) {
      const s = (1 - snoutDist / 0.8) * 0.45;
      z += s;
      y += s * 0.15;
    }

    // Left ear bulge (x < 0, y > 0.8)
    const leftEarDist = Math.hypot(x + 0.8, y - 1.0, z);
    if (leftEarDist < 0.85) {
      const eb = (1 - leftEarDist / 0.85) * 0.48;
      x -= eb * 0.6;
      y += eb * 0.7;
      z += eb * 0.1;
    }

    // Right ear bulge (x > 0, y > 0.8)
    const rightEarDist = Math.hypot(x - 0.8, y - 1.0, z);
    if (rightEarDist < 0.85) {
      const eb = (1 - rightEarDist / 0.85) * 0.48;
      x += eb * 0.6;
      y += eb * 0.7;
      z += eb * 0.1;
    }

    pos.setXYZ(i, x, y, z);

    // Vertex coloring for snout / ear accents
    let accent = 0;
    if (snoutDist < 0.45) accent = (1 - snoutDist / 0.45); // Snout lighter / blush
    if (leftEarDist < 0.4 || rightEarDist < 0.4) accent = 0.8; // Ear inside

    colors[i * 3] = 1.0;
    colors[i * 3 + 1] = 1.0 - accent * 0.2;
    colors[i * 3 + 2] = 1.0 - accent * 0.25;
  }

  sphere.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return sphere;
}

/**
 * Cat Paw / Jelly Toe Beans (냥발바닥 타바 말랑이)
 */
function createCatPawGeometry(): THREE.BufferGeometry {
  const sphere = new THREE.SphereGeometry(1.35, 76, 56);
  const pos = sphere.attributes.position;
  const count = pos.count;
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Flatten into a rounded paw cushion pad
    y = y * 0.65;
    z = z * 0.85;

    // Main palm pad bean (center lower)
    const mainBeanDist = Math.hypot(x, y - 0.35, z + 0.15);
    let isMainBean = false;
    if (mainBeanDist < 0.75 && y > 0) {
      const mb = Math.cos((mainBeanDist / 0.75) * Math.PI * 0.5) * 0.42;
      y += mb;
      isMainBean = true;
    }

    // 4 Toe Beans (top arc)
    const toeAngles = [-0.68, -0.22, 0.22, 0.68];
    let isToeBean = false;
    for (let t = 0; t < toeAngles.length; t++) {
      const ang = toeAngles[t];
      const toeX = Math.sin(ang) * 0.88;
      const toeZ = -Math.cos(ang) * 0.88 - 0.1;
      const toeDist = Math.hypot(x - toeX, z - toeZ);

      if (toeDist < 0.42 && y > -0.2) {
        const tb = Math.cos((toeDist / 0.42) * Math.PI * 0.5) * 0.38;
        y += tb;
        isToeBean = true;
      }
    }

    pos.setXYZ(i, x, y, z);

    // Toe bean color: Highlight beans pinkish
    if (isMainBean || isToeBean) {
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.55;
      colors[i * 3 + 2] = 0.65;
    } else {
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.96;
      colors[i * 3 + 2] = 0.98;
    }
  }

  sphere.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return sphere;
}

/**
 * Juicy Peach / Heart Squishy (복숭아 / 하트 말랑이)
 */
function createPeachGeometry(): THREE.BufferGeometry {
  const sphere = new THREE.SphereGeometry(1.35, 72, 54);
  const pos = sphere.attributes.position;
  const count = pos.count;
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Heart / Peach cleft crease along X=0
    const crease = Math.exp(-Math.pow(x / 0.28, 2)) * 0.35;
    z += crease * 0.6;
    if (y > 0) {
      y -= crease * 0.4;
    }

    // Taper at bottom tip
    if (y < 0) {
      const factor = (1 + y * 0.4);
      x *= factor;
      z *= factor;
    }

    // Bulge two upper lobes
    const lobeDist = Math.hypot(Math.abs(x) - 0.55, y - 0.4, z);
    if (lobeDist < 0.9) {
      const b = (1 - lobeDist / 0.9) * 0.32;
      y += b * 0.5;
      x += Math.sign(x) * b * 0.2;
    }

    pos.setXYZ(i, x, y, z);

    // Blushed peach gradient (pinkish top, cream bottom)
    const blush = THREE.MathUtils.clamp((y + 0.8) / 2.0, 0, 1);
    colors[i * 3] = 1.0;
    colors[i * 3 + 1] = 0.75 + blush * 0.15;
    colors[i * 3 + 2] = 0.78 - blush * 0.25;
  }

  sphere.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return sphere;
}

/**
 * Steamed Dumpling / Baozi (만두 스퀴시)
 */
function createDumplingGeometry(): THREE.BufferGeometry {
  const sphere = new THREE.SphereGeometry(1.35, 72, 54);
  const pos = sphere.attributes.position;
  const count = pos.count;
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Flat bottom
    if (y < -0.4) {
      y = THREE.MathUtils.lerp(y, -0.6, 0.5);
    }

    // Squat wide bun profile
    y *= 0.72;
    const rad = Math.hypot(x, z);
    const angle = Math.atan2(z, x);

    // Pleated folds around top (8 pleat swirls)
    if (y > 0.1) {
      const pleat = Math.sin(angle * 8) * (y / 1.0) * 0.12;
      x += Math.cos(angle) * pleat;
      z += Math.sin(angle) * pleat;
    }

    // Top pinch knot
    const topDist = Math.hypot(x, y - 0.75, z);
    if (topDist < 0.4) {
      y += (1 - topDist / 0.4) * 0.22;
    }

    pos.setXYZ(i, x, y, z);

    colors[i * 3] = 0.98;
    colors[i * 3 + 1] = 0.97;
    colors[i * 3 + 2] = 0.93;
  }

  sphere.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return sphere;
}

/**
 * Slime Pool / Puddle (슬라임 웅덩이)
 */
function createSlimePoolGeometry(): THREE.BufferGeometry {
  const sphere = new THREE.SphereGeometry(1.6, 80, 48);
  const pos = sphere.attributes.position;
  const count = pos.count;
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Flatten vertically into a puddle
    y = (y + 0.5) * 0.38 - 0.3;
    const r = Math.hypot(x, z);
    const angle = Math.atan2(z, x);

    // Organic wavy blob boundary
    const wobble = Math.sin(angle * 3.0) * 0.15 + Math.cos(angle * 5.0) * 0.08;
    x *= (1.2 + wobble);
    z *= (1.2 + wobble);

    // Dome middle
    if (r < 1.4 && y > -0.3) {
      y += (1 - r / 1.4) * 0.35;
    }

    pos.setXYZ(i, x, y, z);

    colors[i * 3] = 1.0;
    colors[i * 3 + 1] = 1.0;
    colors[i * 3 + 2] = 1.0;
  }

  sphere.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return sphere;
}

/**
 * Classic Stress Ball / Round Mochi (스트레스볼 & 큐브형 모찌)
 */
function createStressBallGeometry(): THREE.BufferGeometry {
  const sphere = new THREE.SphereGeometry(1.35, 72, 54);
  const pos = sphere.attributes.position;
  const count = pos.count;
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Subtle plump squish (squatting slightly under gravity)
    y *= 0.92;
    x *= 1.04;
    z *= 1.04;

    pos.setXYZ(i, x, y, z);

    colors[i * 3] = 1.0;
    colors[i * 3 + 1] = 1.0;
    colors[i * 3 + 2] = 1.0;
  }

  sphere.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return sphere;
}

/**
 * Cute Rubber Duck Squeaker (러버덕 오리 삑삑이 말랑이)
 */
function createDuckGeometry(): THREE.BufferGeometry {
  const sphere = new THREE.SphereGeometry(1.3, 76, 56);
  const pos = sphere.attributes.position;
  const count = pos.count;
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Flatten bottom so it sits in a bath tray
    if (y < -0.6) {
      y = THREE.MathUtils.lerp(y, -0.6, 0.45);
    }

    // Little upturned tail at back (z < -0.7)
    if (z < -0.4 && y > -0.2) {
      const tailFactor = (Math.abs(z) - 0.4) * 0.45;
      y += tailFactor;
      z -= tailFactor * 0.3;
    }

    // Head bulge (top front: y > 0.3, z > 0.2)
    const headDist = Math.hypot(x, y - 0.7, z - 0.65);
    if (headDist < 0.8) {
      const hb = (1 - headDist / 0.8) * 0.45;
      y += hb * 0.4;
      z += hb * 0.4;
    }

    // Duck Bill / Beak protrusion (orange beak at front: z > 0.9, y between 0.3 and 0.7)
    const beakDist = Math.hypot(x, y - 0.48, z - 1.25);
    let isBeak = false;
    if (beakDist < 0.55) {
      const bb = (1 - beakDist / 0.55) * 0.48;
      z += bb;
      y += bb * 0.1;
      x *= (1 + bb * 0.4); // flatten beak horizontally
      isBeak = true;
    }

    // Wings on sides (x < -0.8 or x > 0.8)
    const wingDist = Math.hypot(Math.abs(x) - 0.95, y + 0.1, z + 0.1);
    if (wingDist < 0.75) {
      const wb = (1 - wingDist / 0.75) * 0.28;
      x += Math.sign(x) * wb;
    }

    pos.setXYZ(i, x, y, z);

    // Beak color: bright orange beak on yellow duck
    if (isBeak) {
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.48;
      colors[i * 3 + 2] = 0.05;
    } else {
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.92;
      colors[i * 3 + 2] = 0.2;
    }
  }

  sphere.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return sphere;
}

/**
 * Cute Puppy Mallangi (멍멍이 강아지 말랑이)
 */
function createPuppyGeometry(): THREE.BufferGeometry {
  const sphere = new THREE.SphereGeometry(1.3, 76, 56);
  const pos = sphere.attributes.position;
  const count = pos.count;
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Flatten bottom
    if (y < -0.7) {
      y = THREE.MathUtils.lerp(y, -0.7, 0.45);
    }

    // Drooping puppy ears on left and right sides
    const leftEar = Math.hypot(x + 0.95, y - 0.45, z - 0.1);
    let isLeftEar = false;
    if (leftEar < 0.85) {
      const eb = (1 - leftEar / 0.85) * 0.42;
      x -= eb * 0.5;
      y -= eb * 0.6; // droop down
      isLeftEar = true;
    }

    const rightEar = Math.hypot(x - 0.95, y - 0.45, z - 0.1);
    let isRightEar = false;
    if (rightEar < 0.85) {
      const eb = (1 - rightEar / 0.85) * 0.42;
      x += eb * 0.5;
      y -= eb * 0.6; // droop down
      isRightEar = true;
    }

    // Cute snout / muzzle
    const snoutDist = Math.hypot(x, y + 0.05, z - 1.15);
    let isSnout = false;
    if (snoutDist < 0.75) {
      const sb = (1 - snoutDist / 0.75) * 0.42;
      z += sb;
      y += sb * 0.12;
      isSnout = true;
    }

    // Nose button
    const noseDist = Math.hypot(x, y - 0.2, z - 1.35);
    let isNose = false;
    if (noseDist < 0.28) {
      isNose = true;
    }

    pos.setXYZ(i, x, y, z);

    // Color: Brown floppy ears & black button nose
    if (isNose) {
      colors[i * 3] = 0.18;
      colors[i * 3 + 1] = 0.15;
      colors[i * 3 + 2] = 0.15;
    } else if (isLeftEar || isRightEar) {
      colors[i * 3] = 0.76;
      colors[i * 3 + 1] = 0.52;
      colors[i * 3 + 2] = 0.38;
    } else if (isSnout) {
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.98;
      colors[i * 3 + 2] = 0.95;
    } else {
      colors[i * 3] = 0.94;
      colors[i * 3 + 1] = 0.85;
      colors[i * 3 + 2] = 0.72;
    }
  }

  sphere.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return sphere;
}

