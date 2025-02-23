import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

const ParticleSystem = () => {
  const pointsRef = useRef();
//   const { viewport } = useThree();

  const particleCount = 1500;
  const maxSpeed = 0.001;
  const limit = 50;

  // Création d'une texture de particules
  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 3;
    const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    context.fillStyle = gradient;
    context.fill();

    return new THREE.CanvasTexture(canvas);
  }, []);

  // Matériau des particules
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
  }, [particleTexture]);

  // Création de la géométrie des particules
  const [positions, velocities, colors] = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = (Math.random() - 0.5) * 150;
      positions[i + 1] = (Math.random() - 0.5) * 100;
      positions[i + 2] = (Math.random() - 0.5) * 100;

      colors[i] = 0.0;
      colors[i + 1] = Math.random() * 0.5;
      colors[i + 2] = 0.5 + Math.random() * 0.5;

      velocities[i] = (Math.random() - 0.5) * 0.1;
      velocities[i + 1] = (Math.random() - 0.5) * 0.1;
      velocities[i + 2] = (Math.random() - 0.5) * 0.1;
    }

    return [positions, velocities, colors];
  }, [particleCount]);

  // Mettre à jour les positions et vitesses des particules dans la scène
  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.03;

      const positions = pointsRef.current.geometry.attributes.position.array;
      const velocities = pointsRef.current.userData.velocities;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];

        // Gestion des rebonds et des limites
        for (let j = 0; j < 3; j++) {
          if (Math.abs(positions[i + j]) > limit) {
            positions[i + j] *= -0.9; // Rebond
            velocities[i + j] *= -0.9; // Inverser la direction
          }
        }

        velocities[i] += (Math.random() - 0.5) * 0.01;
        velocities[i + 1] += (Math.random() - 0.5) * 0.01;
        velocities[i + 2] += (Math.random() - 0.5) * 0.01;

        // Limitation de la vitesse
        for (let j = 0; j < 3; j++) {
          velocities[i + j] = THREE.MathUtils.clamp(velocities[i + j], -maxSpeed, maxSpeed);
        }
      }

      // Marquer les positions comme mises à jour
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef} userData={{ velocities }} position={[0,0,50]} scale={[3,3,3]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
          usage={THREE.DynamicDrawUsage}
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
