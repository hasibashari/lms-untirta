import app from './app.js';
import cron from 'node-cron';
import { processAutoApprovals } from './jobs/krs-auto-approval.job.js';

const PORT = process.env.PORT || 3000;

// -- API --
app.get('/', (req, res) => {
  res.send('Welcome to the server LMS Informatika API');
});

// -- CRON JOBS --
// Auto-approval KRS: setiap hari jam 00:05
cron.schedule('5 0 * * *', async () => {
  console.log(`[CRON] ${new Date().toISOString()} - Processing KRS auto-approvals...`);
  const result = await processAutoApprovals();
  console.log(`[CRON] Auto-approved ${result.processed} KRS enrollments`);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
