import React, { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { focusOnObject } from '../utils/CameraUtils';
import { highlightTombSection } from '../utils/ColorsUtils';

const TombContext = createContext();

export const TombProvider = ({ children }) => {
  const [selectedTomb, setSelectedTomb] = useState(null);
  const [tombDetails, setTombDetails] = useState(null);
  const [camera, setCamera] = useState(null);
  const [orbitControls, setOrbitControls] = useState(null);
  const [tombClones, setTombClones] = useState([]);
  const [previouslySelectedTomb, setPreviouslySelectedTomb] = useState(null);
  const [selectedTombPosition, setSelectedTombPosition] = useState(null);

  const selectTomb = (tombId, details) => {
    // console.log('Sélection de la tombe:', tombId, 'avec les détails:', details);

    console.log(selectTomb)
    setPreviouslySelectedTomb(selectedTomb);
    setSelectedTomb(tombId);
    if (details) {
      setTombDetails(details);
    }
  };

  const clearSelectedTomb = () => {
    setPreviouslySelectedTomb(null);
    setSelectedTomb(null);
    setTombDetails(null);
  };

  const setSceneElements = (cameraInstance, controlsRef, clones) => {
    setCamera(cameraInstance);
    setOrbitControls(controlsRef);
    setTombClones(clones);
  };

  const focusOnTomb = (tombId, sectionColors = {}) => {
    if (camera && orbitControls && tombClones.length > 0) {
      focusOnObject(tombId, tombClones, camera, orbitControls, sectionColors);
      highlightTombSection(tombClones, tombId, sectionColors);
    }
  };

  return (
    <TombContext.Provider 
      value={{ 
        selectedTomb, 
        previouslySelectedTomb,
        tombDetails,
        camera,
        orbitControls,
        tombClones,
        selectedTombPosition,
        setSelectedTombPosition,
        selectTomb,
        clearSelectedTomb,
        setSceneElements,
        focusOnTomb
      }}
    >
      {children}
    </TombContext.Provider>
  );
};

TombProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useTomb = () => {
  const context = useContext(TombContext);
  if (!context) {
    throw new Error('useTomb doit être utilisé à l\'intérieur d\'un TombProvider');
  }
  return context;
};

export const findTombMeshById = (tombId, tombClones) => {
  let foundMesh = null;
  // if (!tombClones || tombClones.length === 0 || !tombId) return null;
  
  tombClones.forEach(clone => {
    clone.traverse(child => {
      if (child.isMesh && child.userData && String(child.userData.id) === String(tombId)) {
        foundMesh = child;
      }
    });
  });
  
  return foundMesh;
} 