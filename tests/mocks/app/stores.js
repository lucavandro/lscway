import { readable } from 'svelte/store';

export const page = readable({
  url: new URL('http://localhost:1987/app/way/tmp/'),
  params: {},
  route: { id: '/' },
  status: 200,
  error: null,
  data: {}
});

export const navigating = readable(null);
export const updated = readable(false);
