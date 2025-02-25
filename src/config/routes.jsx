import { lazy } from "react";

const AppLayout = lazy(() => import("../layout/AppLayout"));

export const ROUTES = [
  {
    path: "/",
    element: <AppLayout />,
  },
  {
    path: "*", 
    element: <AppLayout />,
  },
];