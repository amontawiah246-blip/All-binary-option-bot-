import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MarketAgent } from '../../types/agent';
import { soundFx } from '../../services/soundFx';
import {
  RotateCcw,
  Eye,
  Zap,
  Layers,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Compass,
} from 'lucide-react';

// Scratch objects allocated once at module scope to eliminate GC in the render loop
const _vec3 = new THREE.Vector3();
const _targetPos = new THREE.Vector3();
const _camPos = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2(-1000, -1000);

interface Fleet3DSceneProps {
  agents: MarketAgent[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  ticksPerSecond: number;
}

export const Fleet3DScene: React.FC<Fleet3DSceneProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  ticksPerSecond,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<'SWARM' | 'CEO' | 'FOREX' | 'SYNTHETICS' | 'TOP_RADAR'>('SWARM');
  const [rotationSpeed, setRotationSpeed] = useState(0.4);
  const [showLaserBeams, setShowLaserBeams] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [hoveredAgent, setHoveredAgent] = useState<MarketAgent | null>(null);

  // References to keep scene mutable without re-creating WebGL
  const agentsRef = useRef<MarketAgent[]>(agents);
  agentsRef.current = agents;

  const selectedAgentIdRef = useRef<string | null>(selectedAgentId);
  selectedAgentIdRef.current = selectedAgentId;

  const onSelectAgentRef = useRef(onSelectAgent);
  onSelectAgentRef.current = onSelectAgent;

