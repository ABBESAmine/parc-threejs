import * as THREE from 'three';

export class Lights {
  constructor(sunPosition) {
    this.group = new THREE.Group();
    this.group.name = 'Scene lights';

    const hemisphere = new THREE.HemisphereLight(0xb9c7cf, 0x293016, 1.8);
    this.group.add(hemisphere);

    const sun = new THREE.DirectionalLight(0xffd49a, 3.4);
    sun.position.copy(sunPosition).multiplyScalar(85);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 190;
    sun.shadow.camera.left = -72;
    sun.shadow.camera.right = 72;
    sun.shadow.camera.top = 72;
    sun.shadow.camera.bottom = -72;
    sun.shadow.bias = -0.0005;
    this.group.add(sun);
  }
}
