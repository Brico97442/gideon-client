import { Canvas, useThree } from "@react-three/fiber";
import "./App.css";
import { OrbitControls, Stats, useGLTF, Detailed } from "@react-three/drei";
import { useEffect } from "react";
import { useRef } from "react";
import * as THREE from "three";
import Ground from "./models/Ground";
import { useState } from "react";

function CameraControls() {
  const { invalidate } = useThree();
  return <OrbitControls onChange={() => invalidate()} />;
}

function Instances({ count = 1000 }) {
  const instancedMeshRef = useRef();
  const { camera } = useThree();
  const temp = new THREE.Object3D();

  // Chargement des différents niveaux de détail
  const low = useGLTF("/3d-models/gltf/tomb/01/01_LOD2.glb");
  const mid = useGLTF("/3d-models/gltf/tomb/01/01_LOD1.glb");
  const high = useGLTF("/3d-models/gltf/tomb/01/01_LOD0.glb");

  // État pour suivre quel niveau de détail utiliser
  const [lodLevel, setLodLevel] = useState(high);

  useEffect(() => {
    if (!instancedMeshRef.current || !low || !mid || !high) return;

    const updateLOD = () => {
      const distance = camera.position.length();
      if (distance < 15) {
        setLodLevel(high);
      } else if (distance < 30) {
        setLodLevel(mid);
      } else {
        setLodLevel(low);
      }
    };

    // Écoute les mouvements de la caméra
    camera.addEventListener("change", updateLOD);
    return () => camera.removeEventListener("change", updateLOD);
  }, [camera, low, mid, high]);

  useEffect(() => {
    if (!instancedMeshRef.current || !lodLevel) return;

    const originalMesh = lodLevel.scene.children[0];
    if (!originalMesh) return;

    const geometry = originalMesh.geometry;
    const material = originalMesh.material;

    instancedMeshRef.current.geometry = geometry;
    instancedMeshRef.current.material = material;

    const rows = Math.sqrt(count);
    const spacing = 2;
    const startX = -(rows * spacing) / 2;
    const startZ = -(rows * spacing) / 2;

    let index = 0;
    for (let i = 0; i < rows && index < count; i++) {
      for (let j = 0; j < rows && index < count; j++) {
        const x = startX + i * spacing + (Math.random() - 0.5) * 0.3;
        const z = startZ + j * spacing + (Math.random() - 0.5) * 0.3;
        temp.position.set(x, 0, z);
        temp.rotation.set(0, Math.random() * 0.2 - 0.1, 0);
        temp.scale.setScalar(Math.random() * 0.2 + 0.9);
        temp.updateMatrix();
        instancedMeshRef.current.setMatrixAt(index, temp.matrix);
        index++;
      }
    }

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [lodLevel, count]);

  return (
    <instancedMesh ref={instancedMeshRef} args={[null, null, count]} />
  );
}

function App() {

  return (
    <>
      <div id="canvas" className="w-full h-full">
      <Canvas frameloop="demand">
        <ambientLight intensity={5} />
        <directionalLight color="red" position={[0, 0, 5]} />
        <Instances />
        <Stats />
        <CameraControls />
      </Canvas>
    </div>
    </>
  );
}

export default App;
