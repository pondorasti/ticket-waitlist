import cron from 'node-cron';
import express, { Request, Response } from 'express';
import * as sevenrooms from './platforms/sevenrooms';
import * as amc from './platforms/amc';
import * as gametime from './platforms/gametime';
import * as seatgeek from './platforms/seatgeek';
import env from './env';

const activeChecker = amc;

if (env.NODE_ENV === 'production') {
  cron.schedule(`*/1 * * * *`, async () => {
    await activeChecker.check();
  });
} else {
  activeChecker.check();
}

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

app.get('/gametime', async (req: Request, res: Response) => {
  const status = gametime.getStatusMessage();
  res.send(status);
});

app.get('/seatgeek', async (req: Request, res: Response) => {
  const status = seatgeek.getStatusMessage();
  res.send(status);
});

app.get('/', (req: Request, res: Response) => {
  res.send('OK');
});

if (env.NODE_ENV === 'production') {
  app.listen(port, async () => {
    console.log('Server is running on port', port);
  });
}
