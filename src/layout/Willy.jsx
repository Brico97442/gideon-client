import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Stats, useGLTF } from "@react-three/drei";
import { useEffect, useState, useRef, useCallback } from "react";
import * as THREE from "three";

function CameraControls({ onCameraMove }) {
  return <OrbitControls onChange={onCameraMove} />;
}

function Instances({ count = 1000 }) {
  const instancedMeshRef = useRef();
  const { camera } = useThree(); // Assure-toi que useThree() est bien dans Instances
  const temp = new THREE.Object3D();

  const low = useGLTF("/3d-models/gltf/tomb/01/01low.glb");
  const mid = useGLTF("/3d-models/gltf/tomb/01/01mid.glb");
  const high = useGLTF("/3d-models/gltf/tomb/01/01high.glb");

  const [lodLevel, setLodLevel] = useState(high);

  // Fonction de mise à jour du LOD
  const updateLOD = useCallback(() => {
    const distance = camera.position.length();
    if (distance < 15) {
      setLodLevel(high);
    } else if (distance < 30) {
      setLodLevel(mid);
    } else {
      setLodLevel(low);
    }
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
    <>
      <instancedMesh ref={instancedMeshRef} args={[null, null, count]} />
      <CameraControls onCameraMove={updateLOD} />
    </>
  );
}

function App() {
  return (
    <div id="canvas" className="w-screen h-screen">
      <Canvas frameloop="demand">
        <ambientLight intensity={5} />
        <directionalLight color="red" position={[0, 0, 5]} />
        <Instances />
        <Stats />
      </Canvas>
    </div>
  );
}

export default App;