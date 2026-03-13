import './styles.css';
import { Suspense, useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import PresentationImage from '../PresentationImage';
import useIsPdfExport from '../useIsPdfExport';

function PanoramaSphere({ image }: { image: string }) {
  const texture = useLoader(THREE.TextureLoader, image);

  return (
    <Sphere args={[500, 64, 64]} scale={[-1, 1, 1]}>
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </Sphere>
  );
}

export default function PanoramaViewer({ data, id }: any) {
  const image = data.fields?.p360_image?.full;
  const [interacted, setInteracted] = useState(false);
  const isPdfExport = useIsPdfExport();

  if (!image) return null;

  if (isPdfExport) {
    return (
      <section id={id} className="panorama">
        <PresentationImage src={image} alt="360 panorama" />
      </section>
    );
  }

  return (
    <section
      id={id}
      className={`panorama ${interacted ? 'interacted' : ''}`}
      onPointerDown={() => setInteracted(true)}
    >
      <div className="panorama-label">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clip-path="url(#clip0_5158_62273)">
            <path
              d="M10.0013 18.3346C14.6037 18.3346 18.3346 14.6037 18.3346 10.0013C18.3346 5.39893 14.6037 1.66797 10.0013 1.66797C5.39893 1.66797 1.66797 5.39893 1.66797 10.0013C1.66797 14.6037 5.39893 18.3346 10.0013 18.3346Z"
              stroke="#616E07"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M1.66797 10C5.9888 14.0225 13.7213 13.6567 18.3346 10.2967"
              stroke="#616E07"
              strokeWidth="1.5"
            />
            <path
              d="M9.61679 1.66797C5.82679 5.41797 5.40596 14.168 9.99762 18.3346"
              stroke="#616E07"
              strokeWidth="1.5"
            />
          </g>
          <defs>
            <clipPath id="clip0_5158_62273">
              <rect width="20" height="20" fill="white" />
            </clipPath>
          </defs>
        </svg>{' '}
        360° панорама
      </div>

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
