import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { Renderer } from './core/Renderer.js';
import { CameraRig } from './core/CameraRig.js';
import { Terrain } from './world/Terrain.js';
import { Grass } from './world/Grass.js';
import { SkyDome } from './world/SkyDome.js';
import { Lights } from './fx/Lights.js';

const canvas = document.querySelector('#scene');
const renderer = new Renderer(canvas);
const scene = new THREE.Scene();
const cameraRig = new CameraRig(renderer.domElement);
const clock = new THREE.Clock();
const stats = new Stats();

document.body.appendChild(stats.dom);

const terrain = new Terrain({
  size: 220,
  segments: 256
});
scene.add(terrain.mesh);

const sky = new SkyDome(renderer.instance);
scene.add(sky.mesh);
scene.environment = sky.environment;

const lights = new Lights(sky.sunPosition);
scene.add(lights.group);
scene.fog = new THREE.FogExp2(0x9aa9a7, 0.011);

const grass = new Grass(terrain, {
  count: 18000,
  fieldSize: 196
});
scene.add(grass.mesh);

function onResize() {
  renderer.resize();
  cameraRig.resize();
}

window.addEventListener('resize', onResize);
onResize();

renderer.instance.setAnimationLoop(() => {
  const elapsed = clock.getElapsedTime();

  cameraRig.update();
  grass.update(elapsed);

  renderer.instance.render(scene, cameraRig.camera);
  stats.update();
});
