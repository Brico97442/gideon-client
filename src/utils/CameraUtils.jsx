import gsap from "gsap";
import * as THREE from "three";

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
  // console.log(`Focus sur la tombe ID: ${tombId}`);

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

  // console.log("Recherche de la tombe:", tombId);
  
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
  
  // Optimisation: Forcer un niveau de détail élevé pour la tombe ciblée
  if (window.tombsSystem.currentLODs) {
    window.tombsSystem.currentLODs[tombId] = 'high';
  }
  
  // Forcer une mise à jour du LOD
  if (window.tombsSystem.forceLODUpdate) {
    window.tombsSystem.forceLODUpdate();
  }
  
  // Marquer le système pour une mise à jour du LOD
  if (window.tombsSystem.needsLODUpdate !== undefined) {
    window.tombsSystem.needsLODUpdate = true;
  }

  // Récupérer la rotation de la tombe depuis les données
  const tombRotation = tombData.quaternion || new THREE.Quaternion();
  
  // Créer un vecteur de direction pour la caméra (direction avant de la tombe)
  const forward = new THREE.Vector3(0, 0, 1);
  forward.applyQuaternion(tombRotation);
  
  // Créer un vecteur de direction pour la caméra (direction droite de la tombe)
  const right = new THREE.Vector3(1, 0, 0);
  right.applyQuaternion(tombRotation);
  
  // Créer un vecteur de direction pour la caméra (direction haut de la tombe)
  const up = new THREE.Vector3(0, 1, 0);
  up.applyQuaternion(tombRotation);
  
  // Calculer la position de la caméra en utilisant les directions
  const cameraOffset = new THREE.Vector3();
  
  // Adapter la position en fonction du type de tombe
  switch(tombData.type) {
    case 1: // Tombe avec rotation à 90°
      cameraOffset.addScaledVector(forward, -0.1);
      cameraOffset.addScaledVector(up, 0.1);
      cameraOffset.addScaledVector(right, 0);
      break;
    case 2: // Tombe avec rotation à 90°
      cameraOffset.addScaledVector(forward, -0.1);
      cameraOffset.addScaledVector(up,3);
      cameraOffset.addScaledVector(right, 2);
      break;
    case 3: // Tombe sans rotation à 90°
      cameraOffset.addScaledVector(forward, -4);
      cameraOffset.addScaledVector(up, 4);
      cameraOffset.addScaledVector(right, 10);
      break;
    case 4: // Tombe sans rotation à 90°
      cameraOffset.addScaledVector(forward, 0);
      cameraOffset.addScaledVector(up, 1);
      cameraOffset.addScaledVector(right, 1.1);
      break;
    case 5: // Tombe sans rotation à 90°
      cameraOffset.addScaledVector(forward, 2);
      cameraOffset.addScaledVector(up, 4);
      cameraOffset.addScaledVector(right, 6);
      break;
    default: // Cas par défaut
      cameraOffset.addScaledVector(forward, -2);
      cameraOffset.addScaledVector(up, 1);
      cameraOffset.addScaledVector(right, 1.1);
  }
  
  // Calculer la position finale de la caméra
  const targetPosition = {
    x: tombPosition.x + cameraOffset.x,
    y: tombPosition.y + cameraOffset.y,
    z: tombPosition.z + cameraOffset.z,
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
    },
    onComplete: () => {
      // Ensure the LOD update is called after animation completes 
      if (window.tombsSystem.forceLODUpdate) {
        window.tombsSystem.forceLODUpdate();
      }
    }
  });
};