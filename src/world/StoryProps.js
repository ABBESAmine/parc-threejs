import * as THREE from 'three';

export class StoryProps {
  constructor(terrain) {
    this.terrain = terrain;
    this.group = new THREE.Group();
    this.group.name = 'Story props';
    this.createRocks();
    this.createFallenLog();
    this.createLakeFence();
    this.createDock();
  }

  createRocks() {
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x7d837f,
      roughness: 0.98,
      metalness: 0
    });

    for (let i = 0; i < 9; i += 1) {
      const radius = this.terrain.basinRadius + 8 + Math.random() * 12;
      const angle = 0.6 + i * 0.52;
      const x = this.terrain.basinCenter.x + Math.cos(angle) * radius;
      const z = this.terrain.basinCenter.y + Math.sin(angle) * radius;
      const y = this.terrain.getHeightAt(x, z);
      const rock = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.6 + Math.random() * 1.8, 0),
        rockMaterial
      );
      rock.position.set(x, y + 0.4, z);
      rock.rotation.set(Math.random(), Math.random() * Math.PI, Math.random());
      rock.scale.set(
        1 + Math.random() * 1.4,
        0.7 + Math.random() * 0.8,
        0.9 + Math.random() * 1.2
      );
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.group.add(rock);
    }
  }

  createFallenLog() {
    const log = new THREE.Group();
    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x735339,
      roughness: 0.96,
      metalness: 0
    });

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.92, 13, 10),
      woodMaterial
    );
    trunk.rotation.z = Math.PI * 0.5;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    log.add(trunk);

    for (let i = 0; i < 3; i += 1) {
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.28, 3.5 + Math.random() * 1.8, 7),
        woodMaterial
      );
      branch.position.set(-2 + i * 2.8, 0.4 + Math.random() * 0.5, (Math.random() - 0.5) * 0.9);
      branch.rotation.z = Math.PI * (0.25 + Math.random() * 0.2);
      branch.rotation.y = (Math.random() - 0.5) * 0.8;
      branch.castShadow = true;
      branch.receiveShadow = true;
      log.add(branch);
    }

    const x = this.terrain.basinCenter.x + this.terrain.basinRadius + 18;
    const z = this.terrain.basinCenter.y + 8;
    const y = this.terrain.getHeightAt(x, z);
    log.position.set(x, y + 0.7, z);
    log.rotation.y = -0.55;
    this.group.add(log);
  }

  createLakeFence() {
    const fence = new THREE.Group();
    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x6a4a2f,
      roughness: 0.98,
      metalness: 0
    });
    const postGeometry = new THREE.CylinderGeometry(0.14, 0.18, 2.1, 6);
    const railGeometry = new THREE.CylinderGeometry(0.07, 0.09, 2.35, 6);
    const ringRadius = this.terrain.basinRadius + this.terrain.bankWidth + 6;
    const postCount = 34;

    for (let i = 0; i < postCount; i += 1) {
      const angle = (i / postCount) * Math.PI * 2;
      const x = this.terrain.basinCenter.x + Math.cos(angle) * ringRadius;
      const z = this.terrain.basinCenter.y + Math.sin(angle) * ringRadius;
      const y = this.terrain.getHeightAt(x, z);

      const post = new THREE.Mesh(postGeometry, woodMaterial);
      post.position.set(x, y + 1.02, z);
      post.rotation.z = (Math.random() - 0.5) * 0.06;
      post.castShadow = true;
      post.receiveShadow = true;
      fence.add(post);
    }

    for (let i = 0; i < postCount; i += 1) {
      const currentAngle = (i / postCount) * Math.PI * 2;
      const nextAngle = ((i + 1) / postCount) * Math.PI * 2;
      const x1 = this.terrain.basinCenter.x + Math.cos(currentAngle) * ringRadius;
      const z1 = this.terrain.basinCenter.y + Math.sin(currentAngle) * ringRadius;
      const x2 = this.terrain.basinCenter.x + Math.cos(nextAngle) * ringRadius;
      const z2 = this.terrain.basinCenter.y + Math.sin(nextAngle) * ringRadius;
      const y1 = this.terrain.getHeightAt(x1, z1) + 1.45;
      const y2 = this.terrain.getHeightAt(x2, z2) + 1.45;

      this.addRail(fence, woodMaterial, railGeometry, new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2));
      this.addRail(fence, woodMaterial, railGeometry, new THREE.Vector3(x1, y1 - 0.48, z1), new THREE.Vector3(x2, y2 - 0.48, z2));
    }

    this.group.add(fence);
  }

  addRail(parent, material, geometry, start, end) {
    const rail = new THREE.Mesh(geometry, material);
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();

    rail.scale.y = length / 2.35;
    rail.position.copy(midpoint);
    rail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    rail.castShadow = true;
    rail.receiveShadow = true;
    parent.add(rail);
  }

  createDock() {
    const dock = new THREE.Group();
    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x7a5737,
      roughness: 0.96,
      metalness: 0
    });
    const supportMaterial = new THREE.MeshStandardMaterial({
      color: 0x5d4129,
      roughness: 0.98,
      metalness: 0
    });

    const angle = -0.24;
    const shoreRadius = this.terrain.basinRadius + this.terrain.bankWidth + 1.2;
    const waterReach = this.terrain.basinRadius - 17;
    const startX = this.terrain.basinCenter.x + Math.cos(angle) * shoreRadius;
    const startZ = this.terrain.basinCenter.y + Math.sin(angle) * shoreRadius;
    const endX = this.terrain.basinCenter.x + Math.cos(angle) * waterReach;
    const endZ = this.terrain.basinCenter.y + Math.sin(angle) * waterReach;
    const startY = this.terrain.getHeightAt(startX, startZ) + 0.18;
    const endY = startY - 0.12;

    const start = new THREE.Vector3(startX, startY, startZ);
    const end = new THREE.Vector3(endX, endY, endZ);
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const dockDirection = direction.clone().normalize();
    const right = new THREE.Vector3(-dockDirection.z, 0, dockDirection.x).normalize();

    const deck = new THREE.Group();

    for (let i = 0; i < 10; i += 1) {
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(0.54, 0.12, length * 0.985),
        woodMaterial
      );
      const offset = (i - 4.5) * 0.56;
      plank.position.copy(center).add(right.clone().multiplyScalar(offset));
      plank.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dockDirection);
      plank.rotation.z += (Math.random() - 0.5) * 0.03;
      plank.castShadow = true;
      plank.receiveShadow = true;
      deck.add(plank);
    }

    const crossBeamA = new THREE.Mesh(
      new THREE.BoxGeometry(5.8, 0.18, 0.34),
      supportMaterial
    );
    crossBeamA.position.copy(start.clone().lerp(end, 0.28)).add(new THREE.Vector3(0, -0.18, 0));
    crossBeamA.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), right);
    crossBeamA.castShadow = true;
    crossBeamA.receiveShadow = true;
    deck.add(crossBeamA);

    const crossBeamB = crossBeamA.clone();
    crossBeamB.position.copy(start.clone().lerp(end, 0.74)).add(new THREE.Vector3(0, -0.18, 0));
    deck.add(crossBeamB);

    const supportOffsets = [
      { along: 0.04, side: -1.45 },
      { along: 0.04, side: 1.45 },
      { along: 0.34, side: -1.75 },
      { along: 0.34, side: 1.75 },
      { along: 0.68, side: -1.65 },
      { along: 0.68, side: 1.65 },
      { along: 0.94, side: -1.35 },
      { along: 0.94, side: 1.35 }
    ];

    for (const offset of supportOffsets) {
      const base = start.clone().lerp(end, offset.along).add(right.clone().multiplyScalar(offset.side));
      const groundY = Math.max(this.terrain.getHeightAt(base.x, base.z), this.terrain.waterLevel - 1.8);
      const visibleHeight = base.y - groundY + 1.3;
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.26, visibleHeight, 8),
        supportMaterial
      );
      post.position.set(base.x, groundY + visibleHeight * 0.5 - 0.15, base.z);
      post.rotation.z = (Math.random() - 0.5) * 0.04;
      post.castShadow = true;
      post.receiveShadow = true;
      dock.add(post);
    }

    const endPlatform = new THREE.Mesh(
      new THREE.BoxGeometry(5.8, 0.14, 4.4),
      woodMaterial
    );
    endPlatform.position.copy(end).add(new THREE.Vector3(0, 0.02, 0));
    endPlatform.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dockDirection);
    endPlatform.castShadow = true;
    endPlatform.receiveShadow = true;
    deck.add(endPlatform);

    dock.add(deck);
    this.group.add(dock);
  }
}
