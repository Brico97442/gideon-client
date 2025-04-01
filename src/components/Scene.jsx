import { useState, useEffect, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Float, SoftShadows, Text, Billboard, StatsGl, Stats, OrbitControls, PerformanceMonitor, SpotLight } from "@react-three/drei";
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
import logo from '../assets/teams_logo/saintpaul.png'
// import { Perf } from 'r3f-perf'
import { GET_DECEASED } from "../config/api";
import Cross from "../models/Cross";
import Pointer from "../models/Pointer";
// import { Bloom, EffectComposer, DepthOfField, Outline } from '@react-three/postprocessing';
import { useTomb, findTombMeshById } from '../context/TombContext';
import gsap from "gsap";
import Button from "./Button";
import { useControls } from 'leva'

import playIcon from '../assets/play_arrow.svg';
import willyImg from '../assets/teams_logo/willprod_white.png';
import vinceImg from '../assets/teams_logo/vince.png';
import damienImg from '../assets/teams_logo/damien_white.png';
import patoumaImg from '../assets/teams_logo/patouma.png';
import { TransitionEffect } from './TransitionEffect';
// import Grass from "./Grass";
// import Grass2 from "./Grass2";
import Road from "../models/Road";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
// import Button from "./Button";
// import Test from "./Test";

// Définition des couleurs des sections
const sectionColors = {
  89: '#f7d0db',
  90: '#fff5c2',
  91: '#cbb8de',
  92: '#E0C2B6',
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
  const { selectTomb, clearSelectedTomb, setSceneElements, selectedTombPosition, setSelectedTombPosition } = useTomb();
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
        window.tombsSystem = {};
      }
      window.tombsSystem.invalidate = invalidate;

      if (!window.tombsSystem.highlightGroup) {
        window.tombsSystem.highlightGroup = new THREE.Group();
        scene.add(window.tombsSystem.highlightGroup);
      }

      window.tombsSystem.camera = camera;
      window.tombsSystem.scene = scene;
      window.tombsSystem.orbitControlRef = orbitControlRef;

      setSceneElements(camera, orbitControlRef, tombClones);


      setIsTransitioning(true);

    }, [camera, invalidate, scene]);

    return null;
  };


  const handleTombClick = (id) => {
    setIsModalOpen(true);
    setSelectedTomb(id);
    if (camera && orbitControlRef.current) {
        if (!window.tombsSystem || !window.tombsSystem.tombPositions || !window.tombsSystem.tombPositions[id]) {
            console.warn("Données de tombe non disponibles pour l'ID:", id);
            fetchTombDetails(id);
            return;
        }

        const tombData = window.tombsSystem.tombPositions[id];
        setSelectedTombPosition(tombData);

        focusOnObject(id, camera, orbitControlRef, sectionColors);

        // Ne réinitialiser le highlight group que si on clique sur une tombe différente
        if (window.tombsSystem.highlightGroup && window.tombsSystem.highlightGroup.children.length > 0) {
            const currentHighlightedTomb = window.tombsSystem.highlightGroup.children[0].userData.id;
            if (currentHighlightedTomb !== id) {
                while (window.tombsSystem.highlightGroup.children.length > 0) {
                    window.tombsSystem.highlightGroup.remove(window.tombsSystem.highlightGroup.children[0]);
                }
                highlightTombSection(id);
            }
        } else {
            highlightTombSection(id);
        }

        if (tombData) {
            createHighlightForTomb(id, tombData, COLORS.SELECTED_TOMB, true);
        }

        fetchTombDetails(id);
        setIsShowUi(false);
    } else {
        fetchTombDetails(id);
    }
  };


  const handleTombFocus = (id, personDetails) => {
    setIsModalOpen(true);
    setSelectedTomb(id);

    if (camera && orbitControlRef.current) {
      const tombData = window.tombsSystem.tombPositions[id];
      setSelectedTombPosition(tombData);

      focusOnObject(id, camera, orbitControlRef, sectionColors);

      highlightTombSection(id);
      if (tombData) {
        createHighlightForTomb(id, tombData, COLORS.SELECTED_TOMB, true);
      }

      if (personDetails) {
        setTombDetails([personDetails]);
        selectTomb(id, [personDetails]);
      } else {
        fetchTombDetail(id);
      }
      setIsShowUi(false);
    } else {
      if (personDetails) {
        setTombDetails([personDetails]);
        selectTomb(id, [personDetails]);
      } else {
        fetchTombDetail(id);
      }
    }
  };


  const handleTopView = () => {
    if (!camera) return;
    setIsShowUi(true);
    setIsModalOpen(false);
    clearSelectedTomb();
    const topViewPosition = isMobile ? { x: 0, y: 120, z: 0.001 } : { x: 0, y: 90, z: 0.001 };

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

      // Fonction pour appliquer la surbrillance
      const applyHighlight = () => {
        if (window.tombsSystem && window.tombsSystem.tombPositions && window.tombsSystem.instanceColors) {
          const tombData = window.tombsSystem.tombPositions[savedTomb];
          if (tombData) {
            highlightSelectedTomb(savedTomb);
            setSelectedTomb(savedTomb);
            setSelectedTombPosition(tombData);
            fetchTombDetails(savedTomb);
            return true;
          }
        }
        return false;
      };

      let attempts = 0;
      const maxAttempts = 20; // Nombre maximal de tentatives

      const checkSystem = () => {
        attempts++;

        if (applyHighlight()) {
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
  }, []);


  const handleStartApplication = () => {
    setApplicationStart(true);
    setTimeout(() => {
      setIsTransitioning(true);
      setIsSceneLoaded(true);
      setIsLoading(false);
    }, 3000);
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
      <div className={`z-30 relative h-full w-full transition-colors text-white flex justify-center flex-col items-center bg-linear-to-r from-gray-300 to-lite-blue`}>
        <h1 className="font-orbitron text-white tracking-[0.5em] font-bold text-center uppercase text-2xl lg:text-[72px] w-full box-border"> GIDEON</h1>
        <div className="absolute bottom-[22.5vh]  lg:bottom-[161px] text-xl flex flex-col items-center gap-2 justify-center p-6 ">
          <p>Initialisation de l'application</p>
          <div className="relative w-16 h-16 flex items-center justify-center breath">
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-[spin_1.5s_cubic-bezier(0.25,1,0.5,1)_infinite]"></div>
            <div className="absolute top-0 left-0 w-6 h-6 rounded-full"
              style={{ clipPath: "polygon(50% 50%, 100% 0, 100% 100%)" }}>
            </div>
          </div>
        </div>
        <div id="teams_logo" className="absolute bottom-10 lg:right-10 right-0 gap-3 flex justify-center lg:justify-end rounded-lg w-full lg:w-auto">
          <img src={logo} alt="Saint paul logo" width={isMobile ? 100 : 140} height={isMobile ? 50 : 80} className="object-contain" />
          <img src={willyImg} alt="Play" width={isMobile ? 50 : 80} height={isMobile ? 50 : 80} className="object-contain" />
          <img src={vinceImg} alt="Play" width={isMobile ? 50 : 80} height={isMobile ? 50 : 80} className="object-contain" />
          <img src={damienImg} alt="Play" width={isMobile ? 50 : 100} height={isMobile ? 50 : 80} className="object-contain" />
          <img src={patoumaImg} alt="Play" width={isMobile ? 50 : 80} height={isMobile ? 50 : 80} className="object-contain" />
        </div>
      </div>
    )
  }
  // const { intensity } = useControls({ intensity: { value: 1, min: 0, max: 5 } })
  return (
    <div className="main relative h-full w-full">
      {/* <Float rotation Intensity={0.5} floatIntensity={8} speed={1}>
          </Float> */}
      <Suspense fallback={<Loading />}>
        <Canvas
          // frameloop="demand"
          camera={{ near: 0.2, position: isMobile ? [0, 100, 5] : [30, 50, 75], rotation: [0, Math.PI, 0] }}
          id="tomb-canvas"
          className={`absolute h-full w-full top-0 left-0 transition-opacity ${!applicationStart ? "opacity-0 z-0" : "opacity-100 z-30"} duration-2000`}
        // style={{ background: "linear-gradient(to top, #155477, #7AC8D0)" }}
        >
          <group>
            <Entrance />
            <Wall />
            <Ground />
            <Cross />
            <Road />

            <Billboard position={isMobile ? [0, 12, 34] : [-1, 12, 38]} follow={true} lockX={false} lockY={false} lockZ={false}>
              <group>
                <Pointer />
                <Text fontSize={isMobile ? 3.5 : 2} color="#9a2252" outlineColor='#ffffff' outlineBlur={0.6}>
                  Vous êtes ici
                </Text>
              </group>
            </Billboard>

            <ambientLight intensity={2.5} position={[0, 0, 0]} />

            { selectedTombPosition && (
              <>
                <pointLight
                  position={[
                    selectedTombPosition.x + 0.01,
                    selectedTombPosition.y + 1.8,
                    selectedTombPosition.z + 0.2
                  ]}
                  rotation={[0, Math.PI / 2, 0]}
                  angle={180}
                  penumbra={0.3}
                  intensity={40}
                  color="#8fcecc"
                  castShadow
                />
                   {/* <EffectComposer>
              <Bloom intensity={0.2} width={200} height={200} luminanceThreshold={0.1} luminanceSmoothing={1} />
            </EffectComposer> */}
                {/* <group rotation={[0, Math.PI / 2, 0]}>
                  <SpotLight
                    position={[
                      selectedTombPosition.x ,
                      selectedTombPosition.y + 1.8,
                      selectedTombPosition.z
                    ]}
                     color="red"
                    intensity={30}
                    angle={0.5}
                    penumbra={0.5}
                  />
                </group> */}
                {/* <PointLightHelper 
                  position={[
                    selectedTombPosition.x + 0.01,
                    selectedTombPosition.y + 1.8,
                    selectedTombPosition.z + 0.2
                  ]}
                  color="yellow"
                  intensity={30}
                  distance={5}
                /> */}
              </>
            )}

            <Tombs2
              onTombClick={
                // isMobile ?
                // handleTombFocus :
                handleTombClick
              }
              selectedTombId={selectedTomb}
              orbitControlRef={orbitControlRef}
              glowLayer={[glowLayer]}
            />
         
            {/* <hemisphereLight position={[-2, 3, -2]} decay={2} intensity={5} args={['#9a2252', '#fff5c2']} /> */}

          </group>

          <SceneCamera />
          <MainOrbitControl orbitControlRef={orbitControlRef} onCameraMove={handleCameraMove} />
          {/* <StatsGl  position='absolute top-0 left-0' />
          <Stats position='absolute top-0 left-0'/>
          <PerformanceMonitor  position='top-0 left-0'/> */}
        </Canvas>

      </Suspense>
      {/* <Loading /> */}

      <div className={`fixed h-full w-full`} onClick={handleStartApplication}>
        <div className={`h-full w-full transition-all ease-in-out duration-1000] ${!applicationStart ? "bg-linear-to-r from-gray-300 to-lite-blue " : "bg-linear-to-r from-lite-blue to-gray-300 "}`}
        // style={{ background: "linear-gradient(to top, #155477, #7AC8D0)" }}
        >
          <img src={logo} alt="Saint paul logo" width={140} height={80} className={`object-contain z-50 h-full w-full ${!applicationStart ? "opacity-0" : "opacity-20"}`} />

          <div className={`absolute top-0 flex justify-center items-center w-full h-full`}>
            <div className={`${applicationStart ? 'fade-out' : 'fade-in'} ${isMobile ? 'hidden' : 'flex'} flex-col  items-center w-full h-full justify-center relative`}>
              <h1 className="font-orbitron text-white tracking-[0.5em] font-bold text-center uppercase text-2xl lg:text-[72px] w-full box-border"> GIDEON </h1>
              <div className="flex flex-col items-center h-full justify-end absolute bottom-[60px] lg:bottom-[161px]">
                <h2 className="text-xl text-white whitespace-nowrap breath">Toucher l'écran pour commencer</h2>
                <button className="z-50 cursor-pointer rounded-full h-[72px] w-[72px] border-5 border-white flex items-center justify-center mt-[26px] breath">
                  <img src={playIcon} alt="Play" />
                </button>
              </div>
              <div id="teams_logo" className="absolute bottom-10 right-10 gap-3 flex">
                <img src={logo} alt="Saint paul logo" width={140} height={80} className="object-contain" />
                <img src={willyImg} alt="Play" width={80} height={80} className="object-contain" />
                <img src={vinceImg} alt="Play" width={80} height={80} className="object-contain" />
                <img src={damienImg} alt="Play" width={100} height={80} className="object-contain" />
                <img src={patoumaImg} alt="Play" width={80} height={80} className="object-contain" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`transition ${!applicationStart ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"} absolute h-[12vh] w-full ease-in-out duration-1000 z-50`}>
        <UserInterface 
          handleTombFocus={handleTombFocus} 
          handleStartApplication={applicationStart} 
          onInputFocus={() => {
            setIsModalOpen(false);
            clearSelectedTomb();
            resetCameraPosition();
            setIsShowUi(true);
          }}
        />
      </div>

      <div className={`w-full ${!isMobile ? 'flex' : 'hidden'} justify-center absolute bottom-[8px]`}>
        <div className={`w-[21vw] ${!applicationStart ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"} duration-1000 z-50`} id='top-view-btn'>
          <Button btnValue="Vue aérienne" />
        </div>
      </div>

      {applicationStart && !isLoading && (
        <div className="w-full h-full relative flex items-center">
          <>
            <h1 className={`${isMobile ? 'flex' : 'hidden'} ${isShowUi ? 'flex' : 'hidden'} z-50 absolute top-[6vh] text-white p-4 lg:p-0 w-full text-center bg-dark-green`}>
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
            // tombDetail={tombDetails}
            tombId={tombId}
            onTombClick={handleTombClick}
          />
        </div>
      )}

    </div>
  );
}

export default Scene;