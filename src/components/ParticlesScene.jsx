import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";

const ParticleSystem = ({ 
  spacingBetweenClusters = 50, 
  clusterSpread = 90,
  lowPerformanceMode = true // Nouveau paramètre pour les configurations obsolètes
}) => {
  const pointsRef = useRef();
  const { camera } = useThree();
  const [visibilityFactor, setVisibilityFactor] = useState(1);
  
  // Réduire le nombre de particules sur les configurations obsolètes
  const particleCount = lowPerformanceMode ? 500 : 1500;
  const maxSpeed = lowPerformanceMode ? 0.001 : 0.002; // Réduire la vitesse pour moins de calculs
  
  // Optimisation: Création de la texture une seule fois et mise en cache
  const particleTexture = useMemo(() => {
    // Créer une texture plus simple pour les configurations obsolètes
    const size = lowPerformanceMode ? 32 : 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 3;
    
    // Utiliser un dégradé plus simple
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    context.fillStyle = "white";
    context.fill();

    return new THREE.CanvasTexture(canvas);
  }, [lowPerformanceMode]);

  // Optimisation: Matériau avec moins de propriétés
  const pointsMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: lowPerformanceMode ? 3 : 2, // Particules plus grandes mais moins nombreuses
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.9,
        map: particleTexture,
        alphaTest: 0.1,
        depthWrite: false,
        vertexColors: true,
        // Désactiver les propriétés coûteuses
        fog: false,
        lights: false
      }),
    [particleTexture, lowPerformanceMode]
  );

  // Optimisation: Génération des positions simplifiée
  const [positions, velocities, colors] = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const isLeftCluster = i < particleCount / 2;
      const xOffset = isLeftCluster ? -spacingBetweenClusters : spacingBetweenClusters;

      // Calculs simplifiés pour les positions aléatoires
      positions[i * 3] = xOffset + (Math.random() - 0.5) * clusterSpread;
      positions[i * 3 + 1] = (Math.random() - 0.5) * clusterSpread;
      positions[i * 3 + 2] = (Math.random() - 0.5) * clusterSpread;

      // Couleurs simplifiées pour réduire les calculs
      const blueValue = 0.6 + Math.random() * 0.4;
      colors[i * 3] = 0.2;
      colors[i * 3 + 1] = 0.3;
      colors[i * 3 + 2] = blueValue;

      // Vitesses moins variables pour moins de calculs
      velocities[i * 3] = (Math.random() - 0.5) * maxSpeed;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * maxSpeed;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * maxSpeed;
    }

    return [positions, velocities, colors];
  }, [particleCount, clusterSpread, spacingBetweenClusters, maxSpeed]);

  // Optimisation: Système de Level of Detail (LOD) basé sur la distance
  useEffect(() => {
    const updateVisibility = () => {
      if (!camera || !pointsRef.current) return;
      
      // Calculer la distance moyenne entre la caméra et le centre du système de particules
      const distance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
      
      // Ajuster la visibilité en fonction de la distance
      if (distance > 100) {
        setVisibilityFactor(0.5); // Réduire la visibilité à distance
      } else {
        setVisibilityFactor(1);
      }
    };

    // Mettre à jour lors des changements de caméra
    updateVisibility();
    
    // Nettoyage
    return () => {};
  }, [camera]);

  // Optimisation: Animation à taux de rafraîchissement variable
  const lastUpdateTime = useRef(0);
  const updateInterval = lowPerformanceMode ? 50 : 16; // Moins de mises à jour sur les configurations obsolètes

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    // Mettre à jour seulement à intervalles réguliers
    const currentTime = state.clock.getElapsedTime() * 1000;
    if (currentTime - lastUpdateTime.current < updateInterval) return;
    
    lastUpdateTime.current = currentTime;
    
    const positions = pointsRef.current.geometry.attributes.position.array;
    const velocities = pointsRef.current.userData.velocities;

    // Nombre de particules à mettre à jour (réduire sur les configurations obsolètes)
    const updateCount = lowPerformanceMode ? Math.floor(positions.length / 6) : positions.length;
    
    // Mettre à jour seulement un sous-ensemble des particules à chaque frame
    for (let i = 0; i < updateCount; i += 3) {
      const index = i % positions.length;
      
      // Appliquer la vitesse avec un facteur de visibilité
      positions[index] += velocities[index] * delta * 60 * visibilityFactor;
      positions[index + 1] += velocities[index + 1] * delta * 60 * visibilityFactor;
      positions[index + 2] += velocities[index + 2] * delta * 60 * visibilityFactor;

      // Oscillations simplifiées
      if (i % 9 === 0) { // Calculer seulement pour certaines particules
        const timeOffset = state.clock.elapsedTime * 0.1;
        velocities[index] += Math.sin(timeOffset) * 0.0001;
        velocities[index + 1] += Math.cos(timeOffset) * 0.0001;
      }
      
      // Limiter les vitesses
      velocities[index] = THREE.MathUtils.clamp(velocities[index], -maxSpeed, maxSpeed);
      velocities[index + 1] = THREE.MathUtils.clamp(velocities[index + 1], -maxSpeed, maxSpeed);
      velocities[index + 2] = THREE.MathUtils.clamp(velocities[index + 2], -maxSpeed, maxSpeed);
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} frustumCulled={true} userData={{ velocities }}>
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