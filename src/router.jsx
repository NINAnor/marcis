import {
  Router,
} from "@tanstack/react-router";

import queryClient from "./queryClient";
import rootRoute from "./pages/root";
import { viewerRoute } from "./pages/viewer";

const routeTree = rootRoute.addChildren([viewerRoute]);

const router = new Router({ routeTree, context: { queryClient }, defaultPreloadStaleTime: 0, defaultPreload: 'intent', });

export default router;
