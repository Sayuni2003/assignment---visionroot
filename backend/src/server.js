import 'dotenv/config';

import app from './app.js';
import { connectDatabase } from './config/database.js';

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Without an explicit origin the cors package falls back to "*", which breaks cookie auth.
    if (!process.env.CLIENT_ORIGIN) {
      throw new Error('CLIENT_ORIGIN is not defined. Add it to backend/.env (see .env.example).');
    }

    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
