"use client";

import dynamic from "next/dynamic";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type { ForceGraphMethods } from "react-force-graph-3d";
import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
} from "postprocessing";
import * as THREE from "three";

import {
  type GraphData,
  type GraphLink,
  type GraphNode,
  type GraphNodeType,
} from "../../lib/sampleGraph";
import { useChatStore } from "../../store/useChatStore";

const ForceGraph3D = dynamic(async () => {
  const mod = await import("react-force-graph-3d");
  const Component = mod.default;

  return forwardRef<ForceGraphMethods<GraphNode, GraphLink>, any>(
    (props, ref) => <Component {...props} ref={ref} />
  );
}, { ssr: false });

const nodeColors: Record<GraphNodeType, string> = {
  question: "#4cc9ff",
  answer: "#34f0b1",
  keyword: "#f8b84a",
};
const nodeRadii: Record<GraphNodeType, number> = {
  question: 5.6,
  answer: 4.8,
  keyword: 3.7,
};

const cameraPosition = { x: 0, y: 40, z: 160 };
const labelScale = 0.072;
const labelCache = new Map<
  string,
  { texture: THREE.Texture; width: number; height: number }
>();

type GraphNodeWithPosition = GraphNode & {
  x?: number;
  y?: number;
  z?: number;
};

const getLinkNodeId = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object" && "id" in value) {
    return (value as { id: string }).id;
  }
  return "";
};

const getNeighborNodes = (nodeId: string, data: GraphData) => {
  const neighborIds = new Set<string>();
  data.links.forEach((link) => {
    const sourceId = getLinkNodeId(link.source);
    const targetId = getLinkNodeId(link.target);
    if (sourceId === nodeId && targetId) {
      neighborIds.add(targetId);
    }
    if (targetId === nodeId && sourceId) {
      neighborIds.add(sourceId);
    }
  });

  return data.nodes.filter((node) => neighborIds.has(node.id));
};

const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
};

