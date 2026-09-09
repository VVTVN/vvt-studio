import tailwindcss from '@tailwindcss/postcss';\nimport { cloudflare } from '@cloudflare/vite-plugin';
import vinext from 'vinext';
import { defineConfig } from 'vite';
export default defineConfig({
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [\n    vinext(),\n    cloudflare({\n      viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },\n    }),\n  ],
  server: { host: '127.0.0.1' },
});
