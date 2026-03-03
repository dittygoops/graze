import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getRestaurants } from './controllers/restaurantController';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/restaurants', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const long = parseFloat(req.query.long as string);
    const radius = parseInt(req.query.radius as string) || 1500;

    if (isNaN(lat) || isNaN(long)) {
      res.status(400).json({ error: 'Missing required parameters: lat and long' });
      return;
    }

    const result = await getRestaurants(lat, long, radius);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy' });
});

const PORT = 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
