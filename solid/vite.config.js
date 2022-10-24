import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
  resolve: {
    alias: {
      // fix: ReferenceError: global is not defined @ node-fetch: Body.Promise = global.Promise;
      // fix: TypeError: Cannot read properties of undefined (reading 'prototype') @ node-fetch: Stream.Readable.prototype
      // https://github.com/octokit/octokit.js/issues/2126
      'node-fetch': 'isomorphic-fetch',
    },
  },
});
