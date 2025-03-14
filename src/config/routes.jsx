import { lazy } from "react";

const AppLayout = lazy(() => import("../layout/AppLayout"));
const Willy = lazy(() => import("../layout/Willy"));

export const ROUTES = [
  {
    path: "/",
    element: <AppLayout />,
  },
  {
    path: "*", 
    element: <AppLayout />,
  },
  {
    path: "/willy", 
    element: <Willy/>,
  },
];