  const configRef = useRef({
    rotationSpeed: 0.4,
    showLaserBeams: true,
    cameraPreset: 'SWARM' as 'SWARM' | 'CEO' | 'FOREX' | 'SYNTHETICS' | 'TOP_RADAR',
  });
  configRef.current = { rotationSpeed, showLaserBeams, cameraPreset };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Renderer Initialization
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060911);
    scene.fog = new THREE.FogExp2(0x060911, 0.012);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 250);
    camera.position.set(0, 24, 46);

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (Boolean((navigator as any).webdriver) || /HeadlessChrome/i.test(navigator.userAgent));

    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Studio PBR Environment Map via RoomEnvironment & PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    // 3. OrbitControls with smooth damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 140;
    controls.minDistance = 6;
    controls.maxPolarAngle = Math.PI / 2 + 0.15;
    controls.target.set(0, 0, 0);

    // 4. Lighting Rig
    const warmKeyLight = new THREE.DirectionalLight(0xfff1db, 2.4);
    warmKeyLight.position.set(15, 30, 20);
    warmKeyLight.castShadow = !isHeadless;
    warmKeyLight.shadow.mapSize.width = 1024;
    warmKeyLight.shadow.mapSize.height = 1024;
    warmKeyLight.shadow.bias = -0.0005;
    warmKeyLight.shadow.normalBias = 0.02;
    scene.add(warmKeyLight);

    const coolHemisphere = new THREE.HemisphereLight(0x38bdf8, 0x091428, 1.2);
    scene.add(coolHemisphere);

    const rimBlue = new THREE.PointLight(0x3b82f6, 3, 60);
    rimBlue.position.set(-20, 15, -20);
    scene.add(rimBlue);

    // 5. Ground Contact Shadow & Radar Grid Base
    const groundGroup = new THREE.Group();

    // Procedural radar grid canvas texture
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = 1024;
    gridCanvas.height = 1024;
    const gctx = gridCanvas.getContext('2d')!;
    gctx.clearRect(0, 0, 1024, 1024);

    // Concentric radar circles
    gctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    gctx.lineWidth = 2;
    const center = 512;
    [100, 200, 300, 400, 480].forEach((r) => {
      gctx.beginPath();
      gctx.arc(center, center, r, 0, Math.PI * 2);
      gctx.stroke();
    });

    // Radial spokes
    for (let a = 0; a < 16; a++) {
      const angle = (a * Math.PI) / 8;
      gctx.beginPath();
      gctx.moveTo(center, center);
      gctx.lineTo(center + Math.cos(angle) * 480, center + Math.sin(angle) * 480);
      gctx.stroke();
    }

    const gridTexture = new THREE.CanvasTexture(gridCanvas);
    gridTexture.colorSpace = THREE.SRGBColorSpace;
    gridTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const gridGeo = new THREE.PlaneGeometry(90, 90);
    const gridMat = new THREE.MeshBasicMaterial({
      map: gridTexture,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    gridMat.polygonOffset = true;
    gridMat.polygonOffsetFactor = -1;
    gridMat.polygonOffsetUnits = -1;

    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    gridMesh.rotation.x = -Math.PI / 2;
    gridMesh.position.y = -0.05;
    groundGroup.add(gridMesh);

    // Soft radial contact shadow under CEO core
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sctx = shadowCanvas.getContext('2d')!;
    const grad = sctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(16, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.02;
    groundGroup.add(shadowMesh);
    scene.add(groundGroup);

    // 6. Composite CEO Central Reactor Core (8-part procedural THREE.Group)
    const ceoCoreGroup = new THREE.Group();
    ceoCoreGroup.name = 'CEO_CORE';

    // Part 1: Central Glowing Quantum Core
    const innerCoreGeo = new THREE.SphereGeometry(1.6, 32, 32);
    const innerCoreMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.8,
      roughness: 0.15,
      metalness: 0.85,
    });
    const innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    ceoCoreGroup.add(innerCore);

    // Part 2: Equatorial Gimbal Gyro Ring
    const gimbalGeo1 = new THREE.TorusGeometry(2.6, 0.12, 16, 64);
    const gimbalMat1 = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.95,
      roughness: 0.18,
    });
    const gimbalRing1 = new THREE.Mesh(gimbalGeo1, gimbalMat1);
    ceoCoreGroup.add(gimbalRing1);

    // Part 3: Polar Gimbal Ring
    const gimbalGeo2 = new THREE.TorusGeometry(3.1, 0.1, 16, 64);
    const gimbalMat2 = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.22,
    });
    const gimbalRing2 = new THREE.Mesh(gimbalGeo2, gimbalMat2);
    gimbalRing2.rotation.x = Math.PI / 3;
    ceoCoreGroup.add(gimbalRing2);

    // Part 4: Upper Hexagonal Magnetic Flux Emitter
    const topCapGeo = new THREE.CylinderGeometry(0.7, 1.1, 0.9, 6);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.3,
    });
    const topCap = new THREE.Mesh(topCapGeo, capMat);
    topCap.position.y = 2.0;
    ceoCoreGroup.add(topCap);

    // Part 5: Lower Containment Base
    const bottomCapGeo = new THREE.CylinderGeometry(1.1, 0.7, 0.9, 6);
    const bottomCap = new THREE.Mesh(bottomCapGeo, capMat);
    bottomCap.position.y = -2.0;
    ceoCoreGroup.add(bottomCap);

    // Part 6: Floating Orbital Hologram Ring
    const holoRingGeo = new THREE.RingGeometry(3.6, 3.8, 64);
    const holoRingMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const holoRing = new THREE.Mesh(holoRingGeo, holoRingMat);
    holoRing.rotation.x = Math.PI / 2;
    ceoCoreGroup.add(holoRing);

    // Part 7: Magnetic Containment Brackets
    for (let b = 0; b < 4; b++) {
      const angle = (b * Math.PI) / 2;
      const bracketGeo = new THREE.BoxGeometry(0.2, 3.6, 0.4);
      const bracket = new THREE.Mesh(bracketGeo, capMat);
      bracket.position.set(Math.cos(angle) * 3.4, 0, Math.sin(angle) * 3.4);
      bracket.rotation.y = angle;
      ceoCoreGroup.add(bracket);
    }

    ceoCoreGroup.position.set(0, 4.5, 0);
    scene.add(ceoCoreGroup);

    // 7. 50 Satellite Agent Nodes (Composite 3-4 part procedural models)
    const agentMeshesMap = new Map<string, THREE.Group>();
    const interactiveMeshes: THREE.Object3D[] = [];

    const nodeBaseGeo = new THREE.IcosahedronGeometry(0.85, 1);
    const ringGeo = new THREE.TorusGeometry(1.2, 0.05, 8, 32);
    const antennaGeo = new THREE.ConeGeometry(0.18, 0.8, 8);
    const hitGeo = new THREE.SphereGeometry(1.6, 8, 8);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });

    const initialAgents = agentsRef.current;

    initialAgents.forEach((agent) => {
      const group = new THREE.Group();
      group.name = `AGENT_${agent.id}`;
      (group as any).agentId = agent.id;

      const isForex = agent.category === 'forex';

      // Ring placement:
      // Inner shell for 10 Forex pairs: radius 15, elevation ~ 3.5
      // Outer shell for 40 Synthetics: radius 26-30, tiered elevation 2.0 to 6.5
      let radius: number;
      let angle: number;
      let elevation: number;

      if (isForex) {
        radius = 14;
        angle = ((agent.agentNumber - 1) / 10) * Math.PI * 2;
        elevation = 3.5 + Math.sin(angle * 3) * 0.8;
      } else {
        const synIndex = agent.agentNumber - 11; // 0 to 39
        const tier = Math.floor(synIndex / 14); // 3 tiers
        radius = 24 + tier * 4.2;
        angle = ((synIndex % 14) / 14) * Math.PI * 2 + tier * 0.4;
        elevation = 2.2 + tier * 1.8 + Math.cos(angle * 2) * 1.0;
      }

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      group.position.set(x, elevation, z);

      // Part A: Primary Sensor Bezel
      const primaryColor = isForex ? 0xf59e0b : 0x06b6d4;
      const nodeMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.25,
        metalness: 0.85,
        emissive: primaryColor,
        emissiveIntensity: 0.35,
      });
      const nodeMesh = new THREE.Mesh(nodeBaseGeo, nodeMat);
      nodeMesh.castShadow = !isHeadless;
      group.add(nodeMesh);

      // Part B: Orbital Ring
      const ringMat = new THREE.MeshStandardMaterial({
        color: isForex ? 0xfef08a : 0x93c5fd,
        metalness: 0.9,
        roughness: 0.2,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2.5;
      group.add(ringMesh);

      // Part C: Antenna Mast
      const mastMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.9,
        roughness: 0.3,
      });
      const mast = new THREE.Mesh(antennaGeo, mastMat);
      mast.position.y = 1.0;
      group.add(mast);

      // Interactive proxy sphere for reliable mobile & mouse raycasting
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      (hitMesh as any).parentGroup = group;
      (hitMesh as any).agentId = agent.id;
      group.add(hitMesh);
      interactiveMeshes.push(hitMesh);

      scene.add(group);
      agentMeshesMap.set(agent.id, group);
    });

    // 8. Laser Beam Conduits connecting active agents to CEO Core
    const laserMaterial = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });

    const linesGroup = new THREE.Group();
    linesGroup.name = 'LASER_CONDUITS';

    const agentLinesMap = new Map<string, THREE.Line>();

    initialAgents.forEach((agent) => {
      const agentGroup = agentMeshesMap.get(agent.id);
      if (!agentGroup) return;

      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        ceoCoreGroup.position,
        agentGroup.position,
      ]);
      const line = new THREE.Line(lineGeo, laserMaterial.clone());
      linesGroup.add(line);
      agentLinesMap.set(agent.id, line);
    });
    scene.add(linesGroup);

    // 9. Traveling Particle Energy Pulse System (Instanced)
    const particleCount = 60;
    const particleGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      blending: THREE.AdditiveBlending,
    });
    const instancedParticles = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);
    instancedParticles.frustumCulled = false;

    // Track particle progress along random agent conduits (0.0 to 1.0)
    const particleConduits: { agentId: string; progress: number; speed: number }[] = [];
    const agentKeys = Array.from(agentMeshesMap.keys());

    for (let p = 0; p < particleCount; p++) {
      const randomAgent = agentKeys[Math.floor(Math.random() * agentKeys.length)];
      particleConduits.push({
        agentId: randomAgent,
        progress: Math.random(),
        speed: 0.15 + Math.random() * 0.35,
      });
    }
    scene.add(instancedParticles);

    // Pre-warm WebGL shaders once
    renderer.compile(scene, camera);

    // 10. Pointer Interaction & Raycasting (Lossless 60fps)
    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      _raycaster.setFromCamera(_mouse, camera);
      const intersects = _raycaster.intersectObjects(interactiveMeshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object as any;
        const clickedId = hit.agentId;
        if (clickedId) {
          soundFx.playAgentSelect();
          onSelectAgentRef.current(clickedId);
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('pointermove', onPointerMove, { passive: true });
    domElement.addEventListener('click', onClick);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 11. Main 60fps Animation Loop with Exponential Damping & Zero Garbage Collection
    let animationFrameId: number;
    let clock = new THREE.Clock();
    const dummyMat4 = new THREE.Matrix4();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      // Rotate CEO Core internal gimbal rings
      gimbalRing1.rotation.y += delta * 0.6;
      gimbalRing1.rotation.x += delta * 0.3;
      gimbalRing2.rotation.y -= delta * 0.5;
      gimbalRing2.rotation.z += delta * 0.4;
      holoRing.rotation.z += delta * 0.2;

      // Pulse inner core brightness
      innerCoreMat.emissiveIntensity = 0.7 + Math.sin(elapsedTime * 3) * 0.3;

      // Orbit Swarm rotation if speed > 0
      const currentSpeed = configRef.current.rotationSpeed;
      if (currentSpeed > 0) {
        agentMeshesMap.forEach((mesh, agentId) => {
          const agent = agentsRef.current.find((a) => a.id === agentId);
          if (!agent) return;
          const isForex = agent.category === 'forex';
          const orbitRate = (isForex ? 0.08 : 0.04) * currentSpeed;

          // Compute new polar coordinates smoothly
          const currentX = mesh.position.x;
          const currentZ = mesh.position.z;
          const r = Math.sqrt(currentX * currentX + currentZ * currentZ);
          const currentAngle = Math.atan2(currentZ, currentX) + orbitRate * delta;

          mesh.position.x = Math.cos(currentAngle) * r;
          mesh.position.z = Math.sin(currentAngle) * r;

          // Bobbing wave
          mesh.position.y += Math.sin(elapsedTime * 2 + agent.agentNumber) * 0.004;

          // Spin node locally
          mesh.rotation.y += delta * 0.8;

          // Update laser beam endpoints
          const line = agentLinesMap.get(agentId);
          if (line) {
            line.visible = configRef.current.showLaserBeams && !agent.isMuted;
            const posAttr = line.geometry.attributes.position;
            if (posAttr) {
              posAttr.setXYZ(0, ceoCoreGroup.position.x, ceoCoreGroup.position.y, ceoCoreGroup.position.z);
              posAttr.setXYZ(1, mesh.position.x, mesh.position.y, mesh.position.z);
              posAttr.needsUpdate = true;
            }
          }
        });
      }

      // Update Node Visuals based on Live Signal State
      const currentSelectedId = selectedAgentIdRef.current;
      agentsRef.current.forEach((agent) => {
        const mesh = agentMeshesMap.get(agent.id);
        if (!mesh) return;

        const primaryMesh = mesh.children[0] as THREE.Mesh;
        if (primaryMesh && primaryMesh.material) {
          const mat = primaryMesh.material as THREE.MeshStandardMaterial;

          if (agent.id === currentSelectedId) {
            // Highlight selected agent with radiant golden-cyan
            mat.color.setHex(0x38bdf8);
            mat.emissive.setHex(0x0ea5e9);
            mat.emissiveIntensity = 1.0;
            mesh.scale.setScalar(1.4);
          } else if (agent.lastSignal && Date.now() - agent.lastSignal.timestamp < 6000) {
            // Signal firing flash
            const isBuy = agent.lastSignal.signalType === 'STRONG_BUY' || agent.lastSignal.signalType === 'BUY';
            const color = isBuy ? 0x10b981 : 0xf43f5e;
            mat.color.setHex(color);
            mat.emissive.setHex(color);
            mat.emissiveIntensity = 0.9;
            mesh.scale.setScalar(1.25);
          } else {
            // Normal state
            const normalColor = agent.category === 'forex' ? 0xf59e0b : 0x06b6d4;
            mat.color.setHex(normalColor);
            mat.emissive.setHex(normalColor);
            mat.emissiveIntensity = 0.35;
            mesh.scale.setScalar(1.0);
          }
        }
      });

      // Update Particle Pulse Flow
      for (let p = 0; p < particleCount; p++) {
        const pData = particleConduits[p];
        pData.progress += pData.speed * delta;
        if (pData.progress >= 1.0) {
          pData.progress = 0.0;
          pData.agentId = agentKeys[Math.floor(Math.random() * agentKeys.length)];
        }

        const agentMesh = agentMeshesMap.get(pData.agentId);
        if (agentMesh) {
          // Interpolate between agent position and CEO position
          _targetPos.lerpVectors(agentMesh.position, ceoCoreGroup.position, pData.progress);
          dummyMat4.makeTranslation(_targetPos.x, _targetPos.y, _targetPos.z);
          instancedParticles.setMatrixAt(p, dummyMat4);
        }
      }
      instancedParticles.instanceMatrix.needsUpdate = true;

      // Raycasting check for hover
      _raycaster.setFromCamera(_mouse, camera);
      const hovers = _raycaster.intersectObjects(interactiveMeshes, false);
      if (hovers.length > 0) {
        const hit = hovers[0].object as any;
        const hId = hit.agentId;
        const ag = agentsRef.current.find((a) => a.id === hId);
        if (ag && ag !== hoveredAgent) {
          setHoveredAgent(ag);
        }
      } else {
        if (hoveredAgent !== null) {
          setHoveredAgent(null);
        }
      }

      // Smoothly damp camera towards active preset when not manually orbiting
      const preset = configRef.current.cameraPreset;
      if (preset === 'CEO') {
        _camPos.set(0, 7, 13);
        _targetPos.set(0, 4.5, 0);
      } else if (preset === 'FOREX') {
        _camPos.set(0, 16, 26);
        _targetPos.set(0, 3.5, 0);
      } else if (preset === 'SYNTHETICS') {
        _camPos.set(30, 22, 32);
        _targetPos.set(0, 3, 0);
      } else if (preset === 'TOP_RADAR') {
        _camPos.set(0, 56, 0.1);
        _targetPos.set(0, 0, 0);
      } else {
        // SWARM
        _camPos.set(0, 24, 46);
        _targetPos.set(0, 3, 0);
      }

      camera.position.lerp(_camPos, 0.03);
      controls.target.lerp(_targetPos, 0.04);

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('pointermove', onPointerMove);
      domElement.removeEventListener('click', onClick);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      envTexture.dispose();
      gridGeo.dispose();
      gridMat.dispose();
      gridTexture.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTex.dispose();
      innerCoreGeo.dispose();
      innerCoreMat.dispose();
      gimbalGeo1.dispose();
      gimbalGeo2.dispose();
      gimbalMat1.dispose();
      gimbalMat2.dispose();
      topCapGeo.dispose();
      bottomCapGeo.dispose();
      capMat.dispose();
      holoRingGeo.dispose();
      holoRingMat.dispose();
      nodeBaseGeo.dispose();
      ringGeo.dispose();
      antennaGeo.dispose();
      hitGeo.dispose();
      hitMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      instancedParticles.dispose();
      laserMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden bg-slate-950 select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Top Floating HUD: Specs & Fleet Telemetry */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2 backdrop-blur-md shadow-xl flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold tracking-wider text-slate-100">
                NEXUS-50 SWARM MATRIX
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                PBR CORE
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              10 Forex • 40 Synthetics • {ticksPerSecond} ticks/s
            </div>
          </div>
        </div>

        {/* Hovered Agent Tooltip HUD */}
        {hoveredAgent && (
          <div className="hidden sm:flex pointer-events-auto bg-slate-900/95 border border-cyan-500/40 rounded-xl px-4 py-2 shadow-2xl backdrop-blur-md items-center gap-3 animate-in fade-in zoom-in-95">
            <div className="w-2 h-8 rounded bg-cyan-400" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">{hoveredAgent.name}</span>
                <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-300">
                  {hoveredAgent.assignedSymbol}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                Price: <span className="text-cyan-300 font-semibold">{hoveredAgent.assignedInstrument.currentPrice}</span> | RSI: {hoveredAgent.indicators.rsi} | WinRate: {hoveredAgent.metrics.winRate}%
              </div>
            </div>
          </div>
        )}

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => {
              const muted = soundFx.toggleMute();
              setIsMuted(muted);
            }}
            className="p-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-300 hover:text-white transition-colors"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Ergonomic Viewport-First Collapsible Bottom Control Dock */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[94%] max-w-2xl z-20 transition-all duration-300">
        {/* Toggle Bar */}
        <div className="flex justify-center mb-1">
          <button
            onClick={() => setIsDockCollapsed(!isDockCollapsed)}
            className="px-3 py-1 rounded-t-lg bg-slate-900/95 border-t border-x border-slate-700/80 text-[11px] font-mono text-slate-300 hover:text-white flex items-center gap-1.5 shadow-lg backdrop-blur-md"
          >
            {isDockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-cyan-400" /> Show 3D Fleet Controls
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-cyan-400" /> Hide Dock
              </>
            )}
          </button>
        </div>

        {/* Dock Surface */}
        {!isDockCollapsed && (
          <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Camera View Mode Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mr-1 flex items-center gap-1">
                <Eye className="w-3 h-3 text-cyan-400" /> View:
              </span>
              {[
                { id: 'SWARM', label: 'Full Swarm' },
                { id: 'CEO', label: 'CEO Core' },
                { id: 'FOREX', label: 'Forex Ring' },
                { id: 'SYNTHETICS', label: 'Synthetics' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setCameraPreset(m.id as any)}
                  className={`px-2.5 py-1.5 rounded-lg font-mono text-[11px] transition-all whitespace-nowrap ${
                    cameraPreset === m.id
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Orbit & Visual Controls */}
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
              {/* Rotation Speed */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono">Orbit</span>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.1"
                  value={rotationSpeed}
                  onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                  className="w-20 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Laser Conduits Toggle */}
              <button
                onClick={() => setShowLaserBeams(!showLaserBeams)}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                  showLaserBeams
                    ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-300'
                    : 'border-slate-700 bg-slate-800/50 text-slate-400'
                }`}
                title="Toggle Data Beam Conduits"
              >
                <Zap className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono">Beams</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
