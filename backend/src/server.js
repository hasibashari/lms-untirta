import app from './app.js';

const PORT = process.env.PORT || 3000;

// -- API --
app.get('/', (req, res) => {
  res.send('Welcome to the server LMS Informatika API');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
