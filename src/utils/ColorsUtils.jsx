import * as THREE from "three";

// Définir les couleurs constantes
export const COLORS = {
  DEFAULT: 0xFFFFFF,
  SELECTED_TOMB: '#FFA500', // Orange
  GLOW: '#FFFF00',          // Jaune
  SECTIONS: {
    13: '#EF507E',
    14: '#FFE771',
    15: '#B89AD7',
    16: '#E0C2B6',
  }
};

// Fonction pour mettre à jour la couleur d'une tombe spécifique
export const setTombColor = (tombId, color) => {
  if (!window.tombsSystem || !window.tombsSystem.instanceColors) {
    console.warn("Tomb color system not available");
    return;
  }
  
  // Vérifier si l'ID existe
  if (!window.tombsSystem.tombPositions || !window.tombsSystem.tombPositions[tombId]) {
    console.warn("Tomb ID not found:", tombId);
    return;
  }
  
  window.tombsSystem.instanceColors[tombId] = new THREE.Color(color);
  updateInstanceColors();
};

// Fonction pour réinitialiser toutes les couleurs
export const resetAllTombColors = () => {
  if (!window.tombsSystem || !window.tombsSystem.instanceColors) {
    console.warn("Système de couleurs de tombes non disponible");
    return;
  }
  
  Object.keys(window.tombsSystem.instanceColors).forEach(tombId => {
    window.tombsSystem.instanceColors[tombId] = new THREE.Color(COLORS.DEFAULT);
  });
  
  updateInstanceColors();
};

// Fonction pour mettre à jour la couleur de la tombe sélectionnée
export const highlightSelectedTomb = (selectedTombId) => {
  if (!selectedTombId) return;
  
  console.log("Highlighting tomb:", selectedTombId);
  
  // Vérifier si le système est prêt
  if (!window.tombsSystem || !window.tombsSystem.instanceColors) {
    console.warn("Tomb system not fully initialized yet. Cannot highlight tomb:", selectedTombId);
    return;
  }
  
  // Vérifier si l'ID de la tombe existe dans le système
  if (!window.tombsSystem.tombPositions || !window.tombsSystem.tombPositions[selectedTombId]) {
    console.warn("Tomb ID not found in system:", selectedTombId);
    return;
  }
  
  // Réinitialiser toutes les couleurs (facultatif selon votre logique)
  resetAllTombColors();
  
  // Appliquer la couleur de sélection
  console.log("Setting color for tomb:", selectedTombId);
  setTombColor(selectedTombId, COLORS.SELECTED_TOMB);
  
  // Forcer la mise à jour visuelle
  updateInstanceColors();
  
  console.log("Tomb highlighting complete");
};

// Fonction pour mettre à jour les couleurs des instances
export const updateInstanceColors = () => {
  if (!window.tombsSystem || !window.tombsSystem.tombsByType || !window.tombsSystem.instancedMeshesRef) {
    return;
  }
  
  // Mettre à jour les couleurs pour chaque type
  Object.entries(window.tombsSystem.tombsByType).forEach(([type, tombs]) => {
    const mesh = window.tombsSystem.instancedMeshesRef[type];
    if (!mesh || !mesh.isInstancedMesh) return;

    // Créer un nouveau tableau de couleurs
    const colors = new Float32Array(tombs.length * 3);

    // Remplir le tableau avec les couleurs actuelles
    tombs.forEach((tomb, index) => {
      const color = window.tombsSystem.instanceColors[tomb.id] || new THREE.Color(COLORS.DEFAULT);
      color.toArray(colors, index * 3);
    });

    // Mettre à jour le buffer de couleurs
    if (!mesh.instanceColor) {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    } else {
      mesh.instanceColor.set(colors);
    }
    mesh.instanceColor.needsUpdate = true;
  });
};

