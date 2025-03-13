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
import { Canvas } from "@react-three/fiber";
import "./App.css";
import { OrbitControls, Stats } from "@react-three/drei";

function App() {
  return (
    <>
      <div id="canvas" className="w-full h-full">
        <Canvas>
        <ambientLight intensity={0.1} />
        <directionalLight color="red" position={[0, 0, 5]} />
          <mesh>
            <boxGeometry />
            <meshStandardMaterial />
          </mesh>
          <Stats />
          <OrbitControls />
        </Canvas>
      </div>
    </>
  );
}

export default App;