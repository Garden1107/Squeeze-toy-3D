/**
 * 3D Soft-Body Squishy & Slime Physics Simulator
 * Handles real-time mesh deformation, volume-preserving bulges,
 * spring-damper viscoelastic recovery, PBR materials, and ASMR interaction.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createSquishyGeometry, SquishyShape } from './squishyGeometries';
import { ToppingsManager, ToppingType } from './ToppingsSystem';
import { asmrEngine, TextureType, SoundProfile } from '../audio/asmrAudio';

export type ToolMode = 'poke' | 'squeeze' | 'stretch' | 'slap' | 'roll' | 'topping';

export interface SquishyConfig {
  shape: SquishyShape;
  texture: TextureType;
  soundProfile: SoundProfile;
  baseColor: string;
  subColor: string;
  roughness: number;
  translucency: number; // 0 to 1
  slowRise: number; // 0 (instant bouncy) to 1 (slow memory foam)
  toppingType: ToppingType;
  toppingCount: number;
  glitter: boolean;
}

export class SquishySimulation {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;

  // 3D Objects
  private meshGroup: THREE.Group;
  private squishyMesh: THREE.Mesh | null = null;
  private squishyGeometry: THREE.BufferGeometry | null = null;
  private squishyMaterial: THREE.MeshPhysicalMaterial | null = null;
  private toppingsManager: ToppingsManager;
  private trayMesh: THREE.Mesh | null = null;
  private contactShadow: THREE.Mesh | null = null;

  // Vertex Physics Arrays
  private originalPos: Float32Array = new Float32Array(0);
  private velocities: Float32Array = new Float32Array(0);

  // Interaction State
  private raycaster: THREE.Raycaster;
  private mousePos: THREE.Vector2 = new THREE.Vector2();
  private isPointerDown: boolean = false;
  private isInteractingWithToy: boolean = false;
  private isOrbiting: boolean = false;
  private activeTool: ToolMode = 'poke';
  private lastHitPoint: THREE.Vector3 = new THREE.Vector3();
  private dragStartHitPoint: THREE.Vector3 = new THREE.Vector3();
  private pointerPrevScreen: THREE.Vector2 = new THREE.Vector2();
  private grabVertexIndices: number[] = [];

  // Camera Orbit State
  private cameraSpherical: THREE.Spherical = new THREE.Spherical(4.8, Math.PI / 3.0, 0.4);
  private targetSpherical: THREE.Spherical = new THREE.Spherical(4.8, Math.PI / 3.0, 0.4);
  private cameraTarget: THREE.Vector3 = new THREE.Vector3(0, 0.1, 0);

  // Configuration
  private config: SquishyConfig;
  private animFrameId: number | null = null;

  // Stats / Event Callbacks
  public onSquishEvent?: (type: 'poke' | 'squeeze' | 'stretch' | 'slap' | 'pop') => void;

  constructor(container: HTMLElement, initialConfig: SquishyConfig) {
    this.container = container;
    this.config = { ...initialConfig };
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.toppingsManager = new ToppingsManager();

    // 1. Initialize Renderer with ACES Filmic tone mapping and SRGB color pipeline
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // 2. Scene & Procedural Studio Environment
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#f7f3ef');
    this.scene.fog = new THREE.FogExp2('#f7f3ef', 0.045);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 3. Camera
    this.camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 50);
    this.updateCameraPosition();

    // 4. Lighting Rig
    this.setupLighting();

    // 5. Studio Tray & Contact Shadow
    this.setupStudioTray();

    // 6. Mesh Group & Squishy Subject
    this.meshGroup = new THREE.Group();
    this.scene.add(this.meshGroup);
    this.meshGroup.add(this.toppingsManager.getGroup());

    this.rebuildSquishy();

    // 7. Event Listeners
    this.bindEvents();

    // 8. Animation loop
    this.animate = this.animate.bind(this);
    this.animFrameId = requestAnimationFrame(this.animate);
  }

  private setupLighting() {
    // Warm Key Light
    const keyLight = new THREE.DirectionalLight('#fff8f0', 2.0);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.camera.left = -2.5;
    keyLight.shadow.camera.right = 2.5;
    keyLight.shadow.camera.top = 2.5;
    keyLight.shadow.camera.bottom = -2.5;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    // Cool Rim / Fill Light
    const rimLight = new THREE.DirectionalLight('#e6f0ff', 1.0);
    rimLight.position.set(-4, 3, -4);
    this.scene.add(rimLight);

    // Soft Hemisphere Ambient
    const hemiLight = new THREE.HemisphereLight('#ffffff', '#ecd9cb', 0.7);
    this.scene.add(hemiLight);
  }

  private setupStudioTray() {
    // Aesthetic Studio Tray (Pedestal)
    const trayGeom = new THREE.CylinderGeometry(2.5, 2.7, 0.16, 48);
    const trayMat = new THREE.MeshStandardMaterial({
      color: '#fffef9',
      roughness: 0.35,
      metalness: 0.05,
    });
    this.trayMesh = new THREE.Mesh(trayGeom, trayMat);
    this.trayMesh.position.y = -0.88;
    this.trayMesh.receiveShadow = true;
    this.scene.add(this.trayMesh);

    // Subtle edge rim for tray
    const rimGeom = new THREE.TorusGeometry(2.5, 0.06, 16, 48);
    rimGeom.rotateX(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({ color: '#f2e8dc', roughness: 0.4 });
    const rimMesh = new THREE.Mesh(rimGeom, rimMat);
    rimMesh.position.y = -0.80;
    this.scene.add(rimMesh);

    // Soft Contact Shadow plane
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext('2d')!;
    const gradient = sctx.createRadialGradient(64, 64, 10, 64, 64, 60);
    gradient.addColorStop(0, 'rgba(40, 20, 10, 0.45)');
    gradient.addColorStop(0.5, 'rgba(50, 30, 20, 0.18)');
    gradient.addColorStop(1, 'rgba(50, 30, 20, 0)');
    sctx.fillStyle = gradient;
    sctx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    });
    const shadowGeom = new THREE.PlaneGeometry(3.6, 3.6);
    shadowGeom.rotateX(-Math.PI / 2);
    this.contactShadow = new THREE.Mesh(shadowGeom, shadowMat);
    this.contactShadow.position.y = -0.79;
    this.scene.add(this.contactShadow);
  }

  public rebuildSquishy() {
    if (this.squishyMesh) {
      this.meshGroup.remove(this.squishyMesh);
      if (this.squishyGeometry) this.squishyGeometry.dispose();
      if (this.squishyMaterial) this.squishyMaterial.dispose();
      this.squishyMesh = null;
    }

    // 1. Generate base procedural geometry
    this.squishyGeometry = createSquishyGeometry(this.config.shape);
    const posAttr = this.squishyGeometry.attributes.position;
    const vertexCount = posAttr.count;

    // Cache original rest positions & reset velocities
    this.originalPos = new Float32Array(vertexCount * 3);
    this.velocities = new Float32Array(vertexCount * 3);
    for (let i = 0; i < vertexCount * 3; i++) {
      this.originalPos[i] = posAttr.array[i];
      this.velocities[i] = 0;
    }

    // 2. Create Material based on Texture type
    this.squishyMaterial = this.createMaterialForTexture(this.config);

    // 3. Assemble Mesh
    this.squishyMesh = new THREE.Mesh(this.squishyGeometry, this.squishyMaterial);
    this.squishyMesh.castShadow = true;
    this.squishyMesh.receiveShadow = true;
    this.meshGroup.add(this.squishyMesh);

    // 4. Update Toppings
    this.toppingsManager.setToppingType(this.config.toppingType, this.squishyGeometry);
    this.toppingsManager.setCount(this.config.toppingCount, this.squishyGeometry);

    // Pre-warm shaders
    this.renderer.compile(this.scene, this.camera);
  }

  private createMaterialForTexture(cfg: SquishyConfig): THREE.MeshPhysicalMaterial {
    const baseColor = new THREE.Color(cfg.baseColor);

    let transmission = 0.0;
    let opacity = 1.0;
    let transparent = false;
    let roughness = cfg.roughness;
    let metalness = 0.0;
    let clearcoat = 0.0;
    let clearcoatRoughness = 0.1;
    let ior = 1.45;
    let thickness = 0.8;
    let attenuationColor = baseColor.clone().multiplyScalar(1.1);

    switch (cfg.texture) {
      case 'squishy':
        // Soft matte foam
        roughness = Math.max(0.65, cfg.roughness);
        clearcoat = 0.05;
        break;

      case 'taba':
        // Ultra velvety soft silicone / mochi powder
        roughness = 0.88;
        metalness = 0.0;
        clearcoat = 0.0;
        break;

      case 'glossy_slime':
        // Juicy, ultra wet, reflective jelly slime
        roughness = 0.08;
        clearcoat = 1.0;
        clearcoatRoughness = 0.03;
        transmission = Math.max(0.55, cfg.translucency);
        transparent = true;
        opacity = 0.95;
        thickness = 1.6;
        ior = 1.34;
        break;

      case 'crunch_mallangi':
        // Slightly translucent rubber with visible foam beads
        roughness = 0.35;
        clearcoat = 0.4;
        transmission = 0.35;
        transparent = true;
        opacity = 0.96;
        break;

      case 'crunch_slime':
        // Crystal clear bingsu bead slime
        roughness = 0.05;
        clearcoat = 1.0;
        clearcoatRoughness = 0.02;
        transmission = 0.82;
        transparent = true;
        opacity = 0.92;
        ior = 1.42;
        thickness = 2.0;
        break;

      case 'water_ball':
        // Glossy thin balloon rubber membrane with liquid interior
        roughness = 0.15;
        clearcoat = 0.9;
        transmission = 0.7;
        transparent = true;
        opacity = 0.94;
        thickness = 1.2;
        break;
    }

    if (cfg.glitter) {
      clearcoat = 1.0;
    }

    const mat = new THREE.MeshPhysicalMaterial({
      color: baseColor,
      vertexColors: true,
      roughness,
      metalness,
      clearcoat,
      clearcoatRoughness,
      transmission,
      transparent,
      opacity,
      ior,
      thickness,
      attenuationColor,
    });

    return mat;
  }

  public updateConfig(newConfig: Partial<SquishyConfig>) {
    const oldShape = this.config.shape;
    const oldTexture = this.config.texture;
    const oldToppingType = this.config.toppingType;
    const oldToppingCount = this.config.toppingCount;

    this.config = { ...this.config, ...newConfig };

    if (newConfig.soundProfile) {
      asmrEngine.setSoundProfile(newConfig.soundProfile);
    }

    // Rebuild mesh if shape or texture changed significantly
    if (newConfig.shape && newConfig.shape !== oldShape) {
      this.rebuildSquishy();
      return;
    }

    if (newConfig.texture && newConfig.texture !== oldTexture) {
      this.rebuildSquishy();
      return;
    }

    // Otherwise dynamically update material properties
    if (this.squishyMaterial) {
      if (newConfig.baseColor) {
        this.squishyMaterial.color.set(newConfig.baseColor);
        this.squishyMaterial.attenuationColor.set(newConfig.baseColor);
      }
      if (newConfig.roughness !== undefined) {
        this.squishyMaterial.roughness = newConfig.roughness;
      }
      if (newConfig.translucency !== undefined) {
        this.squishyMaterial.transmission = newConfig.translucency;
      }
    }

    // Update toppings if count or type changed
    if (this.squishyGeometry && (newConfig.toppingType !== undefined || newConfig.toppingCount !== undefined)) {
      if (newConfig.toppingType && newConfig.toppingType !== oldToppingType) {
        this.toppingsManager.setToppingType(this.config.toppingType, this.squishyGeometry);
      }
      if (newConfig.toppingCount !== undefined && newConfig.toppingCount !== oldToppingCount) {
        this.toppingsManager.setCount(this.config.toppingCount, this.squishyGeometry);
      }
    }
  }

  public setToolMode(tool: ToolMode) {
    this.activeTool = tool;
  }

  public getToolMode(): ToolMode {
    return this.activeTool;
  }

  // Interaction handlers
  private bindEvents() {
    const dom = this.renderer.domElement;

    dom.addEventListener('pointerdown', this.onPointerDown.bind(this));
    window.addEventListener('pointermove', this.onPointerMove.bind(this));
    window.addEventListener('pointerup', this.onPointerUp.bind(this));
    window.addEventListener('pointercancel', this.onPointerUp.bind(this));
    dom.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    dom.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onPointerDown(e: PointerEvent) {
    this.isPointerDown = true;
    this.pointerPrevScreen.set(e.clientX, e.clientY);

    // Convert mouse to NDC
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mousePos.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mousePos.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Right-click or middle-click or Alt+click defaults to camera orbit
    if (e.button === 2 || e.button === 1 || e.altKey) {
      this.isOrbiting = true;
      return;
    }

    // Raycast against squishy mesh
    this.raycaster.setFromCamera(this.mousePos, this.camera);
    if (!this.squishyMesh) return;

    const hits = this.raycaster.intersectObject(this.squishyMesh, false);
    if (hits.length > 0) {
      this.isInteractingWithToy = true;
      const hit = hits[0];
      this.lastHitPoint.copy(hit.point);
      this.dragStartHitPoint.copy(hit.point);

      // Perform initial tool press
      this.applyToolAction(hit.point, hit.face?.normal || new THREE.Vector3(0, 1, 0), 1.0, true);
    } else {
      // Clicked background -> orbit camera
      this.isOrbiting = true;
    }
  }

  private onPointerMove(e: PointerEvent) {
    const deltaX = e.clientX - this.pointerPrevScreen.x;
    const deltaY = e.clientY - this.pointerPrevScreen.y;
    this.pointerPrevScreen.set(e.clientX, e.clientY);

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mousePos.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mousePos.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (this.isOrbiting) {
      // Smooth orbit rotation
      this.targetSpherical.theta -= deltaX * 0.008;
      this.targetSpherical.phi = Math.max(0.15, Math.min(Math.PI * 0.48, this.targetSpherical.phi - deltaY * 0.008));
      return;
    }

    if (this.isInteractingWithToy && this.squishyMesh) {
      this.raycaster.setFromCamera(this.mousePos, this.camera);
      const hits = this.raycaster.intersectObject(this.squishyMesh, false);

      if (hits.length > 0) {
        const hit = hits[0];
        this.lastHitPoint.copy(hit.point);
        const dragDist = this.lastHitPoint.distanceTo(this.dragStartHitPoint);

        if (this.activeTool === 'roll' || this.activeTool === 'poke') {
          // Continuous drag indentation (kneading / drawing)
          this.applyToolAction(hit.point, hit.face?.normal || new THREE.Vector3(0, 1, 0), 0.6, false);
        } else if (this.activeTool === 'stretch') {
          // Pull vertices along cursor ray in plane
          this.applyStretchAction(hit.point, deltaX, deltaY);
        }
      }
    }
  }

  private onPointerUp(e: PointerEvent) {
    if (this.isInteractingWithToy) {
      // Slow rising sound when releasing memory foam squishy
      if (this.config.slowRise > 0.4 && this.config.texture === 'squishy') {
        asmrEngine.playSlowRise(1.0 + this.config.slowRise * 0.8);
      }
    }

    this.isPointerDown = false;
    this.isInteractingWithToy = false;
    this.isOrbiting = false;
    this.grabVertexIndices = [];
  }

  private onWheel(e: WheelEvent) {
    e.preventDefault();
    this.targetSpherical.radius = THREE.MathUtils.clamp(
      this.targetSpherical.radius + e.deltaY * 0.003,
      2.5,
      8.0
    );
  }

  private onResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Apply interactive physics displacement based on tool
   */
  private applyToolAction(hitPoint: THREE.Vector3, normal: THREE.Vector3, intensity: number = 1.0, isInitialClick: boolean = false) {
    if (!this.squishyGeometry) return;

    const pos = this.squishyGeometry.attributes.position;
    const count = pos.count;
    const pan = (this.mousePos.x);

    // Audio trigger
    if (isInitialClick) {
      if (this.activeTool === 'slap') {
        asmrEngine.playSlap(1.1);
        if (this.onSquishEvent) this.onSquishEvent('slap');
      } else {
        asmrEngine.playSquish(this.config.texture, 0.8 * intensity, pan);
        if (this.onSquishEvent) this.onSquishEvent(this.activeTool === 'squeeze' ? 'squeeze' : 'poke');
      }

      // Check toppings crunch
      this.toppingsManager.checkCrunchImpact(hitPoint, 0.6);
    }

    // Displacement Physics
    const indentDepth = 0.55 * intensity;
    const radius = this.activeTool === 'squeeze' ? 0.95 : this.activeTool === 'slap' ? 1.2 : 0.65;

    // Normal vector pointing inwards
    const inwardDir = normal.clone().negate().normalize();

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const vx = pos.array[idx];
      const vy = pos.array[idx + 1];
      const vz = pos.array[idx + 2];

      const dx = vx - hitPoint.x;
      const dy = vy - hitPoint.y;
      const dz = vz - hitPoint.z;
      const dist = Math.hypot(dx, dy, dz);

      if (dist < radius) {
        // Falloff curve: smooth bell curve
        const t = dist / radius;
        const factor = Math.cos(t * Math.PI * 0.5);

        if (this.activeTool === 'squeeze') {
          // Pinch compression from both sides
          const squeezeDirX = Math.sign(vx) * -0.35 * factor;
          const squeezeDirZ = Math.sign(vz) * -0.35 * factor;
          // Bulge up and down (volume preservation)
          const bulgeY = Math.sign(vy) * 0.28 * factor;

          pos.array[idx] += squeezeDirX;
          pos.array[idx + 1] += bulgeY;
          pos.array[idx + 2] += squeezeDirZ;

          // Set velocity impulse
          this.velocities[idx] += squeezeDirX * 8;
          this.velocities[idx + 1] += bulgeY * 8;
          this.velocities[idx + 2] += squeezeDirZ * 8;
        } else if (this.activeTool === 'slap') {
          // Shockwave ripple impulse
          const waveImpulse = inwardDir.clone().multiplyScalar(indentDepth * factor * 0.7);
          this.velocities[idx] += waveImpulse.x * 12;
          this.velocities[idx + 1] += waveImpulse.y * 12;
          this.velocities[idx + 2] += waveImpulse.z * 12;
        } else {
          // Poke or Roll indentation
          const disp = inwardDir.clone().multiplyScalar(indentDepth * factor);
          pos.array[idx] += disp.x;
          pos.array[idx + 1] += disp.y;
          pos.array[idx + 2] += disp.z;

          this.velocities[idx] += disp.x * 5;
          this.velocities[idx + 1] += disp.y * 5;
          this.velocities[idx + 2] += disp.z * 5;

          // Volume preservation: surrounding ring bulges slightly outward
          if (dist > radius * 0.45 && dist < radius) {
            const bulge = normal.clone().multiplyScalar(indentDepth * 0.3 * (1 - t));
            pos.array[idx] += bulge.x;
            pos.array[idx + 1] += bulge.y;
            pos.array[idx + 2] += bulge.z;
          }
        }
      }
    }

    pos.needsUpdate = true;
    this.squishyGeometry.computeVertexNormals();
    this.toppingsManager.updatePositions(pos as THREE.BufferAttribute);
  }

  /**
   * Stretch Action: Pull vertex cluster outward like melted slime or stretchy mochi
   */
  private applyStretchAction(hitPoint: THREE.Vector3, screenDx: number, screenDy: number) {
    if (!this.squishyGeometry) return;
    const pos = this.squishyGeometry.attributes.position;
    const count = pos.count;

    // Convert screen drag to 3D world pull direction
    const pullDir = new THREE.Vector3(screenDx * 0.015, -screenDy * 0.015, 0);
    pullDir.applyQuaternion(this.camera.quaternion);

    const radius = 0.75;
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const dist = Math.hypot(
        pos.array[idx] - hitPoint.x,
        pos.array[idx + 1] - hitPoint.y,
        pos.array[idx + 2] - hitPoint.z
      );

      if (dist < radius) {
        const factor = (1 - dist / radius);
        pos.array[idx] += pullDir.x * factor;
        pos.array[idx + 1] += pullDir.y * factor;
        pos.array[idx + 2] += pullDir.z * factor;

        this.velocities[idx] += pullDir.x * factor * 5;
        this.velocities[idx + 1] += pullDir.y * factor * 5;
        this.velocities[idx + 2] += pullDir.z * factor * 5;
      }
    }

    pos.needsUpdate = true;
    this.squishyGeometry.computeVertexNormals();
    this.toppingsManager.updatePositions(pos as THREE.BufferAttribute);

    if (Math.random() < 0.25) {
      asmrEngine.playPop(1400 + Math.random() * 400, 0.12);
      if (this.onSquishEvent) this.onSquishEvent('pop');
    }
  }

  /**
   * Reset the squishy back to its smooth rest form with a satisfying pop
   */
  public resetShape() {
    if (!this.squishyGeometry) return;
    const pos = this.squishyGeometry.attributes.position;
    const count = pos.count;

    for (let i = 0; i < count * 3; i++) {
      pos.array[i] = this.originalPos[i];
      this.velocities[i] = 0;
    }
    pos.needsUpdate = true;
    this.squishyGeometry.computeVertexNormals();
    this.toppingsManager.updatePositions(pos as THREE.BufferAttribute);

    asmrEngine.playPop(1600, 0.4);
    asmrEngine.playSlowRise(0.8);
  }

  /**
   * Topping Dispenser: Rain down toppings on the squishy
   */
  public dispenseToppings() {
    if (!this.squishyGeometry) return;
    const newCount = Math.min(this.config.toppingCount + 30, 180);
    this.updateConfig({ toppingCount: newCount });
    asmrEngine.playSprinkle(10);
  }

  /**
   * Reset camera to center view
   */
  public resetCamera() {
    this.targetSpherical.set(4.8, Math.PI / 3.0, 0.4);
  }

  private updateCameraPosition() {
    // Smooth camera damping
    this.cameraSpherical.radius = THREE.MathUtils.damp(this.cameraSpherical.radius, this.targetSpherical.radius, 8.0, 0.016);
    this.cameraSpherical.phi = THREE.MathUtils.damp(this.cameraSpherical.phi, this.targetSpherical.phi, 8.0, 0.016);
    this.cameraSpherical.theta = THREE.MathUtils.damp(this.cameraSpherical.theta, this.targetSpherical.theta, 8.0, 0.016);

    this.camera.position.setFromSpherical(this.cameraSpherical).add(this.cameraTarget);
    this.camera.lookAt(this.cameraTarget);
  }

  /**
   * Main Animation & Physics Loop
   */
  private animate() {
    this.animFrameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.05);

    // 1. Camera update
    this.updateCameraPosition();

    // 2. Vertex Physics & Spring Restoration
    if (this.squishyGeometry && this.originalPos.length > 0) {
      const pos = this.squishyGeometry.attributes.position;
      const count = pos.count;

      // Elastic physics properties based on user configuration & texture
      let stiffness = 28.0; // Hooke's return spring
      let damping = 6.0;   // Velocity decay

      if (this.config.texture === 'squishy') {
        // Slow rise memory foam: lower stiffness, higher viscous damping
        const slowFactor = this.config.slowRise; // 0 to 1
        stiffness = THREE.MathUtils.lerp(35.0, 4.0, slowFactor);
        damping = THREE.MathUtils.lerp(8.0, 24.0, slowFactor);
      } else if (this.config.texture === 'taba') {
        stiffness = 18.0;
        damping = 10.0;
      } else if (this.config.texture === 'glossy_slime') {
        // Slime: low stiffness, fluid ripple
        stiffness = 14.0;
        damping = 4.5;
      } else if (this.config.texture === 'crunch_mallangi') {
        stiffness = 32.0;
        damping = 8.0;
      } else if (this.config.texture === 'crunch_slime') {
        stiffness = 16.0;
        damping = 5.0;
      } else if (this.config.texture === 'water_ball') {
        stiffness = 45.0;
        damping = 3.5;
      }

      let needsNormalUpdate = false;

      for (let i = 0; i < count; i++) {
        const idx = i * 3;

        // Current displacement from rest
        const dx = pos.array[idx] - this.originalPos[idx];
        const dy = pos.array[idx + 1] - this.originalPos[idx + 1];
        const dz = pos.array[idx + 2] - this.originalPos[idx + 2];

        const distSq = dx * dx + dy * dy + dz * dz;

        // Only integrate if vertex is displaced or moving
        if (distSq > 0.000001 || Math.abs(this.velocities[idx]) > 0.001 || Math.abs(this.velocities[idx + 1]) > 0.001 || Math.abs(this.velocities[idx + 2]) > 0.001) {
          needsNormalUpdate = true;

          // Spring force F = -k * x
          const fx = -stiffness * dx;
          const fy = -stiffness * dy;
          const fz = -stiffness * dz;

          // Acceleration with damping: a = F - c * v
          const ax = fx - damping * this.velocities[idx];
          const ay = fy - damping * this.velocities[idx + 1];
          const az = fz - damping * this.velocities[idx + 2];

          // Euler-Cromer integration
          this.velocities[idx] += ax * delta;
          this.velocities[idx + 1] += ay * delta;
          this.velocities[idx + 2] += az * delta;

          pos.array[idx] += this.velocities[idx] * delta;
          pos.array[idx + 1] += this.velocities[idx + 1] * delta;
          pos.array[idx + 2] += this.velocities[idx + 2] * delta;

          // Ground plane collision clamping so squishy doesn't sink into tray
          if (pos.array[idx + 1] < -0.80) {
            pos.array[idx + 1] = -0.80;
            this.velocities[idx + 1] = 0;
          }
        }
      }

      if (needsNormalUpdate) {
        pos.needsUpdate = true;
        this.squishyGeometry.computeVertexNormals();
        this.toppingsManager.updatePositions(pos as THREE.BufferAttribute);
      }
    }

    // 3. Render scene
    this.renderer.render(this.scene, this.camera);
  }

  public captureSnapshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  public dispose() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }

    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    window.removeEventListener('resize', this.onResize);

    this.toppingsManager.dispose();

    if (this.squishyGeometry) this.squishyGeometry.dispose();
    if (this.squishyMaterial) this.squishyMaterial.dispose();
    if (this.trayMesh) {
      this.trayMesh.geometry.dispose();
      (this.trayMesh.material as THREE.Material).dispose();
    }
    if (this.contactShadow) {
      this.contactShadow.geometry.dispose();
      (this.contactShadow.material as THREE.Material).dispose();
    }

    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
