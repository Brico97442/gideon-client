import { Canvas } from "@react-three/fiber";
import "./App.css";
import { Stats } from "@react-three/drei";

function App() {
  return (
    <>
      <div id="canvas-container">
        <Canvas>
        <ambientLight intensity={0.1} />
        <directionalLight color="red" position={[0, 0, 5]} />
          <mesh>
            <boxGeometry />
            <meshStandardMaterial />
          </mesh>
          <Stats />
        </Canvas>
      </div>
    </>
  );
}

export default App;