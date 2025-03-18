import { lazy } from "react";

const AppLayout = lazy(() => import("../layout/AppLayout"));
const Willy = lazy(() => import("../layout/Willy"));
const Vincent = lazy(() => import("../layout/Vincent"));

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
    path: "/vincent", 
    element: <Vincent/>,
  },
  {
    path: "*", 
    element: <AppLayout />,
  },
];