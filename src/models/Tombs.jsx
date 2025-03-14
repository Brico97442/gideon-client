import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useGLTF, Instances, Instance, OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { GET_TOMBS } from "../config/api";


const Tombs = ({ setTombClones, onTombClick, selectedTombId }) => {
  const [tombsData, setTombsData] = useState([]);
  const { camera } = useThree();
  const tombModels = useMemo(() => {
    
    const models = {};
    
    for (let i = 1; i <= 5; i++) {
      models[i] = {
        low: useGLTF(`/3d-models/gltf/tomb/01/01low.glb`),
        mid: useGLTF(`/3d-models/gltf/tomb/01/01mid.glb`),
        high: useGLTF(`/3d-models/gltf/tomb/01/01high.glb`),
      };
    }
    return models;
  }, []);

  const [lodLevels, setLodLevels] = useState({});

  const handleClick = (tomb) => {
    console.log("Clic sur la tombe:", tomb);
    onTombClick(tomb.id);
  };

  useEffect(() => {
    const fetchTombs = async () => {
      try {
        const response = await fetch(GET_TOMBS);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        const flattenedTombs = data.flatMap(section => section.tombs.map(tomb => ({ ...tomb, sectionId: section.id })));
        setTombsData(flattenedTombs);
      } catch (error) {
        console.error("Erreur lors de la récupération des tombes :", error);
      }
    };
    fetchTombs();
  }, []);

  const updateLOD = useCallback(() => {
    const distance = camera.position.length();
    const newLODLevels = {};
    Object.keys(tombModels).forEach(type => {
      if (distance < 15) newLODLevels[type] = tombModels[type].high;
      else if (distance < 30) newLODLevels[type] = tombModels[type].mid;
      else newLODLevels[type] = tombModels[type].low;
    });
    setLodLevels(newLODLevels);
  }, [camera, tombModels]);

  useEffect(() => {
    const handleCameraChange = () => {
      updateLOD();
    };
    window.addEventListener("mousemove", handleCameraChange);
    return () => window.removeEventListener("mousemove", handleCameraChange);
  }, [updateLOD]);

  return (
    <>
      <OrbitControls onChange={updateLOD} />
      {Object.entries(lodLevels).map(([type, lodModel]) => (
        <Instances key={type} range={tombsData.length} geometry={lodModel.scene.children[0].geometry} material={lodModel.scene.children[0].material}>
          {tombsData.filter(tomb => tomb.type === parseInt(type)).map(tomb => {
            const position = [tomb.tombTransform.position[0], tomb.tombTransform.position[2], -tomb.tombTransform.position[1]];
            const rotation = [tomb.tombTransform.rotation[0], tomb.tombTransform.rotation[2], tomb.tombTransform.rotation[1]];
            return (
              <Instance key={tomb.id} position={position} rotation={rotation} onClick={() => handleClick(tomb)} frustumCulled={false} />
            );
          })}
        </Instances>
      ))}
    </>
  );
};

export default Tombs;
