import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";

import Scene from "../components/Scene";
import ParticleSystem from "../components/ParticlesScene";

function AppLayout() {
    return (
        <main className="fixed left-0 top-0 min-w-screen h-full w-full">
            <div className="z-[0] absolute h-full w-full">
                <Canvas camera={{ near: 0.2, position: [-20, 20, -50] }} style={{ background: "linear-gradient(to top, #155477, #7AC8D0)" }}>
                    <ParticleSystem />
                </Canvas>
            </div>
            <div className="w-full relative h-full">

            <Scene />
            </div>
        </main>
    );
}

export default AppLayout;
