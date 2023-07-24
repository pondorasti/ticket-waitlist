require('dotenv').config();

import cron from 'node-cron';
import express, { Request, Response } from 'express';
import * as sevenrooms from './sevenrooms';
import * as amc from './amc';

cron.schedule(`*/1 * * * *`, async () => {
  await sevenrooms.check();
});

cron.schedule(`*/1 * * * *`, async () => {
  await amc.check();
});

const app = express();
const port = process.env.PORT || 3333;

app.get('/sevenrooms', async (req: Request, res: Response) => {
  const status = sevenrooms.getStatusMessage();
  res.send(status);
});

app.get('/amc', async (req: Request, res: Response) => {
  const status = amc.getStatusMessage();
  res.send(status);
});

app.listen(port, async () => {
  console.log('Server is running on port', port);
});
