import * as THREE from 'three';
import { fbm2D } from '../utils/noise.js';

export class Vegetation {
  constructor(terrain, { count = 2200, fieldSize = 188 } = {}) {
    this.terrain = terrain;
    this.count = count;
    this.fieldSize = fieldSize;
    this.textureLoader = new THREE.TextureLoader();
    this.mesh = this.createMesh();
  }

  loadTexture(path, colorSpace = THREE.NoColorSpace) {
    const texture = this.textureLoader.load(path);
    texture.colorSpace = colorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
    return texture;
  }

  createCrossPlaneGeometry() {
    const geometry = new THREE.BufferGeometry();
    const planeCount = 3;
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    let indexOffset = 0;

    for (let i = 0; i < planeCount; i += 1) {
      const angle = (Math.PI / planeCount) * i;
      const right = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).multiplyScalar(0.5);

      positions.push(
        -right.x, 0, -right.z,
        right.x, 0, right.z,
        -right.x, 1, -right.z,
        right.x, 1, right.z
      );

      normals.push(
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1
      );

      uvs.push(0, 0, 1, 0, 0, 1, 1, 1);
      indices.push(
        indexOffset,
        indexOffset + 1,
        indexOffset + 2,
        indexOffset + 2,
        indexOffset + 1,
        indexOffset + 3
      );
      indexOffset += 4;
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(uvs.slice(), 2));
    geometry.setIndex(indices);
    return geometry;
  }

  createMaterial(alphaIndex) {
    const basePath = './assets/assets';
    return new THREE.MeshStandardMaterial({
      map: this.loadTexture(`${basePath}/BaseColor_bush.png`, THREE.SRGBColorSpace),
      normalMap: this.loadTexture(`${basePath}/Normal_bush.png`),
      roughnessMap: this.loadTexture(`${basePath}/OcclusionRoughnessMetallic_bush.png`),
      aoMap: this.loadTexture(`${basePath}/OcclusionRoughnessMetallic_bush.png`),
      alphaMap: this.loadTexture(`${basePath}/alpha${alphaIndex}.png`),
      transparent: true,
      alphaTest: 0.45,
      side: THREE.DoubleSide,
      roughness: 0.96,
      metalness: 0,
      color: 0xd7dec0
    });
  }

  createMesh() {
    const group = new THREE.Group();
    group.name = 'Instanced bushes';

    const geometry = this.createCrossPlaneGeometry();
    const variants = 5;
    const perVariant = Math.floor(this.count / variants);
    const remainder = this.count % variants;

    for (let alphaIndex = 1; alphaIndex <= variants; alphaIndex += 1) {
      const instances = perVariant + (alphaIndex <= remainder ? 1 : 0);
      const patch = this.createInstancedPatch(
        geometry,
        this.createMaterial(alphaIndex),
        instances,
        alphaIndex
      );
      group.add(patch);
    }

    return group;
  }

  createInstancedPatch(geometry, material, instances, variantIndex) {
    const mesh = new THREE.InstancedMesh(geometry, material, instances);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const euler = new THREE.Euler();

    for (let i = 0; i < instances; i += 1) {
      const sample = this.samplePlacement(variantIndex);
      position.set(sample.x, sample.y - 0.04, sample.z);

      euler.set(0, Math.random() * Math.PI * 2, 0);
      quaternion.setFromEuler(euler);

      const height = 2 + Math.random() * 2.8;
      const width = height * (0.7 + Math.random() * 0.4);
      scale.set(width, height, width);

      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(i, matrix);
    }

    mesh.name = `Bush patch ${variantIndex}`;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    return mesh;
  }

  samplePlacement(variantIndex) {
    let x = 0;
    let z = 0;
    let y = 0;

    for (let attempt = 0; attempt < 24; attempt += 1) {
      const radius = Math.sqrt(Math.random()) * this.fieldSize * 0.5;
      const angle = Math.random() * Math.PI * 2 + variantIndex * 0.61;
      x = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius - 22;
      y = this.terrain.getHeightAt(x, z);

      const pathMask = Math.exp(-Math.abs(x) * 0.12);
      const edgeBias = fbm2D(x * 0.028 + 12, z * 0.028 - 8, 4);
      const clusterNoise = fbm2D(x * 0.055 - 5, z * 0.055 + 19, 3);
      const validSlope = y > -5.8 && y < 3.9;

      if (pathMask < 0.16 && edgeBias > 0.34 && clusterNoise > 0.28 && validSlope) {
        return { x, y, z };
      }
    }

    y = this.terrain.getHeightAt(x, z);
    return { x, y, z };
  }
}
