import { build, files, prerendered, version } from "$service-worker";
import { precacheAndRoute } from "workbox-precaching";
import {offlineFallback} from 'workbox-recipes';
import {setDefaultHandler} from 'workbox-routing';
import {NetworkFirst} from 'workbox-strategies';

const precache_list = [
  ...build,
  ...files,
  ...prerendered,
].map((s) => ({
  url: s,
  revision: version,
}));


precacheAndRoute(precache_list);

setDefaultHandler(new NetworkFirst());

offlineFallback();