import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

export class SkyDome {
  constructor(renderer) {
    this.mesh = new Sky();
    this.mesh.name = 'Procedural sky';
    this.mesh.scale.setScalar(450000);
    this.sunPosition = new THREE.Vector3();

    const uniforms = this.mesh.material.uniforms;
    uniforms.turbidity.value = 7.4;
    uniforms.rayleigh.value = 1.35;
    uniforms.mieCoefficient.value = 0.012;
    uniforms.mieDirectionalG.value = 0.78;

    this.setSun(88, 2.2);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const environment = pmremGenerator.fromScene(this.mesh).texture;
    renderer.setClearColor(0x98a9aa, 1);
    this.environment = environment;
  }

  setSun(azimuth, elevation) {
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);

    this.sunPosition.setFromSphericalCoords(1, phi, theta);
    this.mesh.material.uniforms.sunPosition.value.copy(this.sunPosition);
  }
}
