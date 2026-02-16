
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/upload/index.tsx"),
  // Ignore Chrome DevTools requests
  route(".well-known/*", "routes/ignore.tsx"),
] satisfies RouteConfig;
