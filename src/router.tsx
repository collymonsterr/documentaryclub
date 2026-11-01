import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { urlRewrite } from "./lib/site-urls";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    rewrite: urlRewrite,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
