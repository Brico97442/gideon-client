import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ROUTES } from "./config/routes";
import { TombProvider } from "./context/TombContext";

export default function App() {

  const router = createBrowserRouter(ROUTES);

  return (
    <TombProvider>
      <div>
        <RouterProvider router={router} />
      </div>
    </TombProvider>
  );
}