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
    // Khoảng cách thật được `fitCameraToPill()` tính lại bên dưới, sau khi đã biết
    // kích thước viên thuốc. Giá trị này chỉ để camera có vị trí hợp lệ lúc khởi tạo.
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

    // Biên độ bay lên xuống của hiệu ứng lơ lửng. Dùng chung cho cả vòng lặp
    // animation lẫn phép tính khung hình ngay bên dưới, để hai chỗ không lệch nhau.
    const floatAmplitude = 0.18;

    /**
     * Đẩy camera ra đủ xa để viên thuốc luôn nằm trọn trong khung, không bị cắt vòm
     * trên hoặc vòm dưới.
     *
     * Viên thuốc xoay tự do quanh cả ba trục — `rotation.y` quay liên tục theo thời
     * gian, `rotation.x` phụ thuộc vị trí chuột và độ cuộn trang — nên không thể
     * canh khung theo chiều cao hình chiếu ở một tư thế cụ thể. Phải dùng khối cầu
     * bao viên thuốc: bán kính bằng nửa thân trụ cộng bán kính vòm, cộng biên độ lơ
     * lửng. Khoảng cách để một khối cầu bán kính R tiếp xúc đúng mép frustum là
     * `R / sin(fov/2)`; tính cho cả chiều dọc và chiều ngang rồi lấy giá trị lớn hơn,
     * vì khung chứa trên mobile cao hơn rộng nên chiều ngang mới là chiều bó hẹp.
     */
    const boundingRadius = cylinderHeight * 0.5 + radius + floatAmplitude;
    const fitCameraToPill = () => {
      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov * 0.5) * camera.aspect);
      const distance = Math.max(
        boundingRadius / Math.sin(verticalFov * 0.5),
        boundingRadius / Math.sin(horizontalFov * 0.5)
      );
      // Chừa thêm một dải mép mỏng để viền sáng quanh viên thuốc không chạm cạnh canvas.
      camera.position.z = distance * 1.06;
      camera.updateProjectionMatrix();
    };
    fitCameraToPill();

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

    // `openEnded: true` — bỏ hai nắp đĩa phẳng mà CylinderGeometry mặc định sinh ra ở
    // hai đầu. Vỏ viên thuốc là kính `transmission` nên nhìn xuyên được vào trong; để
    // nguyên nắp thì hai cái đĩa nằm chắn ngang lòng viên thuốc, hiện lên thành vệt
    // ellipse mờ cắt ngang vòm và làm viên thuốc trông như bị chia tầng.
    const topCylinderGeo = new THREE.CylinderGeometry(
      radius,
      radius,
      cylinderHeight * 0.5,
      radialSegments,
      1,
      true
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
      radialSegments,
      1,
      true
    );
    const bottomCylinderMesh = new THREE.Mesh(bottomCylinderGeo, whiteGlassMaterial);
    bottomCylinderMesh.position.y = -cylinderHeight * 0.25;
    pillGroup.add(bottomCylinderMesh);

    // Không có vòng nẹp ở giữa. Bốn khối trên đều dùng chung bán kính `radius`, và
    // vòm cầu tiếp tuyến với thân trụ ngay tại đường xích đạo, nên bề mặt viên thuốc
    // liền mạch ở mọi hướng nhìn. Bất kỳ khối nào đặt ở eo với bán kính lớn hơn
    // `radius` đều nhô lên khỏi bề mặt và trông như một sợi dây chun bọc quanh — kể cả
    // khi chỉ nhô vài phần trăm, vì nó bắt sáng viền và bị lớp kính khúc xạ thành một
    // vệt ellipse mờ bên trong vòm. Ranh giới xanh/trắng tại y = 0 đã đủ đánh dấu chỗ
    // hai nửa nang thuốc khớp vào nhau.

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
      // Khung đổi tỉ lệ thì khoảng cách vừa khung cũng đổi theo, nhất là khi bố cục
      // chuyển từ hai cột sang một cột. `fitCameraToPill` tự gọi updateProjectionMatrix.
      fitCameraToPill();
      renderer.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    setIsLoaded(true);

    // Animation Loop
    let animationFrameId: number;
    const timer = new THREE.Timer();
    timer.connect(document);

    const animate = (timestamp?: number) => {
      animationFrameId = requestAnimationFrame(animate);
      timer.update(timestamp);
      const elapsedTime = timer.getElapsed();

      if (!prefersReducedMotion) {
        // Floating sine levitation
        pillGroup.position.y = Math.sin(elapsedTime * 1.5) * floatAmplitude;

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
      timer.dispose();
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
      particleGeo.dispose();
      blueGlassMaterial.dispose();
      whiteGlassMaterial.dispose();
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
