import * as THREE from 'three';
import { Water as ThreeWater } from 'three/addons/objects/Water.js';

const WATER_NORMALS_URL =
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/waternormals.jpg';

export class Water {
  constructor(terrain, sunPosition) {
    this.terrain = terrain;
    this.sunPosition = sunPosition;
    this.textureLoader = new THREE.TextureLoader();
    this.mesh = this.createMesh();
  }

  createMesh() {
    const waterNormals = this.textureLoader.load(WATER_NORMALS_URL, (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
    });
    waterNormals.wrapS = THREE.RepeatWrapping;
    waterNormals.wrapT = THREE.RepeatWrapping;

    const waterRadius = this.terrain.basinRadius + this.terrain.bankWidth * 0.9;
    const geometry = new THREE.CircleGeometry(waterRadius, 96);
    const mesh = new ThreeWater(geometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: this.sunPosition.clone().normalize(),
      sunColor: 0xfff0c8,
      waterColor: 0x0a3540,
      distortionScale: 3.2,
      fog: true
    });

    mesh.rotation.x = -Math.PI * 0.5;
    mesh.position.set(
      this.terrain.basinCenter.x,
      this.terrain.waterLevel,
      this.terrain.basinCenter.y
    );
    mesh.name = 'Water';
    return mesh;
  }

  update(elapsed) {
    this.mesh.material.uniforms.time.value = elapsed;
  }
}
