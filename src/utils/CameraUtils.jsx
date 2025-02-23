import * as THREE from "three";
import gsap from "gsap";

// Fonction pour gérer la sélection et le focus sur une tombe
export const focusOnObject = (name, tombClones, camera, orbitControlRef) => {
  let selectedSectionId = null; // Stocker l'ID de la section sélectionnée

  tombClones.forEach((clone) => {
    clone.traverse((child) => {
      if (child.isMesh) {
        // Sauvegarde du matériau d'origine si ce n'est pas déjà fait
        if (!child.userData.originalMaterial) {
          child.userData.originalMaterial = child.material;
        }
        // Réinitialiser la couleur originale
        child.material = child.userData.originalMaterial;

        if (child.name === name) {
          selectedSectionId = child.userData.sectionId; // Stocke l'ID de la section
          updateSelectedMesh(child, orbitControlRef, camera);
        }
      }
    });
  });

  // Appliquer une couleur aux autres tombes de la même section
  if (selectedSectionId !== null) {
    tombClones.forEach((clone) => {
      clone.traverse((child) => {
        if (child.isMesh) {
          if (child.name === name) return; // Ne pas modifier la tombe sélectionnée
  
          // Réinitialiser le matériau original
          if (child.userData.originalMaterial) {
            child.material = child.userData.originalMaterial;
          }
  
          // Appliquer une couleur aux tombes de la même section
          if (child.userData.sectionId === selectedSectionId) {
            child.material = child.material.clone();
            child.material.color.set(0x0000ff); // Bleu
          }
        }
      });
    });
  }
};

// Fonction pour mettre à jour la caméra et l'objet sélectionné
const updateSelectedMesh = (mesh, orbitControlRef, camera) => {
  
  // Changer la couleur de la tombe sélectionnée
  mesh.material = mesh.material.clone();
  mesh.material.color.set(0xff8200);

  const targetPosition = {         // Placement de la caméra par rapport à la tombe 
    x: mesh.parent.position.x - 4,
    y: mesh.parent.position.y + 3,
    z: mesh.parent.position.z - 3,
  };

  const lookAtTarget = {     
    x: mesh.parent.position.x,
    y: mesh.parent.position.y,
    z: mesh.parent.position.z,
  };

  // Animation pour la caméra 
  gsap.to(camera.position, {
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    duration: 1.5,
    ease: "power2.out",
    onUpdate: () => {
      camera.lookAt(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z);
    },
  });

  // Animation du point de focus de OrbitControls
  if (orbitControlRef.current) {
    gsap.to(orbitControlRef.current.target, {
      x: lookAtTarget.x,
      y: lookAtTarget.y,
      z: lookAtTarget.z,
      duration: 1.5,
      ease: "power2.out",
      onUpdate: () => {
        orbitControlRef.current.update();
      },
    });
  }
};
