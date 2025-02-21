import Scene from "../components/Scene";
import { useState } from "react";

// import { useContext } from "react";

function AppLayout() {
    return (
        <main className="fixed left-0 top-0 min-w-screen h-screen w-full ">
            <Scene />
        </main>
    );
}

export default AppLayout;
