"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function InteractivePillCanvas({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    // Adjusted camera distance for a much larger, heroic pill appearance
    camera.position.set(0, 0, 5.0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // Group to hold the pill and particles
    const pillGroup = new THREE.Group();
    scene.add(pillGroup);

    // Lighting setup for glossy liquid glass look
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 3.8);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x818cf8, 2.8);
    fillLight.position.set(-5, -3, 3);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x0066cc, 4.5, 18);
    rimLight.position.set(0, 5, -4);
    scene.add(rimLight);

    const bottomGlow = new THREE.PointLight(0x10b981, 3.0, 14);
    bottomGlow.position.set(0, -5, 2.5);
    scene.add(bottomGlow);

    // Pill geometry dimensions - Larger Hero Scale
    const radius = 1.15;
    const cylinderHeight = 1.45;
    const radialSegments = 64;

    // Materials
    // Blue Glass Material (Top half) - Deep Sapphire Liquid Glass
    const blueGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#0066CC"),
      emissive: new THREE.Color("#003366"),
      emissiveIntensity: 0.3,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.78,
      thickness: 1.3,
      transparent: true,
      opacity: 0.9,
      reflectivity: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });

    // Pearlescent White Glass Material (Bottom half)
    const whiteGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#f8fafc"),
      emissive: new THREE.Color("#0284c7"),
      emissiveIntensity: 0.12,
      metalness: 0.18,
      roughness: 0.15,
      transmission: 0.6,
      thickness: 1.1,
      transparent: true,
      opacity: 0.93,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });

    // Gold/Cyan Accent Ring Material
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#38bdf8"),
      metalness: 0.85,
      roughness: 0.15,
      emissive: new THREE.Color("#0284c7"),
      emissiveIntensity: 0.45,
    });

    // Top Cap (Dome + Top half cylinder)
    const topCapGeo = new THREE.SphereGeometry(
      radius,
      radialSegments,
      32,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.5
    );
    const topCapMesh = new THREE.Mesh(topCapGeo, blueGlassMaterial);
    topCapMesh.position.y = cylinderHeight * 0.5;
    pillGroup.add(topCapMesh);

    const topCylinderGeo = new THREE.CylinderGeometry(
      radius,
      radius,
      cylinderHeight * 0.5,
      radialSegments
    );
    const topCylinderMesh = new THREE.Mesh(topCylinderGeo, blueGlassMaterial);
    topCylinderMesh.position.y = cylinderHeight * 0.25;
    pillGroup.add(topCylinderMesh);

    // Bottom Cap (Dome + Bottom half cylinder)
    const bottomCapGeo = new THREE.SphereGeometry(
      radius,
      radialSegments,
      32,
      0,
      Math.PI * 2,
      Math.PI * 0.5,
      Math.PI * 0.5
    );
    const bottomCapMesh = new THREE.Mesh(bottomCapGeo, whiteGlassMaterial);
    bottomCapMesh.position.y = -cylinderHeight * 0.5;
    pillGroup.add(bottomCapMesh);

    const bottomCylinderGeo = new THREE.CylinderGeometry(
      radius,
      radius,
      cylinderHeight * 0.5,
      radialSegments
    );
    const bottomCylinderMesh = new THREE.Mesh(bottomCylinderGeo, whiteGlassMaterial);
    bottomCylinderMesh.position.y = -cylinderHeight * 0.25;
    pillGroup.add(bottomCylinderMesh);

    // Middle separator ring
    const ringGeo = new THREE.TorusGeometry(radius + 0.025, 0.045, 20, 80);
    ringGeo.rotateX(Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeo, ringMaterial);
    pillGroup.add(ringMesh);

    // Internal floating micro-spheres (Active Medicine Particles)
    const particleCount = 38;
    const particleGroup = new THREE.Group();
    const particleGeo = new THREE.SphereGeometry(0.075, 16, 16);

    const pColors = ["#38bdf8", "#34d399", "#60a5fa", "#fbbf24", "#ffffff", "#00d2ff"];
    const particles: {
      mesh: THREE.Mesh;
      basePos: THREE.Vector3;
      speed: number;
      offset: number;
    }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const pMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(pColors[i % pColors.length]),
        emissive: new THREE.Color(pColors[i % pColors.length]),
        emissiveIntensity: 0.9,
        roughness: 0.15,
      });
      const pMesh = new THREE.Mesh(particleGeo, pMat);

      // Distribute within pill bounds
      const y = (Math.random() - 0.5) * (cylinderHeight + radius * 0.85);
      const r = Math.random() * (radius * 0.68);
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      pMesh.position.set(x, y, z);
      particleGroup.add(pMesh);

      particles.push({
        mesh: pMesh,
        basePos: new THREE.Vector3(x, y, z),
        speed: 0.8 + Math.random() * 1.2,
        offset: Math.random() * Math.PI * 2,
      });
    }
    pillGroup.add(particleGroup);

    // Initial orientation: stylish diagonal angle
    pillGroup.rotation.z = 0.52;
    pillGroup.rotation.x = 0.32;

    // Mouse parallax tracking
    let targetRotX = 0.32;
    let targetRotY = 0.4;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = x;
      mouseY = y;
    };

    window.addEventListener("mousemove", onMouseMove);

    // Scroll rotation tracking
    let scrollY = 0;
    const onScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Resize handler
    const onResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    setIsLoaded(true);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        // Floating sine levitation
        pillGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.18;

        // Smooth mouse rotation blend
        targetRotX = 0.32 - mouseY * 0.45 + scrollY * 0.0012;
        targetRotY = 0.4 + mouseX * 0.65 + elapsedTime * 0.28;

        pillGroup.rotation.x += (targetRotX - pillGroup.rotation.x) * 0.05;
        pillGroup.rotation.y += (targetRotY - pillGroup.rotation.y) * 0.05;
        pillGroup.rotation.z = 0.52 + Math.sin(elapsedTime * 0.8) * 0.08;

        // Animate particles inside
        particles.forEach((p) => {
          p.mesh.position.y = p.basePos.y + Math.sin(elapsedTime * p.speed + p.offset) * 0.14;
          p.mesh.position.x = p.basePos.x + Math.cos(elapsedTime * p.speed * 0.7 + p.offset) * 0.08;
          p.mesh.position.z = p.basePos.z + Math.sin(elapsedTime * p.speed * 0.9 + p.offset) * 0.08;
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      resizeObserver.disconnect();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      topCapGeo.dispose();
      topCylinderGeo.dispose();
      bottomCapGeo.dispose();
      bottomCylinderGeo.dispose();
      ringGeo.dispose();
      particleGeo.dispose();
      blueGlassMaterial.dispose();
      whiteGlassMaterial.dispose();
      ringMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full min-h-[440px] sm:min-h-[520px] lg:min-h-[600px] transition-opacity duration-700 ${
        isLoaded ? "opacity-100" : "opacity-0"
      } ${className}`}
      aria-label="Minh họa 3D tương tác viên thuốc chuẩn y khoa"
    >
      {/* Ambient background medical luminous aura behind 3D pill */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-gradient-to-tr from-primary/35 via-sky-400/25 to-emerald-400/20 blur-3xl"
      />
    </div>
  );
}
