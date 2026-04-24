import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { fbm2D } from '../utils/noise.js';

function loadGLTFTexture(loader, path, isColor, anisotropy) {
  const texture = loader.load(path);
  texture.flipY = false;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = anisotropy;

  if (isColor) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }

  return texture;
}

export class Trees {
  constructor(terrain, renderer, { count = 90, fieldSize = 286 } = {}) {
    this.terrain = terrain;
    this.renderer = renderer;
    this.count = count;
    this.fieldSize = fieldSize;
    this.group = new THREE.Group();
    this.group.name = 'Tree forest';
    this.loader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/gltf/');
    this.loader.setDRACOLoader(this.dracoLoader);
    this.textureLoader = new THREE.TextureLoader();
    this.isReady = false;
    this.anchorPositions = [
      { x: -18, z: 12 },
      { x: 20, z: 8 },
      { x: -28, z: -4 },
      { x: 48, z: 18 },
      { x: -52, z: 20 },
      { x: 58, z: -42 },
      { x: -60, z: -52 },
      { x: 72, z: -76 }
    ];

    this.load();
  }

  async load() {
    const anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    const colorHD = loadGLTFTexture(
      this.textureLoader,
      './assets/color-512_1.jpg',
      true,
      anisotropy
    );
    const normalHD = loadGLTFTexture(
      this.textureLoader,
      './assets/normal-512.jpg',
      false,
      anisotropy
    );
    const rmaoHD = loadGLTFTexture(
      this.textureLoader,
      './assets/rmao-512.jpg',
      false,
      anisotropy
    );

    this.matHD = new THREE.MeshStandardMaterial({
      map: colorHD,
      normalMap: normalHD,
      normalScale: new THREE.Vector2(0.55, 0.55),
      roughnessMap: rmaoHD,
      alphaTest: 0.5,
      transparent: true,
      metalness: 0,
      roughness: 0.92,
      side: THREE.DoubleSide
    });

    this.matMID = new THREE.MeshStandardMaterial({
      map: colorHD,
      alphaTest: 0.5,
      transparent: true,
      side: THREE.DoubleSide,
      roughness: 0.9,
      metalness: 0
    });

    this.impostorTexture = this.textureLoader.load('./assets/impostor.png');
    this.impostorTexture.colorSpace = THREE.SRGBColorSpace;
    this.impostorTexture.anisotropy = anisotropy;

    try {
      const gltf = await this.loader.loadAsync('./assets/tree.glb');
      this.source = gltf.scene;
      this.prepareSource();
    } catch (error) {
      console.error('Unable to load trees', error);
      this.source = this.createFallbackTree();
    }

    this.populate();
    this.isReady = true;
  }

  prepareSource() {
    this.source.traverse((obj) => {
      if (!obj.isMesh) {
        return;
      }

      if (obj.geometry && !obj.geometry.attributes.uv2 && obj.geometry.attributes.uv) {
        obj.geometry.setAttribute('uv2', obj.geometry.attributes.uv);
      }

      obj.castShadow = true;
      obj.receiveShadow = true;
      obj.frustumCulled = true;
    });

    this.source.updateMatrixWorld(true);
    const bbox = new THREE.Box3().setFromObject(this.source);
    const feetOffset = bbox.min.y;

    this.source.traverse((obj) => {
      if (obj.isMesh && obj.geometry) {
        obj.geometry = obj.geometry.clone();
        obj.geometry.translate(0, -feetOffset, 0);
      }
    });

    this.source.updateMatrixWorld(true);
  }

