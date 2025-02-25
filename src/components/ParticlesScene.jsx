import { Float } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const ParticleSystem = ({ spacingBetweenClusters = 50, clusterSpread = 90 }) => {
  const pointsRef = useRef();
  const particleCount = 1500; // Nombre total de particules
  const maxSpeed = 0.002; // Vitesse max des particules

  // Création de la texture pour les particules
  const particleTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 3;
    const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 1)");
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    context.fillStyle = gradient;
    context.fill();

    return new THREE.CanvasTexture(canvas);
  }, []);

  // Matériau des particules
  const pointsMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 2,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.9,
        map: particleTexture,
        alphaTest: 0.1,
        depthWrite: false,
        vertexColors: true,
      }),
    [particleTexture]
  );

  // Génération des positions et vitesses en 2 amas
  const [positions, velocities, colors] = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const isLeftCluster = i < particleCount / 2; // Détermine si la particule est à gauche ou à droite
      const xOffset = isLeftCluster ? -spacingBetweenClusters : spacingBetweenClusters; // Distance entre les amas

      // Répartition aléatoire autour du centre du cluster
      const x = xOffset + (Math.random() - 0.5) * clusterSpread;
      const y = (Math.random() - 0.5) * clusterSpread;
      const z = (Math.random() - 0.5) * clusterSpread;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Couleurs aléatoires
      colors[i * 3] = 0.2 + Math.random() * 0.2;
      colors[i * 3 + 1] = 0.3 + Math.random() * 0.2;
      colors[i * 3 + 2] = 0.6 + Math.random() * 0.4;

      // Vitesse initiale pour un mouvement fluide
      velocities[i * 3] = (Math.random() - 0.5) * maxSpeed;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * maxSpeed;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * maxSpeed;
    }

    return [positions, velocities, colors];
  }, [particleCount, clusterSpread, spacingBetweenClusters]);

  // Animation des particules
  useFrame((state, delta) => {
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array;
      const velocities = pointsRef.current.userData.velocities;

      for (let i = 0; i < positions.length; i += 3) {
        // Appliquer la vitesse
        positions[i] += velocities[i] * delta * 60;
        positions[i + 1] += velocities[i + 1] * delta * 60;
        positions[i + 2] += velocities[i + 2] * delta * 60;

        // Légère oscillation pour rendre le mouvement plus naturel
        velocities[i] += Math.sin(state.clock.elapsedTime * 0.2) * 0.0001;
        velocities[i + 1] += Math.cos(state.clock.elapsedTime * 0.2) * 0.0001;
        velocities[i + 2] += Math.sin(state.clock.elapsedTime * 0.15) * 0.0001;

        // Limitation des vitesses pour éviter la dispersion trop forte
        velocities[i] = THREE.MathUtils.clamp(velocities[i], -maxSpeed, maxSpeed);
        velocities[i + 1] = THREE.MathUtils.clamp(velocities[i + 1], -maxSpeed, maxSpeed);
        velocities[i + 2] = THREE.MathUtils.clamp(velocities[i + 2], -maxSpeed, maxSpeed);
      }

      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
        <points ref={pointsRef} castShadow receiveShadow userData={{ velocities }}>
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
