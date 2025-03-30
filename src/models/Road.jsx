import React, { useEffect } from "react";
import { useGLTF } from "@react-three/drei";

const Road = () => {
  const RoadGLB = useGLTF("/3d-models/gltf/cimetarylayout/road.glb", true, "/draco/");
  
  useEffect(() => {
    // Appliquer l'opacité à tous les matériaux du modèle
    RoadGLB.scene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.transparent = true; // Activer la transparence
        child.material.opacity = 0.8; // Définir l'opacité
      }
    });
  }, [RoadGLB]);

  return (
    <mesh
      position={[0, 0.07, -0.4]}
      rotation={[0, 0, 0]}
    >
      <primitive object={RoadGLB.scene} />
    </mesh>
  );
};

export default Road;

useGLTF.preload("/3d-models/gltf/cimetarylayout/road.glb", true, "/draco/");