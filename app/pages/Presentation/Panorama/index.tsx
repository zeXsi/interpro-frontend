import React, { Suspense, useRef } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function PanoramaSphere() {
  // Ссылка на сферу
  const meshRef = useRef<THREE.Mesh>(null);

  // Загружаем текстуру панорамы
  const texture = useLoader(
    THREE.TextureLoader,
    'https://norikdavtian.github.io/ThreeJS-360-Panorama/img/spherical_texture.jpg'
  );

  // Авто-вращение сферы
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001; // скорость вращения
    }
  });

  return (
    <Sphere ref={meshRef} args={[500, 64, 64]} scale={[-1, 1, 1]}>
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </Sphere>
  );
}

export default function PanoramaViewer() {
  return (
    <Canvas style={{ width: '100vw', height: '100vh' }} camera={{ fov: 75, position: [0, 0, 0.1] }}>
      <Suspense fallback={null}>
        <PanoramaSphere />
        <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.3} minDistance={0.1} />
      </Suspense>
    </Canvas>
  );
}
