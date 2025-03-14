import { lazy } from "react";

const AppLayout = lazy(() => import("../layout/AppLayout"));
const Willy = lazy(() => import("../layout/Willy"));
const Damien = lazy(() => import("../layout/Damien"));

export const ROUTES = [
  {
    path: "/",
    element: <AppLayout />,
  },
  {
    path: "/willy", 
    element: <Willy/>,
  },
  {
    path: "/damien", 
    element: <Damien/>,
  },
  {
    path: "*", 
    element: <AppLayout />,
  },
];