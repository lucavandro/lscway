import { build, files, prerendered, version } from "$service-worker";
import { precacheAndRoute } from "workbox-precaching";

const precache_list = [
  ...build,
  ...files,
  ...prerendered,
].map((s) => ({
  url: s,
  revision: version,
}));

console.log(precache_list)
precacheAndRoute(precache_list);