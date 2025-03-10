
export const highlightTombSection = (tombClones, selectedTombId, sectionColors) => {
  if (!tombClones || !tombClones.length) {
    console.warn("Pas de tombes disponibles pour la surbrillance");
    return;
  }

  if (!selectedTombId) {
    console.warn("Pas d'ID de tombe sélectionnée");
    return;
  }

  // Convertir l'ID en chaîne pour la comparaison
  const tombIdStr = String(selectedTombId);
  // console.log("Début de la surbrillance pour la tombe:", tombIdStr);
  // console.log("Nombre de tombes disponibles:", tombClones.length);

  let selectedSectionId = null;
  let foundTomb = false;

  // Réinitialiser toutes les couleurs d'abord
  tombClones.forEach(clone => {
    clone.traverse(child => {
      if (child.isMesh) {
        if (child.material) {
          // Cloner le matériau si ce n'est pas déjà fait
          if (!child.material.userData.isCloned) {
            child.material = child.material.clone();
            child.material.userData.isCloned = true;
          }
          child.material.color.set('#FFFFFF');
          child.material.emissive.set(0x000000);
        }
      }
    });
  });

  // Trouver la section ID de la tombe sélectionnée
  for (const clone of tombClones) {
    clone.traverse((child) => {
      if (child.isMesh && child.userData) {
        const childId = String(child.userData.id);
        // console.log("Vérification de la tombe:", childId, "Section:", child.userData.sectionId);
        if (childId === tombIdStr) {
          selectedSectionId = child.userData.sectionId;
          foundTomb = true;
          // console.log("Tombe trouvée! Section ID:", selectedSectionId);
        }
      }
    });
    if (foundTomb) break;
  }

  if (!foundTomb) {
    console.warn("Tombe non trouvée dans les clones:", tombIdStr);
    return;
  }

  if (!selectedSectionId) {
    console.warn("Section ID non trouvée pour la tombe:", tombIdStr);
    return;
  }

  const sectionColor = sectionColors[selectedSectionId];
  if (!sectionColor) {
    console.warn('Pas de couleur définie pour l\'ID de section:', selectedSectionId);
    return;
  }

  // console.log("Application de la couleur", sectionColor, "pour la section", selectedSectionId);
  
  // Colorer toutes les tombes de la même section
  tombClones.forEach((clone) => {
    clone.traverse((child) => {
      if (child.isMesh && child.userData && String(child.userData.sectionId) === String(selectedSectionId)) {
        if (!child.material.userData.isCloned) {
          child.material = child.material.clone();
          child.material.userData.isCloned = true;
        }
        child.material.color.set(sectionColor);
      }
    });
  });
  
  // Colorer spécialement la tombe sélectionnée
  tombClones.forEach((clone) => {
    clone.traverse((child) => {
      if (child.isMesh && child.userData && String(child.userData.id) === tombIdStr) {
        if (!child.material.userData.isCloned) {
          child.material = child.material.clone();
          child.material.userData.isCloned = true;
        }
        child.material.color.set('#FFA500'); // Orange vif pour la tombe sélectionnée
        child.material.emissive.set('#FF4500'); // Ajouter un effet lumineux
        child.material.emissiveIntensity = 0.3;
        console.log("Surbrillance appliquée à la tombe:", tombIdStr);
      }
    });
  });
};
