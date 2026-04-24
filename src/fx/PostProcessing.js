import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import * as THREE from 'three';

export class PostProcessing {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    this.composer = new EffectComposer(renderer);
    this.renderPass = new RenderPass(scene, camera);
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.58,
      0.42,
      0.82
    );

    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloomPass);
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.composer.setSize(width, height);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.bloomPass.setSize(width, height);
  }

  render() {
    this.composer.render();
  }
}
