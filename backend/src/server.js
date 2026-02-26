import app from './app.js';

const PORT = process.env.PORT || 3000;

// -- API --

/**
 * Health check endpoint.
 * Returns a simple welcome message to confirm the server is reachable.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
app.get('/', (req, res) => {
  res.send('Welcome to the server LMS Informatika API');
});

/**
 * Starts the Express server on the specified port.
 */
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
