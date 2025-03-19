import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const InstancedParticleSystem = ({
  spacingBetweenClusters = 50,
  clusterSpread = 90,
  lowPerformanceMode = false
}) => {
  // Référence à l'InstancedMesh
  const instancedMeshRef = useRef();
  const { camera } = useThree();
  
  // Paramètres ajustables en fonction des performances
  const particleCount = lowPerformanceMode ? 500 : 1500;
  const maxSpeed = lowPerformanceMode ? 0.001 : 0.002;
  
  // Stocker les velocités et positions pour l'animation
  const velocities = useRef(new Float32Array(particleCount * 3));
  const positions = useRef(new Float32Array(particleCount * 3));
  
  // Utiliser une géométrie plus simple pour les particules
  const particleGeometry = useMemo(() => {
    return new THREE.SphereGeometry(0.5, lowPerformanceMode ? 4 : 8, lowPerformanceMode ? 4 : 8);
  }, [lowPerformanceMode]);
  
  // Créer un matériau simple et efficace
  const particleMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x4477ff),
      transparent: true,
      opacity: 0.7,
      fog: false,
    });
  }, []);
  
  // Initialiser les positions et les matrices
  useEffect(() => {
    if (!instancedMeshRef.current) return;
    
    const dummy = new THREE.Object3D();
    const posArray = positions.current;
    const velArray = velocities.current;
    
    for (let i = 0; i < particleCount; i++) {
      // Déterminer le cluster (gauche ou droite)
      const isLeftCluster = i < particleCount / 2;
      const xOffset = isLeftCluster ? -spacingBetweenClusters : spacingBetweenClusters;
      
      // Position aléatoire dans le cluster
      const x = xOffset + (Math.random() - 0.5) * clusterSpread;
      const y = (Math.random() - 0.5) * clusterSpread;
      const z = (Math.random() - 0.5) * clusterSpread;
      
      // Stocker la position
      posArray[i * 3] = x;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = z;
      
      // Initialiser les vitesses
      velArray[i * 3] = (Math.random() - 0.5) * maxSpeed;
      velArray[i * 3 + 1] = (Math.random() - 0.5) * maxSpeed;
      velArray[i * 3 + 2] = (Math.random() - 0.5) * maxSpeed;
      
      // Configurer la matrice de l'instance
      dummy.position.set(x, y, z);
      
      // Taille aléatoire des particules pour plus de naturel
      const scale = 0.5 + Math.random() * 0.5;
      dummy.scale.set(scale, scale, scale);
      
      // Rotation aléatoire
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      
      dummy.updateMatrix();
      instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    // Marquer l'InstancedMesh comme nécessitant une mise à jour
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [particleCount, clusterSpread, spacingBetweenClusters, maxSpeed]);
  
  // Variable pour limiter les mises à jour
  const lastUpdateTime = useRef(0);
  const updateInterval = lowPerformanceMode ? 50 : 16;
  
  // Animation des particules
  useFrame((state, delta) => {
    if (!instancedMeshRef.current) return;
    
    // Mettre à jour seulement à intervalles réguliers
    const currentTime = state.clock.getElapsedTime() * 1000;
    if (currentTime - lastUpdateTime.current < updateInterval) return;
    lastUpdateTime.current = currentTime;
    
    const dummy = new THREE.Object3D();
    const posArray = positions.current;
    const velArray = velocities.current;
    
    // Facteur de mise à jour plus bas pour les configurations obsolètes
    const updateFactor = lowPerformanceMode ? 0.3 : 1;
    
    // Déterminer combien de particules mettre à jour par frame
    const particlesToUpdate = lowPerformanceMode ? Math.floor(particleCount / 3) : particleCount;
    const startIdx = Math.floor(Math.random() * (particleCount - particlesToUpdate));
    
    for (let i = startIdx; i < startIdx + particlesToUpdate; i++) {
      const idx = i % particleCount;
      const pIdx = idx * 3;
      
      // Appliquer la vitesse à la position
      posArray[pIdx] += velArray[pIdx] * delta * 60 * updateFactor;
      posArray[pIdx + 1] += velArray[pIdx + 1] * delta * 60 * updateFactor;
      posArray[pIdx + 2] += velArray[pIdx + 2] * delta * 60 * updateFactor;
      
      // Simple oscillation pour plus de naturel, mais réduit pour les performances
      if (!lowPerformanceMode || idx % 5 === 0) {
        const timeScale = 0.2;
        velArray[pIdx] += Math.sin(state.clock.elapsedTime * timeScale) * 0.0001;
        velArray[pIdx + 1] += Math.cos(state.clock.elapsedTime * timeScale) * 0.0001;
        velArray[pIdx + 2] += Math.sin(state.clock.elapsedTime * 0.15) * 0.0001;
      }
      
      // Limite des vitesses
      velArray[pIdx] = THREE.MathUtils.clamp(velArray[pIdx], -maxSpeed, maxSpeed);
      velArray[pIdx + 1] = THREE.MathUtils.clamp(velArray[pIdx + 1], -maxSpeed, maxSpeed);
      velArray[pIdx + 2] = THREE.MathUtils.clamp(velArray[pIdx + 2], -maxSpeed, maxSpeed);
      
      // Mettre à jour la matrice de l'instance
      dummy.position.set(posArray[pIdx], posArray[pIdx + 1], posArray[pIdx + 2]);
      
      // Rotation lente pour un effet plus naturel (seulement si non basse performance)
      if (!lowPerformanceMode || idx % 10 === 0) {
        dummy.rotation.x += delta * 0.1;
        dummy.rotation.y += delta * 0.1;
      }
      
      dummy.updateMatrix();
      instancedMeshRef.current.setMatrixAt(idx, dummy.matrix);
    }
    
    // Marquer la matrice comme nécessitant une mise à jour
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[particleGeometry, particleMaterial, particleCount]}
      frustumCulled={true}
    />
  );
};

export default InstancedParticleSystem;