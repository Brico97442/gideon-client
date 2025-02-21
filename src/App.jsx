import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ROUTES } from "./config/routes";

export default function App() {

  const router = createBrowserRouter(ROUTES);

  return (
    <div>
    <RouterProvider router={router}/>
    </div>
    
  );
}
