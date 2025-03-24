import { useState, useEffect, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Float, SoftShadows, Text, Billboard, StatsGl, Stats, OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { isMobile } from "react-device-detect";
import * as THREE from "three";
import axios from 'axios';
import { useRef } from "react";
import Entrance from "../models/Entrance";
import Wall from "../models/Wall";
import Ground from "../models/Ground";
import UserInterface from "./UserInterface";
import TombModal from "./TombModal";
import Tombs from "../models/Tombs";
import Tombs2 from "../models/Tombs2";
import { useSearchParams } from "react-router-dom";
import ParticleSystem from './ParticlesScene';
import MainOrbitControl from '../utils/MainOrbitControl';
import { Suspense } from "react";
import { focusOnObject, moveCameraToPosition } from "../utils/CameraUtils";
import {
  highlightSelectedTomb,
  highlightTombSection,
  createHighlightForTomb,
  COLORS
} from "../utils/ColorsUtils";
// import { Perf } from 'r3f-perf'
import { GET_DECEASED } from "../config/api";
import Cross from "../models/Cross";
import Pointer from "../models/Pointer";
// import { Bloom, EffectComposer, DepthOfField, Outline } from '@react-three/postprocessing';
import { useTomb, findTombMeshById } from '../context/TombContext';
import gsap from "gsap";
import Button from "./Button";


import playIcon from '../assets/play_arrow.svg';
import willyImg from '../assets/teams_logo/willprod_white.png';
import vinceImg from '../assets/teams_logo/vince.png';
import damienImg from '../assets/teams_logo/damien_white.png';
import { TransitionEffect } from './TransitionEffect';
// import Grass from "./Grass";
// import Grass2 from "./Grass2";
// import Grass3 from "./Grass3";
import Road from "../models/Road";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
// import Button from "./Button";
// import Test from "./Test";

// Définition des couleurs des sections
const sectionColors = {
  13: '#EF507E',
  14: '#FFE771',
  15: '#B89AD7',
  16: '#E0C2B6',
};

function Scene() {
  const [searchParams] = useSearchParams();
  const [initialCameraPosition, setInitialCameraPosition] = useState(null);
  const [tombClones, setTombClones] = useState([]);
  const [camera, setCamera] = useState();
  const orbitControlRef = useRef();
  const tombId = useRef();
  const glowLayer = useRef();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTomb, setSelectedTomb] = useState("");
  const { selectTomb, clearSelectedTomb, setSceneElements } = useTomb();
  const [tombDetails, setTombDetails] = useState(null);
  const [applicationStart, setApplicationStart] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSceneLoaded, setIsSceneLoaded] = useState(false);
  const [isShowUi, setIsShowUi] = useState(true)
  const [isLoading, setIsLoading] = useState(true)


  const fetchTombDetails = async (tombId) => {
    try {
      const response = await axios.get(GET_DECEASED(tombId));
      selectTomb(tombId, response.data);
      setTombDetails(response.data);

      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des données de la tombe", error);
    }
  };

  const fetchTombDetail = async (tombId) => {
    try {
      const response = await axios.get(GET_DECEASED(tombId));
      const person = response.data.find(p => p.id === tombId);
      if (person) {
        selectTomb(tombId, [person]);
        setTombDetails([person]);
      } else {
        selectTomb(tombId, response.data);
        setTombDetails(response.data);
      }
      return response.data;

    } catch (error) {
      console.error("Erreur lors de la récupération des données de la tombe", error);
    }
  }

  const SceneCamera = () => {
    const { camera, scene, gl, invalidate } = useThree();

    useEffect(() => {
      const interval = setInterval(() => {
        console.log(gl.info.render);
      }, 1000);

      return () => clearInterval(interval);
    }, [gl]);

    useEffect(() => {
      if (!initialCameraPosition) {
        setInitialCameraPosition(camera.position.clone());
      }

      // Définir l'état de la caméra
      setCamera(camera);

      // Initialiser les éléments de scène dans le système global
      if (!window.tombsSystem) {
        console.log("Initialisation du système global");
        window.tombsSystem = {};

      }
      window.tombsSystem.invalidate = invalidate;

      if (!window.tombsSystem.highlightGroup) {
        // console.log("Création du groupe de surbrillance");
        window.tombsSystem.highlightGroup = new THREE.Group();
        scene.add(window.tombsSystem.highlightGroup);
      }

      window.tombsSystem.camera = camera;
      window.tombsSystem.scene = scene;
      window.tombsSystem.orbitControlRef = orbitControlRef;

      setSceneElements(camera, orbitControlRef, tombClones);


      console.log("Configuration de la scène terminée");
      setIsTransitioning(true);

    }, [camera, invalidate, scene]);

    return null;
  };



  const handleTombClick = (id) => {
    console.log("✅ handleTombClick triggered:", id);

    setIsModalOpen(true);
    setSelectedTomb(id);
    if (camera && orbitControlRef.current) {
      console.log("Focus sur la tombe:", id);

      // Vérifier si window.tombsSystem est correctement initialisé
      if (!window.tombsSystem || !window.tombsSystem.tombPositions || !window.tombsSystem.tombPositions[id]) {
        console.warn("Données de tombe non disponibles pour l'ID:", id);
        // Récupérer quand même les détails de la tombe
        console.log("Tombes reçues :", tombData);

        fetchTombDetails(id);
        return;
      }

      // Centrer la caméra sur la tombe
      focusOnObject(id, camera, orbitControlRef, sectionColors);

      if (window.tombsSystem.highlightGroup) {
        while (window.tombsSystem.highlightGroup.children.length > 0) {
          window.tombsSystem.highlightGroup.remove(window.tombsSystem.highlightGroup.children[0]);
        }
      }

      // Appliquer la surbrillance de section
      highlightTombSection(id);

      // Récupérer les données de la tombe sélectionnée
      const tombData = window.tombsSystem.tombPositions[id];
      if (tombData) {
        // Puis créer la mise en évidence spécifique pour cette tombe
        createHighlightForTomb(id, tombData, COLORS.SELECTED_TOMB, true);
      }

      // Récupérer les détails de la tombe
      fetchTombDetails(id);
      setIsShowUi(false);
    } else {
      fetchTombDetails(id);
    }
  };


  const handleTombFocus = (id) => {
    setIsModalOpen(true);
    setSelectedTomb(id);

    if (camera && orbitControlRef.current) {
      focusOnObject(id, camera, orbitControlRef, sectionColors);

      // Appliquer la surbrillance de section ici aussi
      highlightTombSection(id);
      // Récupérer les données de la tombe sélectionnée
      const tombData = window.tombsSystem.tombPositions[id];
      if (tombData) {
        // Puis créer la mise en évidence spécifique pour cette tombe
        createHighlightForTomb(id, tombData, COLORS.SELECTED_TOMB, true);
      }

      // Récupérer les détails de la tombe
      fetchTombDetail(id);
      setIsShowUi(false);
    } else {
      fetchTombDetail(id);
    }

  };;


  const handleTopView = () => {
    if (!camera) return;
    setIsShowUi(true)
    const topViewPosition = { x: 0, y: 120, z: 0.001 };

    moveCameraToPosition(camera, topViewPosition, orbitControlRef, new THREE.Vector3(0, 0, 0));

    if (orbitControlRef.current) {
      gsap.to(orbitControlRef.current.target, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1.5,
        ease: "power2.out",
        onUpdate: () => {
          orbitControlRef.current.update();
          // Invalidate here too
          if (window.tombsSystem?.invalidate) window.tombsSystem.invalidate();
        }
      });
    }
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
          // Invalidate here
          if (window.tombsSystem?.invalidate) window.tombsSystem.invalidate();
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
            // Invalidate here too
            if (window.tombsSystem?.invalidate) window.tombsSystem.invalidate();
          },
        });
      }
    }
  };

  useEffect(() => {
    const savedTomb = searchParams.get("name");
    if (savedTomb) {
      console.log("URL Parameter found:", savedTomb);

      // Fonction pour appliquer la surbrillance
      const applyHighlight = () => {
        if (window.tombsSystem && window.tombsSystem.tombPositions && window.tombsSystem.instanceColors) {
          console.log("Applying highlight to tomb:", savedTomb);

          highlightSelectedTomb(savedTomb);
          setSelectedTomb(savedTomb);

          fetchTombDetails(savedTomb);

          return true;
        }
        return false;
      };

      // Créer un système de vérification périodique plus robuste
      let attempts = 0;
      const maxAttempts = 20; // Nombre maximal de tentatives

      const checkSystem = () => {
        attempts++;
        console.log(`Attempt ${attempts} to highlight tomb ${savedTomb}`);

        if (applyHighlight()) {
          console.log("Successfully highlighted tomb");
          return true;
        } else if (attempts >= maxAttempts) {
          console.warn("Failed to highlight tomb after maximum attempts");
          return true;
        }
        return false;
      };

      if (!checkSystem()) {
        const intervalId = setInterval(() => {
          if (checkSystem()) {
            clearInterval(intervalId);
          }
        }, 300); // Vérifier toutes les 300ms

        // Nettoyer l'intervalle après un certain temps(sécurité)
        setTimeout(() => {
          clearInterval(intervalId);
        }, 6000);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const button = document.getElementById("top-view-btn");
    if (button) {
      button.addEventListener("click", handleTopView);
    }
  }, [camera]);

  const handleCameraMove = (position) => {
    // Déclencher une mise à jour des LOD sur le composant Tombs
    if (window.tombsSystem) {
      window.tombsSystem.needsLODUpdate = true;
    }
    // if (window.tombsSystem && window.tombsSystem.needsLODUpdate) {
    //   Object.values(window.tombsSystem.tombInstances).forEach(lod => {
    //     lod.update(camera);
    //   });
  };


  const handleSceneLoaded = useCallback(() => {
    setIsLoading(false);
    console.log("Scène 3D entièrement chargée");
  }, []);


  const handleStartApplication = () => {
    setApplicationStart(true);
    setTimeout(() => {
      setIsTransitioning(true);
      setIsSceneLoaded(true);
      setIsLoading(false);
    }, 1000);
  };

  useEffect(() => {
    setIsSceneLoaded(true);

    if (isMobile && !isSceneLoaded) {
      setApplicationStart(true);

      // Ajouter un délai pour les appareils mobiles également

      setIsTransitioning(true);
      setIsSceneLoaded(true);
      setIsLoading(false);

    }

    // délai de sécurité pour s'assurer que tout est chargé
    // const safetyTimer = setTimeout(() => {
    //   if (isLoading) {
    //     handleSceneLoaded();
    //   }
    // }, 3000); // Délai de sécurité de 5 secondes

    // return () => clearTimeout(safetyTimer);
  }, [isSceneLoaded, isLoading, handleSceneLoaded]);


  // const handleTransitionComplete = () => {
  //   setIsTransitioning(false);
  //   setIsSceneLoaded(true);
  // };



  const Loading = () => {
    return (
      <div className={`z-60 h-full w-full text-white flex justify-center items-center bg-amber-700`}>
        <div className="flex items-center gap-2 justify-center p-6">
          <p>Chargement de la carte en cours veuillez patientez</p>
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-[spin_1.5s_cubic-bezier(0.25,1,0.5,1)_infinite]"></div>
            <div className="absolute top-0 left-0 w-6 h-6 rounded-full"
              style={{ clipPath: "polygon(50% 50%, 100% 0, 100% 100%)" }}>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main">
      {/* {/* <div className="fixed h-full w-full" onClick={handleStartApplication}> */}
      {/* <div className={`absolute top-0 backdrop-blur-[6px] flex justify-center items-center w-full h-full z-50`}>
            <div className={`${applicationStart ? 'fade-out' : 'fade-in'} ${isMobile ? 'hidden' : 'flex'} flex-col  items-center w-full backdrop-blur-[6px] h-full justify-center relative`}>
              <h1 className="text-white tracking-[0.5em] font-bold text-center uppercase text-2xl lg:text-[72px] w-full box-border">Gideon </h1>
              <div className="flex flex-col items-center h-full justify-end absolute bottom-[60px] lg:bottom-[161px]">
                <h2 className="text-xl text-white whitespace-nowrap breath">Toucher l'écran pour commencer</h2>
                <button className="z-50 cursor-pointer rounded-full h-[72px] w-[72px] border-5 border-white flex items-center justify-center mt-[26px] breath">
                  <img src={playIcon} alt="Play" />
                </button>
              </div>
            </div>
          </div> */}
      {/* </div> */}

      {/* <Canvas camera={{ near: 0.2, position: [-20, 20, -50] }} style={{ zIndex: "0" ,opacity:""}} >
      {/* // </Canvas> */}
      <Suspense fallback={<Loading />}>
        <Canvas
          // frameloop="demand"
          camera={{ near: 0.2, position: isMobile ? [0, 120, 5] : [30, 50, 75], rotation: [0, Math.PI, 0] }}
          id="tomb-canvas"
          className={`absolute h-full w-full top-0 left-0 transition-opacity ${!applicationStart ? "opacity-0 z-0" : "opacity-100 z-10"} duration-2000`}
        // style={{ background: "linear-gradient(to top, #155477, #7AC8D0)" }}
        >
          {/* <group> */}
          {/* <Float rotationIntensity={0.5} floatIntensity={8} speed={1}> */}
          {/* <ParticleSystem /> */}
          {/* <pointLight
        position={[0, 0, 0]}
        decay={0}
        intensity={8}
        color='yellow'
      /> */}

          {/* <ambientLight intensity={1} /> */}
          {/* <directionalLight position={[0, 0, 0]} intensity={10} color="yellow" /> */}
          {/* </Float> */}
          {/* </group> */}
          <group>
            <Pointer />
            <Entrance />
            <Wall />
            <Ground />
            <Cross />
            <Billboard position={[0, 2, 52]} follow={true} lockX={false} lockY={false} lockZ={false}>
              <Text fontSize={2} color="white" >
                Vous êtes ici
              </Text>
            </Billboard>
            <Road />
            {/* {isMobile ? <Grass position={[-2, -0.5, 15]} /> : <Grass3 position={[-2, -0.5, 15]} tombs={tombClones} />} */}
            <ambientLight intensity={2.5} />

            <Tombs2

              onTombClick={
                isMobile ?
                  handleTombFocus :
                  handleTombClick
              }
              selectedTombId={selectedTomb}
              orbitControlRef={orbitControlRef}  // Ajoutez cette ligne
              glowLayer={[glowLayer]}
            />
            {/* <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={1} intensity={Math.PI} color='orange' /> */}
            {/* <pointLight position={[-10, -10, -10]} decay={1} intensity={Math.PI} color='yellow' /> */}

          </group>

          <SceneCamera />
          <MainOrbitControl orbitControlRef={orbitControlRef} onCameraMove={handleCameraMove} />
          <StatsGl />
          <Stats />
          <PerformanceMonitor />
        </Canvas>


      </Suspense>

      {/* </div> */}

      <div className={`fixed h-full w-full`} onClick={handleStartApplication}>
        <div className={`h-full w-full`}
          style={{ background: "linear-gradient(to top, #155477, #7AC8D0)" }}
        >
          <div className={`absolute top-0 backdrop-blur-[6px] flex justify-center items-center w-full h-full`}>
            <div className={`${applicationStart ? 'fade-out' : 'fade-in'} ${isMobile ? 'hidden' : 'flex'} flex-col  items-center w-full backdrop-blur-[6px] h-full justify-center relative`}>
              <h1 className="font-orbitron text-white tracking-[0.5em] font-bold text-center uppercase text-2xl lg:text-[72px] w-full box-border"> Gideon </h1>
              <div className="flex flex-col items-center h-full justify-end absolute bottom-[60px] lg:bottom-[161px]">
                <h2 className="text-xl text-white whitespace-nowrap breath">Toucher l'écran pour commencer</h2>
                <button className="z-50 cursor-pointer rounded-full h-[72px] w-[72px] border-5 border-white flex items-center justify-center mt-[26px] breath">
                  <img src={playIcon} alt="Play" />
                </button>
              </div>
              <div id="teams_logo" className="absolute bottom-10 right-10 gap-3 flex">
                <img src={willyImg} alt="Play" width={60} className="object-contain" />
                <img src={vinceImg} alt="Play" width={60} className="object-contain" />
                <img src={damienImg} alt="Play" width={80} className="object-contain" />
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className={`transition-opacity ${!applicationStart ? "opacity-0" : "opacity-100"} duration-100 z-50`}>
        <UserInterface handleTombFocus={handleTombFocus} />
      </div>
      <div className={`w-full lg:flex hidden justify-center ${!applicationStart ? "opacity-0" : "opacity-100"} absolute top-2 lg:top-[30px] z-50`} id='top-view-btn'>
        <div className={`w-[20%] h-[76px] opacity-100 transition-opacity duration-1000`}>
          <Button btnValue="Passer en vue aérienne" />
        </div>
      </div>
      {applicationStart && !isLoading && (
        <div className="w-full h-full relative">
          {/* {isLoading && <Loading />} */}
          <>

            {isMobile && !isModalOpen && (
              <div className="w-full flex justify-center absolute top-[6vh] px-[7px] z-50" id='mobile-top-view-btn'>
                <div className={`w-[416px] h-[104px] opacity-100 transition-opacity duration-3000`}>
                  <Button btnValue="Passer en vue aérienne" />
                </div>
              </div>
            )}


            <h1 className={`${isMobile ? 'flex' : 'hidden'} ${isShowUi ? 'flex' : 'hidden'} z-50 absolute bottom-[32px] text-white p-4 w-full text-center bg-dark-green`}>
              Cliquez sur la tombe en surbrillance pour obtenir des détails
            </h1>
          </>





          <TombModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              clearSelectedTomb();
              resetCameraPosition();
              setIsShowUi(true);
            }}
            tombName={selectedTomb}
            tombDetails={tombDetails}
            tombId={tombId}
            onTombClick={handleTombClick}
          />
        </div>
      )}
    </div>
  );
}

export default Scene;