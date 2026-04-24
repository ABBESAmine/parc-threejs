import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { Renderer } from './core/Renderer.js';
import { CameraRig } from './core/CameraRig.js';
import { Terrain } from './world/Terrain.js';
import { Grass } from './world/Grass.js';
import { Vegetation } from './world/Vegetation.js';
import { Trees } from './world/Trees.js';
import { Water } from './world/Water.js';
import { StoryProps } from './world/StoryProps.js';
import { SkyDome } from './world/SkyDome.js';
import { Lights } from './fx/Lights.js';
import { Snow } from './fx/Snow.js';
import { PostProcessing } from './fx/PostProcessing.js';

const canvas = document.querySelector('#scene');
const renderer = new Renderer(canvas);
const scene = new THREE.Scene();
const cameraRig = new CameraRig(renderer.domElement);
const clock = new THREE.Clock();
const stats = new Stats();

document.body.appendChild(stats.dom);

const terrain = new Terrain({
  size: 420,
  segments: 360
});
scene.add(terrain.mesh);

const sky = new SkyDome(renderer.instance);
scene.add(sky.mesh);
scene.environment = sky.environment;

const lights = new Lights(sky.sunPosition);
scene.add(lights.group);
scene.fog = new THREE.FogExp2(0x9aa9a7, 0.011);

const grass = new Grass(terrain, {
  count: 24000,
  fieldSize: 268
});
scene.add(grass.mesh);

const vegetation = new Vegetation(terrain, {
  count: 3400,
  fieldSize: 258
});
scene.add(vegetation.mesh);

const trees = new Trees(terrain, renderer.instance, {
  count: 110,
  fieldSize: 286
});
scene.add(trees.group);

const water = new Water(terrain, sky.sunPosition);
scene.add(water.mesh);

const storyProps = new StoryProps(terrain);
scene.add(storyProps.group);

const snow = new Snow(terrain, {
  count: 2600,
  area: 280,
  height: 92
});
scene.add(snow.points);

const postProcessing = new PostProcessing(renderer.instance, scene, cameraRig.camera);

function onResize() {
  renderer.resize();
  cameraRig.resize();
  snow.resize();
  postProcessing.resize();
}

window.addEventListener('resize', onResize);
onResize();

renderer.instance.setAnimationLoop(() => {
  const delta = Math.min(clock.getDelta(), 0.033);
  const elapsed = clock.elapsedTime;

  cameraRig.update();
  grass.update(elapsed);
  trees.update();
  water.update(elapsed);
  snow.update(delta, elapsed);

  postProcessing.render();
  stats.update();
});
