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
import { OrbitControls, Stats, useGLTF } from "@react-three/drei";
import { useEffect } from "react";
import { useRef } from "react";
import * as THREE from 'three';
import Ground from "./models/Ground";

function App() {

  function CameraControls() {
    const { invalidate } = useThree();
    return <OrbitControls onChange={() => invalidate()} />;
  }

  function Instances({ count = 1000, temp = new THREE.Object3D() }) {
    const instancedMeshRef = useRef();
    const { camera } = useThree();
    const { scene: tombModel } = useGLTF('/3d-models/gltf/tomb/01.glb');

    useEffect(() => {
      // Assurons-nous que le modèle est chargé
      if (!tombModel) return;

      // Créons une géométrie et un matériau à partir du premier mesh du modèle
      const originalMesh = tombModel.children[0];
      const geometry = originalMesh.geometry;
      const material = originalMesh.material;

      // Configurons l'instancedMesh avec la géométrie et le matériau du modèle
      instancedMeshRef.current.geometry = geometry;
      instancedMeshRef.current.material = material;

      // Positionnons les instances
      for (let i = 0; i < count; i++) {
        temp.position.set(
          Math.random() * 100 - 50,
          Math.random() * 100 - 50, 
          Math.random() * 100 - 50
        );
        temp.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        temp.scale.setScalar(Math.random() * 0.5 + 0.5);
        temp.updateMatrix();
        instancedMeshRef.current.setMatrixAt(i, temp.matrix);
      }

      // Mettons à jour la matrice d'instances
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    }, [tombModel, count]);

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
          <ambientLight intensity={5} />
          <directionalLight color="red" position={[0, 0, 5]} />
          <Ground />
          {/* <Instances /> */}
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