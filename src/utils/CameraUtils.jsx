import * as THREE from "three";

export const focusOnObject = (name, tombClones, camera, orbitControlRef) => {
  let selectedSectionId = null; // Stocker l'ID de section sélectionné

  tombClones.forEach((clone) => {
    clone.traverse((child) => {
      if (child.isMesh) {
        
        // Remettre le matériau d'origine pour toutes les tombes
        if (!child.userData.originalMaterial) {
          child.userData.originalMaterial = child.material;
        }
        child.material = child.userData.originalMaterial;

        if (child.name === name) {
          selectedSectionId = child.userData.sectionId; // Stocke la section ID
          updateSelectedMesh(child, orbitControlRef, camera);
        }
      }
    });
  });

  // Maintenant, on applique une autre couleur aux tombes de la même section
  if (selectedSectionId !== null) {
    tombClones.forEach((clone) => {
      clone.traverse((child) => {
        if (child.isMesh && child.userData.sectionId === selectedSectionId && child.name !== name) {
          child.material = new THREE.MeshStandardMaterial({ color: 0x0000ff }); // Bleu par exemple
        }
      });
    });
  }
};

const updateSelectedMesh = (mesh, orbitControlRef, camera) => {
  // Appliquer un clone du matériau avec une nouvelle couleur
  mesh.material = mesh.material.clone();
  mesh.material.color.set(0xff8200); // Orange

  camera.position.set(
    mesh.parent.position.x - 4,
    mesh.parent.position.y + 3,
    mesh.parent.position.z - 3
  );

  if (orbitControlRef.current) {
    orbitControlRef.current.target.set(
      mesh.parent.position.x,
      mesh.parent.position.y,
      mesh.parent.position.z
    );
  }
};

