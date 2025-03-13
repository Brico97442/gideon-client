// import "./App.css";
// import { createBrowserRouter, RouterProvider } from "react-router-dom";
// import { ROUTES } from "./config/routes";
// import { TombProvider } from "./context/TombContext";

// export default function App() {

//   const router = createBrowserRouter(ROUTES);

//   return (
//     <TombProvider>
//       <div>
//         <RouterProvider router={router}/>
//       </div>
//     </TombProvider>
//   );
// }
import { Canvas, useThree } from "@react-three/fiber";
import "./App.css";
import { OrbitControls, Stats } from "@react-three/drei";
import { useEffect } from "react";
import { useRef } from "react";
import * as THREE from 'three';

function App() {

  function CameraControls() {
    const { invalidate } = useThree();
    return <OrbitControls onChange={() => invalidate()} />;
  }

  function Instances({ count = 1000, temp = new THREE.Object3D() }) {
    const instancedMeshRef = useRef();
    const lodRef = useRef();
    const { camera } = useThree();

    useEffect(() => {
      // Créer les géométries LOD
      const lod = new THREE.LOD();
      
      // Niveau de détail élevé - cube normal
      const highDetailGeometry = new THREE.BoxGeometry(1, 1, 1);
      const highDetailMaterial = new THREE.MeshPhongMaterial();
      const highDetailMesh = new THREE.Mesh(highDetailGeometry, highDetailMaterial);
      
      // Niveau de détail moyen - cube légèrement simplifié
      const medDetailGeometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
      const medDetailMaterial = new THREE.MeshPhongMaterial();
      const medDetailMesh = new THREE.Mesh(medDetailGeometry, medDetailMaterial);
      
      // Niveau de détail faible - cube très simplifié
      const lowDetailGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      const lowDetailMaterial = new THREE.MeshPhongMaterial();
      const lowDetailMesh = new THREE.Mesh(lowDetailGeometry, lowDetailMaterial);

      // Ajouter les niveaux au LOD
      lod.addLevel(highDetailMesh, 0);    // Visible de 0 à 50 unités
      lod.addLevel(medDetailMesh, 50);    // Visible de 50 à 100 unités
      lod.addLevel(lowDetailMesh, 100);   // Visible au-delà de 100 unités

      lodRef.current = lod;

      // Set positions
      for (let i = 0; i < count; i++) {
        temp.position.set(
          Math.random() * 100 - 50,
          Math.random() * 100 - 50,
          Math.random() * 100 - 50
        );
        temp.updateMatrix();
        instancedMeshRef.current.setMatrixAt(i, temp.matrix);
      }
      // Update the instance
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    }, []);

    useEffect(() => {
      // Mettre à jour les LODs en fonction de la position de la caméra
      const updateLODs = () => {
        if (lodRef.current) {
          lodRef.current.update(camera);
        }
      };

      // Ajouter l'écouteur d'événements pour la mise à jour des LODs
      window.addEventListener('render', updateLODs);
      return () => window.removeEventListener('render', updateLODs);
    }, [camera]);

    return (
      <instancedMesh ref={instancedMeshRef} args={[null, null, count]}>
        <boxGeometry />
        <meshPhongMaterial />
      </instancedMesh>
    );
  }

  return (
    <>
      <div id="canvas" className="w-full h-full" >
        <Canvas frameloop="demand">
          <ambientLight intensity={0.1} />
          <directionalLight color="red" position={[0, 0, 5]} />
          <Instances />
          {/* {Array.from({ length: 1000 }).map((_, i) => (
            <mesh 
              key={i}
              position={[
                Math.random() * 20 - 10,
                Math.random() * 20 - 10, 
                Math.random() * 20 - 10
              ]}
              rotation={[
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
              ]}
              scale={Math.random() * 0.5 + 0.5}
            >
              <boxGeometry />
              <meshStandardMaterial color={`hsl(${Math.random() * 360}, 50%, 50%)`} />
            </mesh>
          ))} */}
          <Stats />
          <CameraControls />
        </Canvas>
      </div>
    </>
  );
}

export default App;