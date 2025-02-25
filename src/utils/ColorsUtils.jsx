/**
 * Fonction qui met en surbrillance une section de tombes spécifique.
 */
export const highlightTombSection = (tombClones, selectedTombName, sectionColors) => {
  if (!tombClones.length) return;

  let selectedSectionId = null;


  // Réinitialiser toutes les couleurs d'abord
  tombClones.forEach(clone => {
    clone.children.forEach(child => {
        if (child.isMesh && child.name === selectedTombName) {
            child.material.color.set(sectionColors[selectedTombName]); 
        
        child.material.emissive.set(0x00ff00);  // Exemple d'émissivité pour ajouter un effet de lumière
      } else {
        // Réinitialisez les autres tombes à leur état d'origine
        child.material.color.set('#FFFFFF');
        child.material.emissive.set(0x000000);
      }
    });
  });

  // Trouver la section ID de la tombe sélectionnée
  for (const clone of tombClones) {
    clone.traverse((child) => {
      if (child.isMesh && child.name === selectedTombName) {
        console.log('Tombe trouvée au niveau mesh:', child.name);
        
        if (child.userData && child.userData.sectionId) {
          selectedSectionId = child.userData.sectionId;
          console.log('ID de section trouvé:', selectedSectionId);
        } else {
          console.log('Tombe trouvée mais pas d\'ID de section dans userData:', child);
        }
      }
    });
    
    // Si on a déjà trouvé l'ID de section, on peut sortir de la boucle
    if (selectedSectionId !== null) break;
  }

  console.log('ID de section sélectionné:', selectedSectionId);

  // Si on a trouvé l'ID de section, colorer toutes les tombes de cette section
  if (selectedSectionId !== null) {
    const sectionColor = sectionColors[selectedSectionId];
    console.log('Utilisation de la couleur pour section:', sectionColor);
    
    if (!sectionColor) {
      console.warn('Pas de couleur définie pour l\'ID de section:', selectedSectionId);
      return;
    }
    
    tombClones.forEach((clone) => {
      clone.traverse((child) => {
        if (child.isMesh && child.userData && child.userData.sectionId === selectedSectionId) {
          // Mettre en surbrillance la tombe
          const newMaterial = child.material.clone();
          newMaterial.color.set(sectionColor);
          child.material = newMaterial;
          console.log('Coloration de la tombe dans la section:', child.name);
        }
      });
    });
    
    // Colorer spécialement la tombe sélectionnée (par exemple, en orange plus vif)
    tombClones.forEach((clone) => {
      clone.traverse((child) => {
        if (child.isMesh && child.name === selectedTombName) {
          // Colorer la tombe sélectionnée en orange plus vif
          const highlightMaterial = child.material.clone();
          highlightMaterial.color.set('#FFA500'); // Orange vif pour la tombe sélectionnée
          highlightMaterial.emissive.set('#FF4500'); // Ajouter un effet lumineux
          highlightMaterial.emissiveIntensity = 0.5;
          child.material = highlightMaterial;
          console.log('Tombe sélectionnée colorée en orange vif:', child.name);
        }
      });
    });
  } else {
    console.warn('Impossible de trouver l\'ID de section pour la tombe sélectionnée:', selectedTombName);
  }
};
