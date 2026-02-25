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
// Safety wrapper: catches all errors, logs structured output
cron.schedule('5 0 * * *', async () => {
  const timestamp = new Date().toISOString();
  console.log(`[CRON] ${timestamp} - Starting KRS auto-approval job...`);

  try {
    const result = await processAutoApprovals();

    if (result.error) {
      console.error(`[CRON] ${timestamp} - Job FAILED: ${result.error}`);
    } else if (result.skipped) {
      console.log(`[CRON] ${timestamp} - Job SKIPPED (no active semester with auto-approval)`);
    } else {
      console.log(`[CRON] ${timestamp} - Job SUCCESS: auto-approved ${result.processed} KRS (${result.durationMs}ms)`);
      if (result.isAnomalous) {
        console.warn(`[CRON] ${timestamp} - ⚠ ANOMALY: Unusually high volume (${result.processed} approvals)`);
      }
    }
  } catch (fatalError) {
    // Last-resort catch — should never reach here since processAutoApprovals has its own try/catch
    console.error(`[CRON] ${timestamp} - FATAL UNCAUGHT ERROR:`, fatalError.message);
    console.error(`[CRON] ${timestamp} - Stack:`, fatalError.stack);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
