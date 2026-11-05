import { _ as require_jsx_runtime, d as HeadContent, g as createRootRoute, h as createFileRoute, m as lazyRouteComponent, p as createRouter, u as Scripts } from "../_libs/@tanstack/react-router+[...].mjs";
// node_modules/.nitro/vite/services/ssr/assets/router-Bd7XjNLQ.js
var import_jsx_runtime = require_jsx_runtime();
var rootMeta = { "/": {
	"title": "Regulatory Pathway Explorer",
	"description": "Click through how a drug moves from discovery to approval under FDA, EMA, and CDSCO, and compare the three side by side."
} }["/"];
var Route$1 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: rootMeta.title },
			{
				name: "description",
				content: rootMeta.description
			}
		],
		links: [{
			rel: "icon",
			type: "image/svg+xml",
			href: "/favicon.svg"
		}]
	}),
	shellComponent: RootDocument
});
function RootDocument({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
var $$splitComponentImporter = () => import("./routes-BkR6HRm0.mjs");
var rootRouteChildren = { IndexRoute: createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter, "component") }).update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$1
}) };
var routeTree = Route$1._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
	return createRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0
	});
}
export { getRouter };
