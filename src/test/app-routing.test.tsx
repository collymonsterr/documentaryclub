import { QueryClient } from "@tanstack/react-query";
import { createRootRoute, createRoute, createRouter, RouterProvider, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { routeTree } from "@/routeTree.gen";
import { SiteLogo } from "@/components/site-logo";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("preserves the directors page and resolves the new makers page", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(router.matchRoutes('/directors').at(-1)?.routeId).toBe('/directors');
    expect(router.matchRoutes('/makers').at(-1)?.routeId).toBe('/makers');
  });

  // The wordmark in the header is the site's home affordance on every page.
  it("renders the logo as a link back to the homepage", async () => {
    const root = createRootRoute();
    const home = createRoute({ getParentRoute: () => root, path: "/", component: SiteLogo });
    const router = createRouter({ routeTree: root.addChildren([home]) });
    await router.load();

    render(<RouterProvider router={router} />);

    const link = screen.getByRole("link", { name: "Documentary Club home" });
    const target = new URL(link.getAttribute("href")!, "http://localhost");
    expect(target.pathname).toBe("/");
    // Opens the plain homepage: no film, saved list or search pinned (the live route
    // strips these empty values, so the browser lands on a bare "/").
    expect(Object.fromEntries(target.searchParams)).toEqual({ film: "", q: "", list: "", cat: "all", era: "all", len: "all", type: "all", sort: "random", award: "", mood: "", pick: "", maker: "", tag: "", browse: "topics" });
  });
});
