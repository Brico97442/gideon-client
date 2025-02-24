
import * as THREE from "three";
import gsap from "gsap";

// Les couleurs associées à chaque section
const sectionColors = {
  9: '#FF5733',  // Section 1 (exemple : rouge)
  10: '#33FF57',  // Section 1 (exemple : rouge)
  11: '#3357FF',  // Section 1 (exemple : rouge)
  12: '#FFFF33',  // Section 1 (exemple : rouge)
  // Ajoute plus de sections et leurs couleurs ici si nécessaire
};

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

          // Appliquer la couleur spécifique à la section
          if (child.userData.sectionId === selectedSectionId) {
            const sectionColor = sectionColors[selectedSectionId];
            child.material = child.material.clone();
            child.material.color.set(sectionColor);
          }
        }
      });
    });
  }
};

// Fonction pour mettre à jour la caméra et l'objet sélectionné
const updateSelectedMesh = (mesh, orbitControlRef, camera) => {
  mesh.material = mesh.material.clone();
  mesh.material.color.set(0xff8200); // Applique une couleur orange à la tombe sélectionnée

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

  if (orbitControlRef.current) {
    gsap.to(orbitControlRef.current.target, {
      x: lookAtTarget.x,
      y: lookAtTarget.y,
      z: lookAtTarget.z,
      duration: 1,
      ease: "power2.out",
      onUpdate: () => {
        orbitControlRef.current.update();
      },
    });
  }
};

// Exemple d'intégration avec ton JSON
const processTombs = (jsonData) => {
  jsonData.forEach((section) => {
    const sectionId = section.id; // L'ID de la section
    const tombs = section.tombs;

    // Appliquer la couleur à chaque tombe de cette section
    tombs.forEach((tomb) => {
      // On applique l'ID de section à chaque tombe
      tomb.userData = tomb.userData || {};
      tomb.userData.sectionId = sectionId;

      // Tu peux ajouter des transformations ici si tu en as besoin
      tomb.position.set(
        tomb.tombTransform.position[0],
        tomb.tombTransform.position[1],
        tomb.tombTransform.position[2]
      );
      tomb.rotation.set(
        tomb.tombTransform.rotation[0],
        tomb.tombTransform.rotation[1],
        tomb.tombTransform.rotation[2]
      );
    });
  });
};

// Exemple de récupération et traitement des données
const jsonData = [ /* Ici tu insères le JSON complet de l'API que tu récupères */ ];
processTombs(jsonData);
