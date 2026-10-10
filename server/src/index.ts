import app from './app';

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`🚀 Otomos server running on http://localhost:${port}`);
});