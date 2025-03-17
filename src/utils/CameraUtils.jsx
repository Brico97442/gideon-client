import gsap from "gsap";
import * as THREE from "three";
import { highlightTombSection } from '../utils/ColorsUtils';

export const moveCameraToPosition = (camera, targetPosition, orbitControlRef, target) => {
  if (!camera || !orbitControlRef.current) return;

  // Déplacement de la caméra vers la nouvelle position
  gsap.to(camera.position, {
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    duration: 1.5,
    ease: "power2.out",
  });

  gsap.to(orbitControlRef.current.target, {
    x: target.x,
    y: target.y,
    z: target.z,
    duration: 1.5,
    ease: "power2.out",
    onUpdate: () => orbitControlRef.current.update(),
  });
};

export const focusOnObject = (tombId, instancedMeshRefs, camera, orbitControlRef, sectionColors) => {
  if (!camera || !window.tombsSystem || !window.tombsSystem.tombPositions) {
    console.warn("Camera ou système de tombes non disponible");
    return;
  }

  console.log("Recherche de la tombe:", tombId);
  
  // Récupérer les informations de la tombe depuis le système global
  const tombData = window.tombsSystem.tombPositions[tombId];
  if (!tombData) {
    console.warn("Aucune tombe trouvée avec l'ID:", tombId);
    return;
  }
  
  // Créer un vecteur position à partir des données de la tombe
  const tombPosition = new THREE.Vector3(
    tombData.x,
    tombData.y,
    tombData.z
  );
  
  console.log("Position de la tombe trouvée:", tombPosition);

  // Appliquer la coloration
  try {
    // Passer l'information de la section et du type à la fonction de coloration
    highlightTombSection(
      instancedMeshRefs, 
      tombId, 
      tombData.sectionId, 
      tombData.type, 
      sectionColors
    );
  } catch (error) {
    console.error("Erreur lors de la surbrillance:", error);
  }

  // Position cible de la caméra
  const targetPosition = {
    x: tombPosition.x + 4,
    y: tombPosition.y + 2,
    z: tombPosition.z + 1.1,
  };

  // Créer la cible de la caméra
  const target = new THREE.Vector3(
    tombPosition.x,
    tombPosition.y,
    tombPosition.z
  );

  // Déplacer la caméra et ajuster la cible d'orbite
  moveCameraToPosition(camera, targetPosition, orbitControlRef, target);
};