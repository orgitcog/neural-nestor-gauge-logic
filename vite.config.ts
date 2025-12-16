import { defineConfig } from 'vite';

// Generate build timestamp in format YYYY-MM-DD_HH:MM
// Convert to PST/PDT (America/Los_Angeles timezone) for display
// GitHub Actions runs in UTC, so we convert to PST/PDT
function getBuildTimestamp(): string {
  const now = new Date();
  // Format the date in PST/PDT timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  const hours = parts.find(p => p.type === 'hour')?.value || '';
  const minutes = parts.find(p => p.type === 'minute')?.value || '';
  
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

