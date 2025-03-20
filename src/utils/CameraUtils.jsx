import gsap from "gsap";
import * as THREE from "three";
// La référence à highlightTombSection peut être maintenue si vous l'utilisez ailleurs
// import { highlightTombSection } from '../utils/ColorsUtils';

export const moveCameraToPosition = (camera, targetPosition, orbitControlRef, target) => {
  if (!camera || !orbitControlRef.current) return;

  // Get the invalidate function from the Three.js context
  const invalidate = window.tombsSystem?.invalidate;

  // Déplacement de la caméra vers la nouvelle position
  gsap.to(camera.position, {
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    duration: 1.5,
    ease: "power2.out",
    onUpdate: () => {
      // Invalidate the renderer on each update
      if (window.tombsSystem && window.tombsSystem.invalidate) {
        window.tombsSystem.invalidate();
      }
    }
  });

  gsap.to(orbitControlRef.current.target, {
    x: target.x,
    y: target.y,
    z: target.z,
    duration: 1.5,
    ease: "power2.out",
    onUpdate: () => {
      orbitControlRef.current.update();
      // Invalidate the renderer on each update
      if (invalidate) invalidate();
    }
  });
};

export const focusOnObject = (tombId) => {
  console.log(`Focus sur la tombe ID: ${tombId}`);

  if (!window.tombsSystem || !window.tombsSystem.tombPositions) {
    console.warn("Système de tombes non disponible");
    return;
  }

  // Récupérer la caméra et les contrôles depuis le système global
  const camera = window.tombsSystem.camera;
  const orbitControlRef = window.tombsSystem.orbitControlRef;
  const invalidate = window.tombsSystem.invalidate;

  if (!camera || !orbitControlRef || !orbitControlRef.current) {
    console.warn("Caméra ou contrôles d'orbite non disponibles");
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

  // Forcer une mise à jour du LOD
  if (window.tombsSystem.forceLODUpdate) {
    window.tombsSystem.forceLODUpdate();
  }
  
  // Marquer le système pour une mise à jour du LOD
  if (window.tombsSystem.needsLODUpdate !== undefined) {
    window.tombsSystem.needsLODUpdate = true;
  }

  // Position cible de la caméra
  const targetPosition = {
    x: tombPosition.x + 4,
    y: tombPosition.y + 1,
    z: tombPosition.z + 1.1,
  };

  // Créer la cible de la caméra (le point vers lequel elle regarde)
  const target = new THREE.Vector3(
    tombPosition.x,
    tombPosition.y,
    tombPosition.z
  );

  // Déplacer la caméra avec GSAP
  gsap.to(camera.position, {
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    duration: 1.5,
    ease: "power2.out",
    onUpdate: () => {
      camera.lookAt(target);
      // Invalidate renderer on each GSAP update
      if (invalidate) invalidate();
    }
  });

  // Animer également le point pivot d'OrbitControls
  gsap.to(orbitControlRef.current.target, {
    x: target.x,
    y: target.y,
    z: target.z,
    duration: 1.5,
    ease: "power2.out",
    onUpdate: () => {
      orbitControlRef.current.update();
      // Invalidate renderer on each GSAP update
      if (invalidate) invalidate();
    }
  });
};