const getLabelTexture = (label: string, color: string) => {
  const key = `${label}|${color}`;
  const cached = labelCache.get(key);
  if (cached) {
    return cached;
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    const fallback = new THREE.Texture();
    const value = { texture: fallback, width: 1, height: 1 };
    labelCache.set(key, value);
    return value;
  }

  const fontSize = 30;
  const paddingX = 18;
  const paddingY = 10;
  const fontFamily = "'Space Grotesk', 'Helvetica Neue', sans-serif";
  context.font = `600 ${fontSize}px ${fontFamily}`;

  const textWidth = context.measureText(label).width;
  const width = Math.ceil(textWidth + paddingX * 2);
  const height = Math.ceil(fontSize + paddingY * 2);

  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.ceil(width * pixelRatio);
  canvas.height = Math.ceil(height * pixelRatio);
  context.scale(pixelRatio, pixelRatio);

  context.font = `600 ${fontSize}px ${fontFamily}`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  drawRoundedRect(context, 0, 0, width, height, 12);
  context.fillStyle = "rgba(15, 23, 42, 0.7)";
  context.shadowColor = "rgba(15, 23, 42, 0.55)";
  context.shadowBlur = 12;
  context.fill();
  context.shadowBlur = 0;

  context.strokeStyle = `${color}55`;
  context.lineWidth = 2;
  context.stroke();

  context.fillStyle = "#f8fafc";
  context.shadowColor = "rgba(0, 0, 0, 0.35)";
  context.shadowBlur = 8;
  context.fillText(label, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  const value = { texture, width, height };
  labelCache.set(key, value);
  return value;
};

const createLabelSprite = (label: string, color: string) => {
  const { texture, width, height } = getLabelTexture(label, color);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  material.depthTest = false;

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(width * labelScale, height * labelScale, 1);
  sprite.center.set(0.5, 0);
  sprite.renderOrder = 2;
  return sprite;
};

export default function GraphCanvas() {
  const graphRef = useRef<ForceGraphMethods<GraphNode, GraphLink>>();
  const lightsRef = useRef<THREE.Light[]>([]);
  const hasConfiguredRef = useRef(false);
  const nodeObjectMap = useRef(new Map<string, THREE.Group>());
  const focusRingRef = useRef<THREE.Mesh | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const bloomRef = useRef<BloomEffect | null>(null);
  const starfieldRef = useRef<THREE.Points | null>(null);
  const ambientTickRef = useRef<number | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const focus = useChatStore((state) => state.focus);
  const setFocus = useChatStore((state) => state.setFocus);
  const clearFocus = useChatStore((state) => state.clearFocus);
  const graphData = useChatStore((state) => state.graph);
  const isCompact = canvasSize.width > 0 && canvasSize.width < 640;

  const sphereGeometry = useMemo(
    () => new THREE.SphereGeometry(1, 32, 32),
    []
  );

  const nodeMaterials = useMemo(() => {
    const makeMaterial = (
      color: string,
      emissiveIntensity: number,
      roughness: number,
      metalness: number
    ) =>
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity,
        roughness,
        metalness,
      });

    return {
      question: makeMaterial(nodeColors.question, 0.95, 0.18, 0.15),
      answer: makeMaterial(nodeColors.answer, 0.85, 0.2, 0.1),
      keyword: makeMaterial(nodeColors.keyword, 0.7, 0.28, 0.08),
    };
  }, []);

  const glowMaterials = useMemo(
    () => ({
      question: new THREE.MeshBasicMaterial({
        color: nodeColors.question,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      answer: new THREE.MeshBasicMaterial({
        color: nodeColors.answer,
        transparent: true,
        opacity: 0.36,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      keyword: new THREE.MeshBasicMaterial({
        color: nodeColors.keyword,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    }),
    []
  );

  const haloMaterials = useMemo(
    () => ({
      question: new THREE.MeshBasicMaterial({
        color: nodeColors.question,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      answer: new THREE.MeshBasicMaterial({
        color: nodeColors.answer,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      keyword: new THREE.MeshBasicMaterial({
        color: nodeColors.keyword,
        transparent: true,
        opacity: 0.14,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    }),
    []
  );

  const linkMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: 0xbfe2ff,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useEffect(() => {
    if (!focusRingRef.current) {
      const geometry = new THREE.SphereGeometry(1, 32, 32);
      const material = new THREE.MeshBasicMaterial({
        color: 0xf8fafc,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(geometry, material);
      ring.visible = false;
      ring.renderOrder = 3;
      focusRingRef.current = ring;
    }

    return () => {
      const ring = focusRingRef.current;
      if (ring?.parent) {
        ring.parent.remove(ring);
      }
      focusRingRef.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = graphRef.current;
    if (!instance || hasConfiguredRef.current) {
      return;
    }

    hasConfiguredRef.current = true;
    instance.cameraPosition(cameraPosition, { x: 0, y: 0, z: 0 }, 0);
    instance.d3Force("charge")?.strength(-140);
    instance.d3Force("link")?.distance(70);

    const scene = instance.scene();
    if (!scene) {
      return;
    }

    if (!scene.fog) {
      scene.fog = new THREE.FogExp2(0x0b1324, 0.0024);
    }

    lightsRef.current.forEach((light) => scene.remove(light));

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1);
    keyLight.position.set(40, 60, 30);
    const fillLight = new THREE.PointLight(0x7dd3fc, 0.7, 280);
    fillLight.position.set(-50, -10, 90);
    const rimLight = new THREE.PointLight(0x99f6e4, 0.55, 240);
    rimLight.position.set(60, -40, -30);

    lightsRef.current = [ambient, keyLight, fillLight, rimLight];
    scene.add(ambient, keyLight, fillLight, rimLight);

    const renderer = instance.renderer?.();
    const camera = instance.camera?.();
    if (renderer && camera) {
      const ratio = Math.min(
        window.devicePixelRatio || 1,
        canvasSize.width < 640 ? 1.25 : 1.6
      );
      renderer.setPixelRatio(ratio);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;

      const composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      const bloomEffect = new BloomEffect({
        intensity: 0.95,
        luminanceThreshold: 0.2,
        luminanceSmoothing: 0.9,
        mipmapBlur: true,
      });
      const effectPass = new EffectPass(camera, bloomEffect);
      effectPass.renderToScreen = true;

      composer.addPass(renderPass);
      composer.addPass(effectPass);
      composer.setSize(canvasSize.width, canvasSize.height);
      composerRef.current = composer;
      bloomRef.current = bloomEffect;

      const graphWithComposer = instance as typeof instance & {
        postProcessingComposer?: (composer: EffectComposer) => void;
      };
      graphWithComposer.postProcessingComposer?.(composer);
    }

    if (!starfieldRef.current) {
      const starCount = canvasSize.width < 640 ? 220 : 360;
      const positions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i += 1) {
        const radius = 220 + Math.random() * 140;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const sinPhi = Math.sin(phi);
        positions[i * 3] = radius * sinPhi * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.cos(phi);
        positions[i * 3 + 2] = radius * sinPhi * Math.sin(theta);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      const material = new THREE.PointsMaterial({
        color: 0xe2f2ff,
        size: 1.6,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const stars = new THREE.Points(geometry, material);
      stars.renderOrder = -1;
      stars.frustumCulled = false;
      starfieldRef.current = stars;
      scene.add(stars);
    }
  }, [canvasSize]);

  useEffect(() => {
    if (!container) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setCanvasSize({
          width: Math.round(entry.contentRect.width),
          height: Math.round(entry.contentRect.height),
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [container]);

  useEffect(() => {
    if (!canvasSize.width || !canvasSize.height) {
      return;
    }
    composerRef.current?.setSize(canvasSize.width, canvasSize.height);
    const instance = graphRef.current;
    if (!instance) {
      return;
    }
    const controls = instance.controls?.();
    const camera = instance.camera?.();
    if (controls) {
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.rotateSpeed = isCompact ? 0.65 : 0.5;
      controls.zoomSpeed = isCompact ? 0.85 : 0.75;
      controls.panSpeed = 0.5;
      controls.enablePan = false;
      controls.minDistance = isCompact ? 70 : 80;
      controls.maxDistance = isCompact ? 220 : 300;
      controls.update();
    }
    if (camera) {
      camera.fov = isCompact ? 58 : 50;
      camera.updateProjectionMatrix();
    }
  }, [canvasSize, isCompact]);

  useEffect(() => {
    const tick = (now: number) => {
      const t = now * 0.001;
      linkMaterial.opacity = 0.42 + Math.sin(t * 1.4) * 0.16;
      if (starfieldRef.current) {
        starfieldRef.current.rotation.y = t * 0.035;
        starfieldRef.current.rotation.x = t * 0.015;
      }
      ambientTickRef.current = requestAnimationFrame(tick);
    };

    ambientTickRef.current = requestAnimationFrame(tick);
    return () => {
      if (ambientTickRef.current) {
        cancelAnimationFrame(ambientTickRef.current);
      }
    };
  }, [linkMaterial]);

  const createNodeObject = (node: GraphNode) => {
    const type = node.type ?? "keyword";
    const color = nodeColors[type] ?? "#fff";
    const radius = nodeRadii[type] ?? 4;
    const material = nodeMaterials[type] ?? nodeMaterials.keyword;
    const glowMaterial = glowMaterials[type] ?? glowMaterials.keyword;
    const haloMaterial = haloMaterials[type] ?? haloMaterials.keyword;

    const group = new THREE.Group();
    group.userData = { nodeId: node.id, radius, type };
    nodeObjectMap.current.set(node.id, group);

    const glowMesh = new THREE.Mesh(sphereGeometry, glowMaterial);
    glowMesh.scale.setScalar(radius * 1.65);
    glowMesh.renderOrder = 0;

    const coreMesh = new THREE.Mesh(sphereGeometry, material);
    coreMesh.scale.setScalar(radius);
    coreMesh.castShadow = false;
    coreMesh.receiveShadow = false;
    coreMesh.renderOrder = 1;

    const haloMesh = new THREE.Mesh(sphereGeometry, haloMaterial);
    haloMesh.scale.setScalar(radius * 2.3);
    haloMesh.renderOrder = 0;

    const labelSprite = createLabelSprite(node.label, color);
    labelSprite.position.set(0, radius + 6, 0);

    group.add(haloMesh, glowMesh, coreMesh, labelSprite);
    return group;
  };

  useEffect(() => {
    const focusRing = focusRingRef.current;
    if (!focusRing) {
      return;
    }

    if (!focus) {
      if (focusRing.parent) {
        focusRing.parent.remove(focusRing);
      }
      focusRing.visible = false;
      return;
    }

    const targetGroup = nodeObjectMap.current.get(focus.node.id);
    if (!targetGroup) {
      return;
    }

    if (focusRing.parent !== targetGroup) {
      if (focusRing.parent) {
        focusRing.parent.remove(focusRing);
      }
      targetGroup.add(focusRing);
    }

    focusRing.visible = true;
    focusRing.position.set(0, 0, 0);
    const radius = (targetGroup.userData as { radius?: number }).radius ?? 4;
    focusRing.scale.setScalar(radius * 2.35);
  }, [focus]);

  useEffect(() => {
    return () => {
      nodeObjectMap.current.clear();
      if (ambientTickRef.current) {
        cancelAnimationFrame(ambientTickRef.current);
      }
      if (starfieldRef.current) {
        starfieldRef.current.parent?.remove(starfieldRef.current);
        starfieldRef.current.geometry.dispose();
        const material = starfieldRef.current.material as THREE.Material;
        material.dispose();
      }
      composerRef.current?.dispose?.();
    };
  }, []);

  return (
    <div ref={setContainer} className="h-full w-full">
      {canvasSize.width > 0 && canvasSize.height > 0 ? (
        <ForceGraph3D
          ref={graphRef}
          graphData={graphData}
          width={canvasSize.width}
          height={canvasSize.height}
          backgroundColor="rgba(0, 0, 0, 0)"
          showNavInfo={false}
          nodeLabel={(node) => (node as GraphNode).label}
          nodeThreeObject={(node) => createNodeObject(node as GraphNode)}
          nodeThreeObjectExtend={false}
          linkMaterial={linkMaterial}
          linkWidth={isCompact ? 1 : 1.15}
          linkDirectionalParticles={isCompact ? 2 : 4}
          linkDirectionalParticleWidth={isCompact ? 1 : 1.35}
          linkDirectionalParticleSpeed={isCompact ? 0.01 : 0.012}
          linkDirectionalParticleColor={() => "rgba(248, 250, 252, 0.85)"}
          d3VelocityDecay={isCompact ? 0.36 : 0.3}
          cooldownTicks={isCompact ? 90 : 140}
          onNodeClick={(node) => {
            const typedNode = node as GraphNodeWithPosition;
            const safeNode: GraphNode = {
              id: typedNode.id,
              label: typedNode.label,
              type: typedNode.type ?? "keyword",
            };
            setFocus({
              node: safeNode,
              neighbors: getNeighborNodes(safeNode.id, graphData),
            });

          }}
          onBackgroundClick={() => {
            clearFocus();
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
          Loading scene
        </div>
      )}
    </div>
  );
}
