import { defineConfig } from 'vite';

// Generate build timestamp in format YYYY-MM-DD_HH:MM
function getBuildTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}:${minutes}`;
}

export default defineConfig({
  root: 'src',
  define: {
    __BUILD_TIME__: JSON.stringify(getBuildTimestamp()),
  },
  build: {
    outDir: '../backend/tensor-logic/dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});

