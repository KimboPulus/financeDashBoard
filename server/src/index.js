import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { router } from './routes.js';

const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());
app.use('/api', router);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

app.listen(config.port, () => {
  console.log(`Pocket Ledger API is running on http://localhost:${config.port}`);
});
