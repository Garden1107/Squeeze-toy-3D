/**
 * Interactive Crunch Toppings & Bead System
 * High-performance InstancedMesh beads/flakes embedded in the squishy.
 * Follows vertex deformation and triggers micro-crackle ASMR sounds.
 */
import * as THREE from 'three';
import { asmrEngine } from '../audio/asmrAudio';

export type ToppingType = 'foam_beads' | 'pearls' | 'bingsu_flakes' | 'star_glitter' | 'fruit_slices';

export interface ToppingInstance {
  pos: THREE.Vector3;
  restPos: THREE.Vector3;
  normal: THREE.Vector3;
  scale: number;
  rot: THREE.Euler;
  color: THREE.Color;
  vertexIndex: number;
}

export class ToppingsManager {
  private group: THREE.Group;
  private instancedMesh: THREE.InstancedMesh | null = null;
  private instances: ToppingInstance[] = [];
  private toppingType: ToppingType = 'foam_beads';
  private maxCount: number = 200;
  private activeCount: number = 80;
  private dummy: THREE.Object3D = new THREE.Object3D();

  constructor() {
    this.group = new THREE.Group();
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public setToppingType(type: ToppingType, baseGeometry: THREE.BufferGeometry) {
    this.toppingType = type;
    this.rebuildMesh(baseGeometry);
  }

  public setCount(count: number, baseGeometry: THREE.BufferGeometry) {
    this.activeCount = Math.min(Math.max(count, 0), this.maxCount);
    this.rebuildMesh(baseGeometry);
  }

  public rebuildMesh(baseGeometry: THREE.BufferGeometry) {
    // Clear old mesh
    if (this.instancedMesh) {
      this.group.remove(this.instancedMesh);
      this.instancedMesh.geometry.dispose();
      if (Array.isArray(this.instancedMesh.material)) {
        this.instancedMesh.material.forEach((m) => m.dispose());
      } else {
        this.instancedMesh.material.dispose();
      }
      this.instancedMesh = null;
    }

    if (this.activeCount <= 0) return;

    let toppingGeom: THREE.BufferGeometry;
    let toppingMat: THREE.Material;

    switch (this.toppingType) {
      case 'foam_beads':
        // Lightweight matte foam beads
        toppingGeom = new THREE.SphereGeometry(0.065, 12, 10);
        toppingMat = new THREE.MeshStandardMaterial({
          roughness: 0.8,
          metalness: 0.05,
        });
        break;

      case 'pearls':
        // Shiny pearlescent beads
        toppingGeom = new THREE.SphereGeometry(0.075, 16, 14);
        toppingMat = new THREE.MeshPhysicalMaterial({
          roughness: 0.15,
          metalness: 0.35,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,
        });
        break;

      case 'bingsu_flakes':
        // Crunchy faceted crystal flakes
        toppingGeom = new THREE.OctahedronGeometry(0.08, 0);
        toppingMat = new THREE.MeshPhysicalMaterial({
          roughness: 0.1,
          transmission: 0.85,
          ior: 1.5,
          thickness: 0.4,
          transparent: true,
          opacity: 0.9,
        });
        break;

      case 'star_glitter':
        // Mini star / hexagon prism spangle
        toppingGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 5);
        toppingMat = new THREE.MeshPhysicalMaterial({
          roughness: 0.1,
          metalness: 0.85,
          clearcoat: 1.0,
        });
        break;

      case 'fruit_slices':
        // Tiny fruit slice disc
        toppingGeom = new THREE.CylinderGeometry(0.09, 0.09, 0.025, 12);
        toppingMat = new THREE.MeshStandardMaterial({
          roughness: 0.4,
          metalness: 0.0,
        });
        break;
    }

    this.instancedMesh = new THREE.InstancedMesh(toppingGeom, toppingMat, this.maxCount);
    this.instancedMesh.castShadow = true;
    this.instancedMesh.receiveShadow = true;

    // Distribute instances on or just beneath the squishy surface
    this.instances = [];
    const posAttr = baseGeometry.attributes.position;
    const normAttr = baseGeometry.attributes.normal;
    const vertexCount = posAttr.count;

    const pastelPalettes = [
      new THREE.Color('#ff8fa3'), // pink
      new THREE.Color('#ffd166'), // yellow
      new THREE.Color('#06d6a0'), // mint
      new THREE.Color('#118ab2'), // cyan
      new THREE.Color('#9b5de5'), // purple
      new THREE.Color('#ffffff'), // white
      new THREE.Color('#f72585'), // magenta
    ];

    for (let i = 0; i < this.activeCount; i++) {
      // Pick random vertex index on geometry
      const vIdx = Math.floor(Math.random() * vertexCount);
      const vx = posAttr.getX(vIdx);
      const vy = posAttr.getY(vIdx);
      const vz = posAttr.getZ(vIdx);

      const nx = normAttr ? normAttr.getX(vIdx) : 0;
      const ny = normAttr ? normAttr.getY(vIdx) : 1;
      const nz = normAttr ? normAttr.getZ(vIdx) : 0;

      // Slight inward/outward offset (-0.02 to +0.03)
      const offset = (Math.random() - 0.4) * 0.05;
      const pos = new THREE.Vector3(
        vx + nx * offset,
        vy + ny * offset,
        vz + nz * offset
      );

      const rot = new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      const scale = 0.8 + Math.random() * 0.4;
      const color = pastelPalettes[Math.floor(Math.random() * pastelPalettes.length)].clone();

      this.instances.push({
        pos: pos.clone(),
        restPos: pos.clone(),
        normal: new THREE.Vector3(nx, ny, nz),
        scale,
        rot,
        color,
        vertexIndex: vIdx,
      });

      this.dummy.position.copy(pos);
      this.dummy.rotation.copy(rot);
      this.dummy.scale.setScalar(scale);
      this.dummy.updateMatrix();

      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
      this.instancedMesh.setColorAt(i, color);
    }

    // Hide remaining unused instances
    for (let i = this.activeCount; i < this.maxCount; i++) {
      this.dummy.position.set(0, -999, 0);
      this.dummy.scale.setScalar(0);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
    this.instancedMesh.computeBoundingSphere();
    this.group.add(this.instancedMesh);
  }

  /**
   * Synchronize topping positions with deformed vertex positions
   */
  public updatePositions(deformedPosAttr: THREE.BufferAttribute) {
    if (!this.instancedMesh || this.instances.length === 0) return;

    for (let i = 0; i < this.instances.length; i++) {
      const inst = this.instances[i];
      const vIdx = inst.vertexIndex;

      // New position of the parent vertex
      const vx = deformedPosAttr.getX(vIdx);
      const vy = deformedPosAttr.getY(vIdx);
      const vz = deformedPosAttr.getZ(vIdx);

      inst.pos.set(
        vx + inst.normal.x * 0.02,
        vy + inst.normal.y * 0.02,
        vz + inst.normal.z * 0.02
      );

      this.dummy.position.copy(inst.pos);
      this.dummy.rotation.copy(inst.rot);
      this.dummy.scale.setScalar(inst.scale);
      this.dummy.updateMatrix();

      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Check if poke hits near toppings to trigger ASMR crunch micro sounds
   */
  public checkCrunchImpact(hitPoint: THREE.Vector3, radius: number = 0.5) {
    let crunchCount = 0;
    for (let i = 0; i < this.instances.length; i++) {
      const d = this.instances[i].pos.distanceTo(hitPoint);
      if (d < radius) {
        crunchCount++;
        // Add tiny jitter to topping rotation for crunch feel
        this.instances[i].rot.x += (Math.random() - 0.5) * 0.8;
        this.instances[i].rot.y += (Math.random() - 0.5) * 0.8;
      }
    }

    if (crunchCount > 0) {
      // Extra crisp crunch pop!
      asmrEngine.playPop(1800 + Math.random() * 800, Math.min(0.4, 0.15 + crunchCount * 0.03));
    }
  }

  public dispose() {
    if (this.instancedMesh) {
      this.group.remove(this.instancedMesh);
      this.instancedMesh.geometry.dispose();
      if (Array.isArray(this.instancedMesh.material)) {
        this.instancedMesh.material.forEach((m) => m.dispose());
      } else {
        this.instancedMesh.material.dispose();
      }
      this.instancedMesh = null;
    }
  }
}
