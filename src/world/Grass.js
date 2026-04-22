import * as THREE from 'three';
import { fbm2D } from '../utils/noise.js';

export class Grass {
  constructor(terrain, { count = 16000, fieldSize = 190 } = {}) {
    this.terrain = terrain;
    this.count = count;
    this.fieldSize = fieldSize;
    this.windUniform = { value: 0 };
    this.textureLoader = new THREE.TextureLoader();
    this.mesh = this.createMesh();
  }

  createBladeGeometry() {
    const geometry = new THREE.BufferGeometry();
    const planes = 3;
    const positions = [];
    const uvs = [];
    const indices = [];
    let indexOffset = 0;

    for (let i = 0; i < planes; i += 1) {
      const angle = (Math.PI / planes) * i;
      const right = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).multiplyScalar(0.5);

      positions.push(
        -right.x, 0, -right.z,
        right.x, 0, right.z,
        -right.x, 1, -right.z,
        right.x, 1, right.z
      );
      uvs.push(0, 0, 1, 0, 0, 1, 1, 1);
      indices.push(indexOffset, indexOffset + 1, indexOffset + 2, indexOffset + 2, indexOffset + 1, indexOffset + 3);
      indexOffset += 4;
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  loadTexture(path, colorSpace = THREE.NoColorSpace) {
    const texture = this.textureLoader.load(path);
    texture.colorSpace = colorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
    return texture;
  }

  createMaterial(tileIndex) {
    const material = new THREE.MeshStandardMaterial({
      map: this.loadTexture(`./assets/grass_tiles/color_grass_${tileIndex}.png`, THREE.SRGBColorSpace),
      normalMap: this.loadTexture(`./assets/grass_tiles/normal_grass_${tileIndex}.png`),
      roughnessMap: this.loadTexture(`./assets/grass_tiles/rmao_grass_${tileIndex}.png`),
      normalScale: new THREE.Vector2(0.48, 0.48),
      transparent: true,
      alphaTest: 0.28,
      side: THREE.DoubleSide,
      depthWrite: true,
      roughness: 1,
      metalness: 0,
      color: 0xc4d88b
    });

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.windUniform;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        '#include <common>\nuniform float uTime;'
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        [
          '#include <begin_vertex>',
          'float gust = sin(uTime * 1.7 + instanceMatrix[3].x * 0.23 + instanceMatrix[3].z * 0.17);',
          'float flutter = sin(uTime * 4.2 + instanceMatrix[3].z * 0.41);',
          'transformed.x += (gust * 0.13 + flutter * 0.035) * uv.y * uv.y;',
          'transformed.z += cos(uTime * 1.35 + instanceMatrix[3].x * 0.19) * 0.08 * uv.y * uv.y;'
        ].join('\n')
      );
    };

    return material;
  }

  createMesh() {
    const geometry = this.createBladeGeometry();
    const group = new THREE.Group();
    group.name = 'Instanced wind grass';

    const perTile = Math.floor(this.count / 4);
    const remainder = this.count % 4;

    for (let tileIndex = 1; tileIndex <= 4; tileIndex += 1) {
      const instances = perTile + (tileIndex <= remainder ? 1 : 0);
      const mesh = this.createInstancedPatch(geometry, this.createMaterial(tileIndex), instances, tileIndex);
      group.add(mesh);
    }

    return group;
  }

  createInstancedPatch(geometry, material, instances, tileIndex) {
    const mesh = new THREE.InstancedMesh(geometry, material, instances);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const euler = new THREE.Euler();

    for (let i = 0; i < instances; i += 1) {
      const radius = Math.sqrt(Math.random()) * this.fieldSize * 0.5;
      const angle = Math.random() * Math.PI * 2 + tileIndex * 0.37;
      let x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius - 16;

      const pathMask = Math.exp(-Math.abs(x) * 0.12);
      if (Math.random() < pathMask * 0.55) {
        x += Math.sign(x || Math.random() - 0.5) * (5 + Math.random() * 14);
      }

      const density = fbm2D(x * 0.045 + 50, z * 0.045 - 12, 4);
      if (density < 0.22) {
        x += 8 + Math.random() * 18;
      }

      const y = this.terrain.getHeightAt(x, z);
      position.set(x, y - 0.08, z);
      euler.set(0, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.16);
      quaternion.setFromEuler(euler);

      const height = 0.8 + Math.random() * 1.65;
      const width = 0.42 + Math.random() * 0.54;
      scale.set(width, height, width);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(i, matrix);
    }

    mesh.name = `Instanced wind grass tile ${tileIndex}`;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  update(elapsed) {
    this.windUniform.value = elapsed;
  }
}
