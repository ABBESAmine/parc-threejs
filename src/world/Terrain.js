import * as THREE from 'three';
import { fbm2D } from '../utils/noise.js';
import { createGroundTextures } from '../utils/proceduralTextures.js';

export class Terrain {
  constructor({ size = 220, segments = 256 } = {}) {
    this.size = size;
    this.segments = segments;
    this.halfSize = size * 0.5;

    const geometry = this.createGeometry();
    const textures = createGroundTextures();
    const material = new THREE.MeshStandardMaterial({
      map: textures.map,
      normalMap: textures.normalMap,
      normalScale: new THREE.Vector2(0.58, 0.58),
      roughnessMap: textures.roughnessMap,
      roughness: 0.92,
      metalness: 0,
      color: 0xd5e2bd
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.name = 'Procedural terrain';
    this.mesh.receiveShadow = true;
  }

  createGeometry() {
    const row = this.segments + 1;
    const positions = new Float32Array(row * row * 3);
    const uvs = new Float32Array(row * row * 2);
    const indices = [];

    for (let zIndex = 0; zIndex <= this.segments; zIndex += 1) {
      for (let xIndex = 0; xIndex <= this.segments; xIndex += 1) {
        const vertex = zIndex * row + xIndex;
        const x = (xIndex / this.segments - 0.5) * this.size;
        const z = (zIndex / this.segments - 0.5) * this.size;
        const y = this.getHeightAt(x, z);

        positions[vertex * 3] = x;
        positions[vertex * 3 + 1] = y;
        positions[vertex * 3 + 2] = z;
        uvs[vertex * 2] = xIndex / this.segments;
        uvs[vertex * 2 + 1] = zIndex / this.segments;
      }
    }

    for (let zIndex = 0; zIndex < this.segments; zIndex += 1) {
      for (let xIndex = 0; xIndex < this.segments; xIndex += 1) {
        const a = zIndex * row + xIndex;
        const b = a + 1;
        const c = (zIndex + 1) * row + xIndex;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  getHeightAt(x, z) {
    const slow = fbm2D(x * 0.012 + 11.4, z * 0.012 - 3.7, 5);
    const medium = fbm2D(x * 0.038 - 4.2, z * 0.038 + 8.1, 4);
    const path = Math.exp(-Math.abs(x) * 0.055);
    const corridor = Math.exp(-Math.abs(x) * 0.16) * 0.42;
    return (slow - 0.5) * 7.2 + (medium - 0.5) * 1.75 - path * 1.15 - corridor;
  }
}
