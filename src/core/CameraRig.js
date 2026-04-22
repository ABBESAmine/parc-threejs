import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class CameraRig {
  constructor(domElement) {
    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 450);
    this.camera.position.set(0, 5.5, 33);

    this.controls = new OrbitControls(this.camera, domElement);
    this.controls.target.set(0, 2.2, -40);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.minDistance = 12;
    this.controls.maxDistance = 120;
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  update() {
    this.controls.update();
  }
}
