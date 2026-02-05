import './styles.css';
import { Suspense } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function PanoramaSphere({ image }: { image: string }) {
  const texture = useLoader(THREE.TextureLoader, 'https://norikdavtian.github.io/ThreeJS-360-Panorama/img/spherical_texture.jpg');

  return (
    <Sphere args={[500, 64, 64]} scale={[-1, 1, 1]}>
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </Sphere>
  );
}

export default function PanoramaViewer({ data, id }: any) {
  const image = data.fields?.p360_image?.full;
  if (!image) return null;

  return (
    <section id={id} className="panorama">
      <Canvas camera={{ fov: 75, position: [0, 0, 0.1] }}>
        <Suspense fallback={null}>
          <PanoramaSphere image={image} />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            rotateSpeed={0.4}
            enableDamping
            dampingFactor={0.05}
          />
        </Suspense>
      </Canvas>
    </section>
  );
}

// function PanoramaSphere({ image }: any) {
//   // Ссылка на сферу
//   const meshRef = useRef<THREE.Mesh>(null);
// https://norikdavtian.github.io/ThreeJS-360-Panorama/img/spherical_texture.jpg
//   // Загружаем текстуру панорамы
//   const texture = useLoader(THREE.TextureLoader, image);

//   // Авто-вращение сферы
//   useFrame(() => {
//     if (meshRef.current) {
//       meshRef.current.rotation.y += 0.001; // скорость вращения
//     }
//   });

//   return (
//     <Sphere ref={meshRef} args={[500, 64, 64]} scale={[-1, 1, 1]}>
//       <meshBasicMaterial map={texture} side={THREE.BackSide} />
//     </Sphere>
//   );
// }