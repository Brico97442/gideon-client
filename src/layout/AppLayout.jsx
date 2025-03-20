import { Suspense } from "react";
import Scene from "../components/Scene";

function AppLayout() {
    return (
        <main className="fixed left-0 top-0 min-w-screen h-full w-full">
            <Scene />
        </main>
    );
}

export default AppLayout;