  createFallbackTree() {
    const group = new THREE.Group();

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.44, 4.2, 8),
      new THREE.MeshStandardMaterial({
        color: 0x6a4728,
        roughness: 0.95,
        metalness: 0
      })
    );
    trunk.position.y = 2.1;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    const foliage = new THREE.Mesh(
      new THREE.ConeGeometry(2.5, 5.8, 8),
      new THREE.MeshStandardMaterial({
        color: 0x6f8e48,
        roughness: 0.98,
        metalness: 0
      })
    );
    foliage.position.y = 5.9;
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    group.add(foliage);

    return group;
  }

  createImpostor() {
    const material = new THREE.SpriteMaterial({
      map: this.impostorTexture,
      alphaTest: 0.5,
      depthWrite: true
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(5.5, 6.5, 1);
    sprite.position.y = 3;
    return sprite;
  }

  createTreeLOD() {
    const lod = new THREE.LOD();

    const hd = this.source.clone(true);
    hd.traverse((obj) => {
      if (obj.isMesh) {
        obj.material = this.matHD;
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    lod.addLevel(hd, 0);

    const mid = this.source.clone(true);
    mid.traverse((obj) => {
      if (obj.isMesh) {
        obj.material = this.matMID;
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    lod.addLevel(mid, 42);

    lod.addLevel(this.createImpostor(), 105);
    return lod;
  }

  populate() {
    for (let i = 0; i < this.count; i += 1) {
      const sample = this.samplePlacement(i);
      const lod = this.createTreeLOD();
      const scale = 1.85 + Math.random() * 1.45;

      lod.position.set(sample.x, this.groundY(sample.x, sample.z, scale), sample.z);
      lod.rotation.y = Math.random() * Math.PI * 2;
      lod.scale.setScalar(scale);
      this.group.add(lod);
    }
  }

  groundY(x, z, scale) {
    const radius = 1.4 * scale;
    let minHeight = this.terrain.getHeightAt(x, z);
    const samples = 8;

    for (let i = 0; i < samples; i += 1) {
      const angle = (i / samples) * Math.PI * 2;
      const sampleX = x + Math.cos(angle) * radius;
      const sampleZ = z + Math.sin(angle) * radius;
      const sampleHeight = this.terrain.getHeightAt(sampleX, sampleZ);
      if (sampleHeight < minHeight) {
        minHeight = sampleHeight;
      }
    }

    return minHeight - 0.35 * scale;
  }

  samplePlacement(index) {
    const exclusionRadius = this.terrain.basinRadius + this.terrain.bankWidth + 18;

    if (index < this.anchorPositions.length) {
      const anchor = this.anchorPositions[index];
      const anchorDistanceToLake = Math.hypot(
        anchor.x - this.terrain.basinCenter.x,
        anchor.z - this.terrain.basinCenter.y
      );

      if (anchorDistanceToLake > exclusionRadius) {
        return anchor;
      }
    }

    let x = 0;
    let z = 0;

    for (let attempt = 0; attempt < 60; attempt += 1) {
      const radius = Math.sqrt(Math.random()) * this.fieldSize * 0.5;
      const angle = Math.random() * Math.PI * 2 + index * 0.19;
      x = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius - 26;

      const y = this.terrain.getHeightAt(x, z);
      const pathMask = Math.exp(-Math.abs(x) * 0.12);
      const cluster = fbm2D(x * 0.021 + 14, z * 0.021 - 7, 4);
      const edgeBias = fbm2D(x * 0.008 - 3, z * 0.008 + 21, 3);
      const distanceToLake = Math.hypot(
        x - this.terrain.basinCenter.x,
        z - this.terrain.basinCenter.y
      );

      if (
        pathMask < 0.11 &&
        cluster > 0.46 &&
        edgeBias > 0.38 &&
        y > -12 &&
        y < 15 &&
        distanceToLake > exclusionRadius
      ) {
        return { x, z };
      }
    }

    const fallbackAngle = Math.random() * Math.PI * 2;
    return {
      x: this.terrain.basinCenter.x + Math.cos(fallbackAngle) * (exclusionRadius + 24),
      z: this.terrain.basinCenter.y + Math.sin(fallbackAngle) * (exclusionRadius + 24)
    };
  }

  update() {}
}
