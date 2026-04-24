import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      nodePolyfills({
        include: ['buffer', 'path', 'process', 'net', 'tty'],
      }),
    ],
    server: {
      port: 5173,
      // Headers required for bb WASM multithreaded mode
      headers: {
        // same-origin-allow-popups: enables WASM SharedArrayBuffer while
        // allowing wallet connect popups (Azguard) to communicate back
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Embedder-Policy': 'credentialless',
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    define: {
      'process.env': JSON.stringify({
        AZTEC_NODE_URL: env.AZTEC_NODE_URL ?? 'http://localhost:8080',
      }),
    },
  };
});
