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

function App() {

  function CameraControls() {
    const { invalidate } = useThree();
    return <OrbitControls onChange={() => invalidate()} />;
  }

  return (
    <>
      <div id="canvas" className="w-full h-full" >
        <Canvas frameloop="always">
          <ambientLight intensity={0.1} />
          <directionalLight color="red" position={[0, 0, 5]} />
          {Array.from({ length: 100 }).map((_, i) => (
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
          ))}
          <Stats />
          <OrbitControls />
        </Canvas>
      </div>
    </>
  );
}

export default App;