import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import logRouter from './routes/logs';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/audit_db';

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase body size limit for bulk uploads (10,000 logs can be large)
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// DB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB database');
  } catch (err: any) {
    console.error('MongoDB Connection Error:', err.message);
    console.error('\n======================================================');
    console.error('COULD NOT CONNECT TO MONGODB.');
    console.error('Please configure a valid MongoDB Atlas connection string in:');
    console.error('  backend/.env');
    console.error('Example: MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/audit_db');
    console.error('======================================================\n');
    process.exit(1);
  }
};

connectDB();

// Routes
app.use('/api/logs', logRouter);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Audit log service is running' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
export default app;
