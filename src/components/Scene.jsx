import React, { useState, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { AccumulativeShadows, BakeShadows, Environment, Float, Lightformer, OrbitControls, RandomizedLight, SoftShadows, Text, useGLTF } from "@react-three/drei";
import { isMobile } from "react-device-detect"; // Détecte si l'appareil est mobile
import * as THREE from "three";  // Assurez-vous d'importer THREE
import axios from 'axios';

import { useRef } from "react";
import Entrance from "../models/Entrance";
import Wall from "../models/Wall";
import Ground from "../models/Ground";
import UserInterface from "./UserInterface";
import Tombs from "../models/Tombs";
import TombModal from "./TombModal";
import { useSearchParams } from "react-router-dom";
import { PI } from "three/tsl";
import ParticleSystem from './ParticlesScene'
import MainOrbitControl from '../utils/MainOrbitControl'
// import { Bloom, DepthOfField, EffectComposer } from "@react-three/postprocessing";
import playIcon from '../assets/play_arrow.svg'
import gsap from "gsap";
import { Suspense } from "react";
import { focusOnObject, moveCameraToPosition } from "../utils/CameraUtils";
import { highlightTombSection } from "../utils/ColorsUtils";
import { GET_DECEASED } from "../config/api";
import Cross from "../models/Cross";
import { Bloom, DepthOfField, EffectComposer } from '@react-three/postprocessing'
import Pointer from "../models/Pointer";

// Définition des couleurs des sections
const sectionColors = {
  13: '#EF507E',
  14: '#FFE771',
  15: '#B89AD7',
  16: '#E0C2B6',
};

function Scene() {
  const [searchParams] = useSearchParams();
  const tombNameFromURL = searchParams.get("name");
  const [initialCameraPosition, setInitialCameraPosition] = useState(null);
  const [tombClones, setTombClones] = useState([]);
  const [tombName, setTombName] = useState("");
  const [camera, setCamera] = useState();
  const orbitControlRef = useRef();
  const tombId = useRef();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTomb, setSelectedTomb] = useState("");
  const [applicationStart, setApplicationStart] = useState(false)
  const [tombDetails, setTombDetails] = useState(null);


  const fetchTombDetails = async (tombId) => {
    try {
      // Appel API en utilisant l'ID de la tombe
      const response = await axios.get(GET_DECEASED(tombId));
      // console.log("Données de la tombe :", response.data);  // Log des données reçues
      setTombDetails(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des données de la tombe", error);
    }
  };

  const handleFocusOnObject = (name) => {
    // Trouver l'ID de la tombe sélectionnée en utilisant le nom ou directement depuis les clones
    localStorage.setItem("selectedTomb", name); // Sauvegarde dans le stockage local
    focusOnObject(name, tombClones, camera, orbitControlRef, sectionColors);
    setSelectedTomb(name);
    setIsModalOpen(true);
  };

  const handleTombClick = (id) => {
    // console.log("ID de la tombe sélectionnée:", id);  // Vérifie l'ID dans la console
    setSelectedTomb(id); // Utilise l'ID pour identifier la tombe sélectionnée.
    setIsModalOpen(true);
    focusOnObject(id, tombClones, camera, orbitControlRef, sectionColors);  // Assure-toi que `focusOnObject` utilise bien l'ID
    fetchTombDetails(id);  // Charger les détails de la tombe avec l'ID
  };



  const handleTopView = () => {
    if (!camera) return;
    const topViewPosition = { x: 0, y: 120, z: 0.001 };

    // Déplacer la caméra vers cette position
    moveCameraToPosition(camera, topViewPosition, orbitControlRef, new THREE.Vector3(0, 0, 0));

    if (orbitControlRef.current) {
      gsap.to(orbitControlRef.current.target, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1.5,
        ease: "power2.out",
        onUpdate: () => orbitControlRef.current.update(),
      });
    }
  };

  const SceneCamera = () => {
    const { camera } = useThree();
    setCamera(camera);

    useEffect(() => {
      if (!initialCameraPosition) {
        setInitialCameraPosition(camera.position.clone());
      }

    }, [camera]);

    return null;
  };

  const resetCameraPosition = () => {
    if (initialCameraPosition) {
      gsap.to(camera.position, {
        x: initialCameraPosition.x,
        y: initialCameraPosition.y,
        z: initialCameraPosition.z,
        duration: 1.5,
        ease: "power2.out",
        onUpdate: () => {
          camera.lookAt(0, 0, 0);
        },
      });


      if (orbitControlRef.current) {
        gsap.to(orbitControlRef.current.target, {
          x: 0,
          y: 0,
          z: 0,
          duration: 1.5,
          ease: "power2.out",
          onUpdate: () => {
            orbitControlRef.current.update();
          },
        });
      }
    }
  };

  useEffect(() => {
    const savedTomb = searchParams.get("name") || localStorage.getItem("selectedTomb");

    if (savedTomb && tombClones.length) {
      // Appliquer uniquement la surbrillance sans déplacer la caméra
      highlightTombSection(tombClones, savedTomb, sectionColors);
    }
  }, [tombClones]);


  useEffect(() => {
    const button = document.getElementById("top-view-btn");
    if (button) {
      button.addEventListener("click", handleTopView);
    }
  }, [camera]);


  useEffect(() => {
    if (tombNameFromURL && tombClones.length > 0) {
      focusOnObject(tombClones, camera, orbitControlRef);
    }
  }, [tombNameFromURL, tombClones]);

  const Loading = () => {
    return (
      <div className="bg-amber-600 z-50 h-full w-full">Chargement de la carte en cours</div>
    )
  }

  return (
    <>
      <div className="main">
        <div className=" fixed h-full w-full">
          <div className="absolute top-0 backdrop-blur-[6px] flex justify-center items-center w-full h-full z-50">
            <div className={`${applicationStart ? 'hidden' : 'flex'} flex-col items-center h-full justify-center relative`}>
              <h1 className="text-white tracking-[0.5em] font-bold uppercase text-2xl lg:text-[72px] w-full box-border">Gideon </h1>
              <div className="flex flex-col items-center absolute bottom-[20px] lg:bottom-[161px]">
                <h2 className="text-xl text-white whitespace-nowrap">Lancer l'application</h2>
                <button className=" z-50 cursor-pointer rounded-full h-[72px] w-[72px] border-5 border-white flex items-center justify-center mt-[26px]" onClick={() => setApplicationStart(prev => !prev)}>
                  <img src={playIcon} />
                </button>
              </div>
            </div>
          </div>


          <Canvas shadows camera={{ near: 0.2, position: [-20, 20, -50] }} style={{ background: "linear-gradient(to top, #155477, #7AC8D0)" }}>
            <group>
              <Float rotationIntensity={0.5} floatIntensity={8} speed={1}>
                <ParticleSystem />
                <pointLight
                  position={[0, 0, 0]}
                  decay={0}
                  intensity={8}
                  color='yellow'
                />
                <ambientLight intensity={1} />
                <directionalLight position={[0, 0, 0]} intensity={10} color="yellow" />

              </Float>
            </group>
          </Canvas>
        </div>

        {applicationStart &&
          <Suspense fallback={<Loading />}>
            <div>
              <div className="flex justify-center w-full h-full relative z-50">
                <button id='top-view-btn' className="absolute cursor-pointer text-white top-6 min-w-56 lg:top-6 h-10 lg:h-[76px] w-30 rounded-lg bg-[#0E1C36]/80 hover:bg-[#0E1C36]/70 hover:text-green-300 transition-all duration-150">Passer en vue aérienne</button>
              </div>
              <UserInterface tombName={tombName} setTombName={setTombName} focusOnObject={handleFocusOnObject} />
              <Canvas shadows camera={{ near: 0.2, position: isMobile ? [0, 80, 5] : [30, 50, 75], rotation: [0, Math.PI, 0] }} id="tomb-canvas" className="absolute w-full h-full top-0 left-0">
                <group>
                <Text rotation={[0,0,0]}>Vous êtes ici</Text>
                  <Pointer/>
                  <Entrance />
                  <Wall />
                  <Ground />
                  <Cross />
                  <ambientLight intensity={3} />
                  <Suspense fallback={null}>
                    <Tombs
                      setTombClones={setTombClones}
                      onTombClick={handleTombClick}
                    />
                    {/* <AccumulativeShadows temporal frames={40} color="black" colorBlend={2} toneMapped={true} alphaTest={0.75} opacity={2} scale={100}>
                      <RandomizedLight intensity={Math.PI} amount={8} radius={4} ambient={0.5} position={[5, 5, -6]} bias={0.001} />
                    </AccumulativeShadows> */}
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={1} intensity={Math.PI} color='orange' />
                    {/* <directionalLight position={[5, 5, 5]} intensity={2} color="white" /> */}
                  </Suspense>
                  {/* <Environment intensity={2}  preset="city"> */}

                  <directionalLight position={[2, 3, -2]} intensity={0.5} />
                  {/* </Environment> */}

                  <EffectComposer>
                    {/* <Lightformer form="ring" intensity={2} position={[40, 40, -35]} scale={8} color="white" /> */}
                    <SoftShadows samples={32} radius={5} intensity={55} />
                  </EffectComposer>
                </group>
                <SceneCamera />


                <pointLight
                  position={[-10, -10, -10]}
                  decay={0}
                  intensity={Math.PI}
                  color='yellow'
                />
                <MainOrbitControl orbitControlRef={orbitControlRef} />

              </Canvas>
              <TombModal
                isOpen={isModalOpen}
                onClose={() => {
                  setIsModalOpen(false);
                  resetCameraPosition();
                }}
                tombName={selectedTomb}
                tombDetails={tombDetails}  // Passe les détails de la tombe à la modal
                tombId={tombId}
                onTombClick={handleTombClick}  // Assure-toi que c'est bien la fonction `handleTombClick`

              />
            </div>
          </Suspense>
        }

      </div>
    </>
  )
}

export default Scene
