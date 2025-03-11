import gsap from "gsap";
import * as THREE from "three"; 
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
  if (!camera || !tombClones.length) {
    console.warn("Camera ou tombClones non disponibles");
    return;
  }

  console.log("Recherche de la tombe:", name);
  console.log("Nombre de tombes disponibles:", tombClones.length);

  // Recherche de la tombe dans tous les clones
  let selectedTomb = null;
  for (const clone of tombClones) {
    clone.traverse((child) => {
      if (child.isMesh && child.userData && child.userData.id === name) {
        selectedTomb = clone;
        // console.log("Tombe trouvée:", child.userData);
      }
    });
    if (selectedTomb) break;
  }

  if (!selectedTomb) {
    console.warn("Aucune tombe trouvée avec l'ID:", name);
    return;
  }

  // Changer la couleur de la section
  highlightTombSection(tombClones, name, sectionColors);

  // Position cible de la caméra
  const targetPosition = {
    x: selectedTomb.position.x + 4,
    y: selectedTomb.position.y + 2,
    z: selectedTomb.position.z + 1.1,
  };

  // Créer la cible de la caméra
  const target = new THREE.Vector3(
    selectedTomb.position.x,
    selectedTomb.position.y,
    selectedTomb.position.z
  );

  // Déplacer la caméra et ajuster la cible d'orbite
  moveCameraToPosition(camera, targetPosition, orbitControlRef, target);
};