// Fonction pour mettre en surbrillance une section entière
export const highlightTombSection = (selectedTombId) => {
  if (!window.tombsSystem || !window.tombsSystem.tombPositions) {
    console.warn("Système de tombes non disponible");
    return;
  }
  
  if (!selectedTombId) {
    console.warn("Pas d'ID de tombe sélectionnée");
    return;
  }
  
  console.log("Début de la surbrillance pour la tombe:", selectedTombId);
  
  // Récupérer les données de la tombe
  const tombData = window.tombsSystem.tombPositions[selectedTombId];
  if (!tombData) {
    console.warn("Aucune tombe trouvée avec l'ID:", selectedTombId);
    return;
  }
  
  const sectionId = tombData.sectionId;
  
  // Récupérer la couleur de la section
  const sectionColor = COLORS.SECTIONS[sectionId];
  if (!sectionColor) {
    console.warn('Pas de couleur définie pour l\'ID de section:', sectionId);
    return;
  }
  
  // Supprimer tous les objets de surbrillance précédents
  cleanupHighlights();
  
  // Créer un groupe pour contenir tous les objets de surbrillance
  if (!window.tombsSystem.highlightGroup) {
    window.tombsSystem.highlightGroup = new THREE.Group();
    window.tombsSystem.highlightGroup.name = "highlightGroup";
    
    // Trouver la scène et ajouter le groupe
    const scene = window.tombsSystem.camera.parent;
    if (scene) {
      scene.add(window.tombsSystem.highlightGroup);
    }
  }
  
  // Récupérer les données de toutes les tombes depuis le système global
  const allTombPositions = window.tombsSystem.tombPositions;
  
  // Créer les objets de surbrillance pour la section
  Object.entries(allTombPositions).forEach(([id, data]) => {
    if (data.sectionId === sectionId) {
      const isSelected = id === selectedTombId;
      const color = isSelected ? COLORS.SELECTED_TOMB : sectionColor;
      
      createHighlightForTomb(id, data, color, isSelected);
      
      // Mettre également à jour les couleurs des instances
      if (window.tombsSystem.instanceColors) {
        window.tombsSystem.instanceColors[id] = new THREE.Color(color);
      }
    }
  });
  
  // Mettre à jour les couleurs des instances
  updateInstanceColors();
};

// Fonction pour nettoyer les objets de surbrillance précédents
const cleanupHighlights = () => {
  if (window.tombsSystem.highlightGroup) {
    while (window.tombsSystem.highlightGroup.children.length > 0) {
      const child = window.tombsSystem.highlightGroup.children[0];
      window.tombsSystem.highlightGroup.remove(child);
      
      // Nettoyer la géométrie et le matériau
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }
  }
};

// Créer un objet de surbrillance pour une tombe spécifique
const createHighlightForTomb = (tombId, tombData, color, isSelected) => {
  if (!window.tombsSystem.highlightGroup) return;
  
  // Créer une boîte englobante pour la tombe
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  
  // Créer un matériau basique
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: isSelected ? 0.5 : 0.3,
    side: THREE.DoubleSide,
    depthTest: false,
    wireframe: false
  });
  
  // Créer le mesh de surbrillance
  const highlightMesh = new THREE.Mesh(boxGeometry, material);
  highlightMesh.position.set(tombData.x, tombData.y, tombData.z);
  highlightMesh.scale.set(1.2, 1.2, 1.2); // Légèrement plus grand que la tombe
  highlightMesh.userData = { 
    id: tombId,
    isHighlight: true,
    isSelected: isSelected
  };
  
  // Ajouter au groupe de surbrillance
  window.tombsSystem.highlightGroup.add(highlightMesh);
  
  // Si c'est la tombe sélectionnée, ajouter un effet supplémentaire
  if (isSelected) {
    // Créer un matériau lumineux pour la tombe sélectionnée
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(COLORS.GLOW),
      transparent: true,
      opacity: 0.3,
      side: THREE.FrontSide,
      depthTest: false,
      wireframe: false
    });
    
    // Créer un mesh supplémentaire pour l'effet de lueur
    const glowMesh = new THREE.Mesh(boxGeometry, glowMaterial);
    glowMesh.position.set(tombData.x, tombData.y, tombData.z);
    glowMesh.scale.set(1.3, 1.3, 1.3); // Encore plus grand pour l'effet de lueur
    glowMesh.userData = { 
      id: tombId,
      isHighlight: true,
      isGlow: true
    };
    
    // Ajouter au groupe de surbrillance
    window.tombsSystem.highlightGroup.add(glowMesh);
  }
};

// Fonction pour initialiser le système de couleurs
export const initColorSystem = (tombsData) => {
  // Initialiser le système de couleurs dans l'objet global
  console.log(initColorSystem ,'crée')
  if (!window.tombsSystem) window.tombsSystem = {};
  
  // Créer un objet pour stocker les couleurs des instances
  window.tombsSystem.instanceColors = {};
  
  // Initialiser avec des couleurs par défaut
  tombsData.forEach(tomb => {
    window.tombsSystem.instanceColors[tomb.id] = new THREE.Color(COLORS.DEFAULT);
  });
  
  // Grouper les tombes par type
  window.tombsSystem.tombsByType = {};
  tombsData.forEach(tomb => {
    if (!window.tombsSystem.tombsByType[tomb.type]) {
      window.tombsSystem.tombsByType[tomb.type] = [];
    }
    window.tombsSystem.tombsByType[tomb.type].push(tomb);
  });
};

export const addOutlineToTomb = (instancedMeshRefs, selectedTombId) => {
  // Cette fonction est maintenant intégrée dans highlightTombSection
  // Elle est gardée pour la compatibilité
  highlightSelectedTomb(selectedTombId);
};

export default {
  highlightTombSection,
  setTombColor,
  resetAllTombColors,
  highlightSelectedTomb,
  updateInstanceColors,
  initColorSystem,
  COLORS
};