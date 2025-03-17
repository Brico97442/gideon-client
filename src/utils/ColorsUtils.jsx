import * as THREE from "three";

export const highlightTombSection = (instancedMeshRefs, selectedTombId, sectionId, tombType, sectionColors) => {
  if (!instancedMeshRefs || !instancedMeshRefs.current) {
    console.warn("Références aux meshes instanciés non disponibles");
    return;
  }
  
  if (!selectedTombId) {
    console.warn("Pas d'ID de tombe sélectionnée");
    return;
  }
  
  console.log("Début de la surbrillance pour la tombe:", selectedTombId, "Section:", sectionId);
  
  // Récupérer la couleur de la section
  const sectionColor = sectionColors[sectionId];
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
    const scene = instancedMeshRefs.current[tombType]?.parent;
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
      const color = isSelected ? '#FFA500' : sectionColor;
      
      createHighlightForTomb(id, data, color, isSelected);
    }
  });
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
      color: new THREE.Color('#FFFF00'),
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

export const addOutlineToTomb = (instancedMeshRefs, selectedTombId, tombType) => {
  // Cette fonction est maintenant intégrée dans createHighlightForTomb
  // Elle est gardée pour la compatibilité
};

export default highlightTombSection;