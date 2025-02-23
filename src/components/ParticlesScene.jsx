import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from 'three';

const ParticleSystem = () => {
  const pointsRef = useRef();

  const [particles, colors] = useMemo(() => {
    const positions = new Float32Array(1000 * 3);
    const colors = new Float32Array(1000 * 3);
    
    for (let i = 0; i < positions.length; i += 3) {
      // Positions
      positions[i] = (Math.random() - 0.5) * 100;
      positions[i + 1] = (Math.random() - 0.5) * 100;
      positions[i + 2] = (Math.random() - 0.5) * 100;
      
      // Nuances de bleu
      colors[i] = 0.0;                    // R: très peu de rouge (0-0.2)
      colors[i + 1] = Math.random() * 0.5;// G: un peu de vert pour les variations (0-0.5)
      colors[i + 2] = 0.5 + Math.random() * 0.5; // B: beaucoup de bleu (0.5-1.0)
    }
    return [positions, colors];
  }, []);

  // Création de la texture circulaire
  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    
    const context = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 3;

    // Gradient radial pour un effet plus doux
    const gradient = context.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );

    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    context.fillStyle = gradient;
    context.fill();

    return new THREE.CanvasTexture(canvas);
  }, []);

  // Création du matériau pour les points
  const pointsMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 2,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
      map: particleTexture,
      alphaTest: 0.1,
      depthWrite: false,
      vertexColors: true
    });
  }, []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <points ref={pointsRef} scale={[1,1,1]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
          usage={THREE.StaticDrawUsage}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
          usage={THREE.StaticDrawUsage}
        />
      </bufferGeometry>
      <primitive object={pointsMaterial} />
    </points>
  );
};

export default ParticleSystem;