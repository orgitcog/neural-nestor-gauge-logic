import { defineConfig } from 'vite';

// Generate build timestamp in format YYYY-MM-DD_HH:MM
// Convert to PST/PDT (America/Los_Angeles timezone) for display
function getBuildTimestamp(): string {
  const now = new Date();
  // Convert to PST/PDT timezone
  const pstTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const year = pstTime.getFullYear();
  const month = String(pstTime.getMonth() + 1).padStart(2, '0');
  const day = String(pstTime.getDate()).padStart(2, '0');
  const hours = String(pstTime.getHours()).padStart(2, '0');
  const minutes = String(pstTime.getMinutes()).padStart(2, '0');
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

