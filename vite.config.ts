import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    esbuild: {
      legalComments: 'none' as const,
      sourcemap: false,
    },
    css: {
      devSourcemap: false,
    },
    build: {
      rollupOptions: {
        input: (() => {
          const inputs: Record<string, string> = {
            main: path.resolve(__dirname, 'index.html'),
            landing: path.resolve(__dirname, 'landing.html'),
            cities: path.resolve(__dirname, 'cities.html'),
            services: path.resolve(__dirname, 'services.html'),
            request: path.resolve(__dirname, 'request.html'),
            designerDashboard: path.resolve(__dirname, 'designer-dashboard.html'),
            adminDashboard: path.resolve(__dirname, 'admin-dashboard.html'),
            login: path.resolve(__dirname, 'login.html'),
            contact: path.resolve(__dirname, 'contact.html'),
            about: path.resolve(__dirname, 'about.html'),
            latestWorks: path.resolve(__dirname, 'latest-works.html'),
            track: path.resolve(__dirname, 'track.html'),
            terms: path.resolve(__dirname, 'terms.html'),
            privacy: path.resolve(__dirname, 'privacy.html'),
          };
          try {
            const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));
            for (const file of files) {
              const key = file.replace(/\.html$/, '').replace(/[^a-zA-Z0-9]/g, '_');
              if (!inputs[key]) {
                inputs[key] = path.resolve(__dirname, file);
              }
            }
          } catch(e) {}
          return inputs;
        })(),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

