import * as THREE from 'three';
import { fbm2D } from '../utils/noise.js';
import { createGroundTextures } from '../utils/proceduralTextures.js';

export class Terrain {
  constructor({ size = 220, segments = 256 } = {}) {
    this.size = size;
    this.segments = segments;
    this.halfSize = size * 0.5;
    this.basinCenter = new THREE.Vector2(0, -8);
    this.basinRadius = 30;
    this.bankWidth = 10;
    this.waterLevel = -6.2;

    const geometry = this.createGeometry();
    const textures = createGroundTextures();
    const material = new THREE.MeshStandardMaterial({
      map: textures.map,
      normalMap: textures.normalMap,
      normalScale: new THREE.Vector2(0.58, 0.58),
      roughnessMap: textures.roughnessMap,
      roughness: 0.92,
      metalness: 0,
      color: 0xd5e2bd
    });
    this.applySnowAccumulation(material);

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.name = 'Procedural terrain';
    this.mesh.receiveShadow = true;
  }

  createGeometry() {
    const row = this.segments + 1;
    const positions = new Float32Array(row * row * 3);
    const uvs = new Float32Array(row * row * 2);
    const indices = [];

    for (let zIndex = 0; zIndex <= this.segments; zIndex += 1) {
      for (let xIndex = 0; xIndex <= this.segments; xIndex += 1) {
        const vertex = zIndex * row + xIndex;
        const x = (xIndex / this.segments - 0.5) * this.size;
        const z = (zIndex / this.segments - 0.5) * this.size;
        const y = this.getHeightAt(x, z);

        positions[vertex * 3] = x;
        positions[vertex * 3 + 1] = y;
        positions[vertex * 3 + 2] = z;
        uvs[vertex * 2] = xIndex / this.segments;
        uvs[vertex * 2 + 1] = zIndex / this.segments;
      }
    }

    for (let zIndex = 0; zIndex < this.segments; zIndex += 1) {
      for (let xIndex = 0; xIndex < this.segments; xIndex += 1) {
        const a = zIndex * row + xIndex;
        const b = a + 1;
        const c = (zIndex + 1) * row + xIndex;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  applySnowAccumulation(material) {
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uBasinCenter = {
        value: new THREE.Vector2(this.basinCenter.x, this.basinCenter.y)
      };
      shader.uniforms.uBasinRadius = { value: this.basinRadius };
      shader.uniforms.uTrailStart = { value: new THREE.Vector2(-56, 62) };
      shader.uniforms.uTrailEnd = { value: new THREE.Vector2(this.basinCenter.x + 8, this.basinCenter.y + 26) };

      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vWorldPosition;\nvarying vec3 vWorldNormal;'
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        [
          '#include <worldpos_vertex>',
          'vWorldPosition = worldPosition.xyz;',
          'vWorldNormal = normalize(mat3(modelMatrix) * normal);'
        ].join('\n')
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        [
          '#include <common>',
          'uniform vec2 uBasinCenter;',
          'uniform float uBasinRadius;',
          'uniform vec2 uTrailStart;',
          'uniform vec2 uTrailEnd;',
          'varying vec3 vWorldPosition;',
          'varying vec3 vWorldNormal;'
        ].join('\n')
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        [
          '#ifdef USE_MAP',
          'vec4 sampledDiffuseColor = texture2D(map, vMapUv);',
          'diffuseColor *= sampledDiffuseColor;',
          '#endif',
          'float slopeSnow = smoothstep(0.55, 0.96, vWorldNormal.y);',
          'float heightSnow = smoothstep(-0.6, 6.8, vWorldPosition.y);',
          'float patchNoise = sin(vWorldPosition.x * 0.11) * cos(vWorldPosition.z * 0.09) * 0.5 + 0.5;',
          'float distanceToLake = distance(vWorldPosition.xz, uBasinCenter);',
          'float lakeMoisture = 1.0 - smoothstep(uBasinRadius + 2.0, uBasinRadius + 18.0, distanceToLake);',
          'vec2 trailVector = uTrailEnd - uTrailStart;',
          'float trailLengthSquared = max(dot(trailVector, trailVector), 0.0001);',
          'float trailProjection = clamp(dot(vWorldPosition.xz - uTrailStart, trailVector) / trailLengthSquared, 0.0, 1.0);',
          'vec2 closestTrailPoint = uTrailStart + trailVector * trailProjection;',
          'float trailDistance = distance(vWorldPosition.xz, closestTrailPoint);',
          'float centerSway = sin(trailProjection * 14.0) * 1.8;',
          'float trailShape = 1.0 - smoothstep(1.4, 6.8, abs(trailDistance - centerSway));',
          'float printPattern = smoothstep(0.42, 0.92, sin(trailProjection * 78.0) * 0.5 + 0.5);',
          'float wornTrail = trailShape * (0.45 + printPattern * 0.55);',
          'float snowMask = clamp(slopeSnow * 0.58 + heightSnow * 0.34 + patchNoise * 0.16 - lakeMoisture * 0.22 - wornTrail * 0.5, 0.0, 0.85);',
          'vec3 snowColor = vec3(0.92, 0.95, 0.97);',
          'diffuseColor.rgb = mix(diffuseColor.rgb, snowColor, snowMask);'
        ].join('\n')
      );
    };

    material.needsUpdate = true;
  }

  getHeightAt(x, z) {
    const broad = fbm2D(x * 0.009 + 11.4, z * 0.009 - 3.7, 5);
    const slow = fbm2D(x * 0.017 - 6.8, z * 0.017 + 4.6, 5);
    const medium = fbm2D(x * 0.042 - 4.2, z * 0.042 + 8.1, 4);
    const detail = fbm2D(x * 0.11 + 17.3, z * 0.11 - 9.2, 3);

    const ridgeA = Math.abs(fbm2D(x * 0.021 + 30, z * 0.015 - 10, 4) - 0.5);
    const ridgeB = Math.abs(fbm2D(x * 0.014 - 22, z * 0.024 + 15, 4) - 0.5);
    const ridgeMask = Math.max(0, 1 - Math.exp(-Math.abs(x) * 0.045));

    const path = Math.exp(-Math.abs(x) * 0.05);
    const corridor = Math.exp(-Math.abs(x) * 0.16) * 0.44;
    const valley = Math.exp(-(x * x) * 0.0011) * Math.exp(-((z + 18) * (z + 18)) * 0.00018);
    const dx = x - this.basinCenter.x;
    const dz = z - this.basinCenter.y;
    const distanceToBasin = Math.hypot(dx, dz);
    const basinFalloff = 1 - THREE.MathUtils.smoothstep(distanceToBasin, this.basinRadius, this.basinRadius + this.bankWidth);
    const basinShape = Math.max(0, 1 - distanceToBasin / this.basinRadius);
    const basinDepth = basinFalloff * (7.8 + basinShape * 4.6);
    const waterReach = this.basinRadius + this.bankWidth * 0.9;
    const shorelineInner = THREE.MathUtils.smoothstep(distanceToBasin, waterReach - 10, waterReach - 2.5);
    const shorelineOuter = 1 - THREE.MathUtils.smoothstep(distanceToBasin, waterReach - 1.5, waterReach + 6.5);
    const shorelineRim = shorelineInner * shorelineOuter;
    const shorelineLift = shorelineRim * 3.8;

    return (broad - 0.5) * 15.5
      + (slow - 0.5) * 8.1
      + (medium - 0.5) * 4.2
      + (detail - 0.5) * 1.25
      + (ridgeA + ridgeB - 0.5) * 10.4 * ridgeMask
      - path * 1.15
      - corridor
      - valley * 1.55
      - basinDepth
      + shorelineLift;
  }
}
