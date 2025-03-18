const glowVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const glowFragmentShader = `
  uniform vec3 glowColor;
  uniform float intensity;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  
  void main() {
    float opacity = pow(1.0 - dot(normalize(vNormal), normalize(vViewPosition)), 2.0) * intensity;
    gl_FragColor = vec4(glowColor, opacity);
  }
`;

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

  // resetAllTombColors();
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

  // Réinitialiser d'abord toutes les couleurs
  resetAllTombColors();

  // Récupérer les données de toutes les tombes depuis le système global
  const allTombPositions = window.tombsSystem.tombPositions;

  // Mettre à jour les couleurs des tombes de la même section
  Object.entries(allTombPositions).forEach(([id, data]) => {
    if (data.sectionId === sectionId) {
      // Si c'est la tombe sélectionnée, utiliser la couleur de sélection
      // Sinon, utiliser la couleur de la section
      const color = id === selectedTombId ? COLORS.SELECTED_TOMB : sectionColor;

      // Mettre à jour la couleur dans le système de couleurs
      if (window.tombsSystem.instanceColors) {
        window.tombsSystem.instanceColors[id] = new THREE.Color(color);
      }
    }
  });

  // Mettre à jour les couleurs des instances
  updateInstanceColors();

  console.log("Surbrillance de section terminée pour ID de section:", sectionId);
};


export const glowLayer = new THREE.Layers();
glowLayer.set(2);


export const createHighlightForTomb = (tombId, tombData, color, isSelected) => {
  if (!window.tombsSystem.highlightGroup) return;
  
  // Effacer les surbrillances existantes
  while (window.tombsSystem.highlightGroup.children.length > 0) {
    window.tombsSystem.highlightGroup.remove(window.tombsSystem.highlightGroup.children[0]);
  }
  
  // Récupérer le type de tombe
  const tombType = tombData.type;
  
  // Récupérer la géométrie du modèle correspondant au type de tombe
  let geometry;
  if (window.tombsSystem.instancedMeshesRef && window.tombsSystem.instancedMeshesRef[tombType]) {
    geometry = window.tombsSystem.instancedMeshesRef[tombType].geometry.clone();
  } else {
    // Fallback si la géométrie n'est pas disponible
    geometry = new THREE.BoxGeometry(1, 1, 1);
  }
  
  // Si c'est la tombe sélectionnée, créer uniquement l'effet de glow avec shader
  if (isSelected) {
    // Créer le matériau de shader pour le glow
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(COLORS.GLOW) },
        intensity: { value: 2.0 }
      },
      vertexShader: glowVertexShader,
      fragmentShader: glowFragmentShader,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      opacity:1,
    });
    
    // Créer un mesh de glow avec le shader
    const glowMesh = new THREE.Mesh(geometry, glowMaterial);
    glowMesh.position.set(tombData.x, tombData.y, tombData.z);
    
    // Copier la rotation de la tombe originale
    if (window.tombsSystem.tombPositions[tombId] && window.tombsSystem.tombPositions[tombId].quaternion) {
      glowMesh.quaternion.copy(window.tombsSystem.tombPositions[tombId].quaternion);
    }
    
    // Légèrement plus grand que la tombe originale
    glowMesh.scale.set(1.01, 1.01, 1.01);
    glowMesh.userData = { 
      id: tombId,
      isGlow: true
    };
    
    // Ajouter la layer pour le Bloom sélectif
    glowMesh.layers.enable(1);
    
    // Ajouter au groupe de surbrillance
    window.tombsSystem.highlightGroup.add(glowMesh);
    
    // Ajouter une animation subtile de pulsation pour le glow
    const pulsate = () => {
      const glowMeshes = window.tombsSystem.highlightGroup.children.filter(child => child.userData.isGlow);
      
      glowMeshes.forEach(mesh => {
        if (mesh.material.uniforms) {
          // Animer l'intensité du shader pour un effet subtil
          mesh.material.uniforms.intensity.value = 0.8 + Math.sin(Date.now() * 0.0025) * 0.3;
        }
      });
      
      if (glowMeshes.length > 0) {
        requestAnimationFrame(pulsate);
      }
    };
    
    pulsate();
  }
};

export const initColorSystem = (tombsData) => {
  // Initialiser le système de couleurs dans l'objet global
  console.log("Initialisation du système de couleurs...");
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

  // Grouper les tombes par section également pour un accès facile
  window.tombsSystem.tombsBySection = {};
  tombsData.forEach(tomb => {
    const sectionId = tomb.sectionId;
    if (!window.tombsSystem.tombsBySection[sectionId]) {
      window.tombsSystem.tombsBySection[sectionId] = [];
    }
    window.tombsSystem.tombsBySection[sectionId].push(tomb);
  });

  console.log("Système de couleurs initialisé");

  // Marquer le système comme initialisé
  window.tombsSystem.colorsInitialized = true;
};