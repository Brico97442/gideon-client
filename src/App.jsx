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

  function Instances({ count = 100000, temp = new THREE.Object3D() }) {
    const instancedMeshRef = useRef()
    useEffect(() => {
      // Set positions
      for (let i = 0; i < count; i++) {
        temp.position.set(Math.random(), Math.random(), Math.random())
        temp.updateMatrix()
        instancedMeshRef.current.setMatrixAt(i, temp.matrix)
      }
      // Update the instance
      instancedMeshRef.current.instanceMatrix.needsUpdate = true
    }, [])
    return (
      <instancedMesh ref={instancedMeshRef} args={[null, null, count]}>
        <boxGeometry />
        <meshPhongMaterial />
      </instancedMesh>
    )
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