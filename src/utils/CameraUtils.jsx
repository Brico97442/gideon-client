import gsap from "gsap";
import * as THREE from "three"; 
import { highlightTombSection, addOutlineToTomb } from '../utils/ColorsUtils';

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
  if (!camera || !tombClones || !tombClones.length) {
    console.warn("Camera ou tombClones non disponibles");
    return;
  }

  console.log("Recherche de la tombe:", name);
  console.log("Nombre de tombes disponibles:", tombClones.length);

  // Recherche de la tombe avec l'ID spécifié
  let selectedTomb = null;
  let tombPosition = null;
  
  // D'abord, vérifier directement dans les clones
  for (const clone of tombClones) {
    if (clone.userData && String(clone.userData.id) === String(name)) {
      selectedTomb = clone;
      tombPosition = new THREE.Vector3(
        clone.position.x,
        clone.position.y,
        clone.position.z
      );
      console.log("Tombe trouvée directement:", clone.userData);
      break;
    }
  }
  
  // Si toujours pas trouvé, essayer de traverser les objets
  if (!selectedTomb) {
    for (const clone of tombClones) {
      if (typeof clone.traverse === 'function') {
        clone.traverse((child) => {
          if (child.userData && String(child.userData.id) === String(name)) {
            selectedTomb = child;
            // Calculer la position mondiale si nécessaire
            const worldPosition = new THREE.Vector3();
            child.getWorldPosition(worldPosition);
            tombPosition = worldPosition;
            console.log("Tombe trouvée lors de la traversée:", child.userData);
          }
        });
      }
      if (selectedTomb) break;
    }
  }

  // Si on n'a toujours pas trouvé, essayer les données globales
  if (!selectedTomb && window.tombsSystem && window.tombsSystem.tombPositions) {
    const posData = window.tombsSystem.tombPositions[name];
    if (posData) {
      tombPosition = new THREE.Vector3(posData.x, posData.y, posData.z);
      console.log("Position trouvée dans les données globales");
    }
  }

  if (!tombPosition) {
    console.warn("Aucune tombe trouvée avec l'ID:", name);
    return;
  }

  // Changer la couleur de la section
  try {
    highlightTombSection(tombClones, name, sectionColors);
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