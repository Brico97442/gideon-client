import gsap from "gsap";
import * as THREE from "three";  // Assurez-vous d'importer THREE
import { highlightTombSection } from "./ColorsUtils";

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

  // Mise à jour de la cible de la caméra pour qu'elle suive la tombe
  gsap.to(orbitControlRef.current.target, {
    x: target.x,
    y: target.y,
    z: target.z,
    duration: 1.5,
    ease: "power2.out",
    onUpdate: () => orbitControlRef.current.update(),
  });
};

export const focusOnObject = (name, tombClones, camera, orbitControlRef, sectionColors) => {
  if (!camera || !tombClones.length) return;

  console.log("Cherchant tombe avec nom:", name);

  // Utiliser find pour récupérer directement le clone avec le mesh correspondant au nom
  const selectedTomb = tombClones.find(clone => 
    clone.children.some(child => child.isMesh && child.name === name)
  );

  if (!selectedTomb) {
    console.warn("Aucune tombe trouvée avec le nom:", name);
    return;
  }

  console.log("Tombe trouvée:", selectedTomb);

  // Changer la couleur de la section
  highlightTombSection(tombClones, name, sectionColors);

  // Position de la caméra
  const targetPosition = {
    x: selectedTomb.position.x + 4,
    y: selectedTomb.position.y + 2,
    z: selectedTomb.position.z + 1.1,
  };

  // Créer la cible de la caméra
  const target = new THREE.Vector3(selectedTomb.position.x, selectedTomb.position.y, selectedTomb.position.z);

  // Déplacer la caméra et ajuster la cible d'orbite
  moveCameraToPosition(camera, targetPosition, orbitControlRef, target);
};

