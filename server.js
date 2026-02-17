import express from 'express';
import { ENV } from './lib/env.js';
const app = express();
const PORT = ENV.PORT || 3000;

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the TalentIQ Backend!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});