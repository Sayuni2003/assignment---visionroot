import { config } from './config/env.js';
import { connectDatabase } from './config/database.js';
import app from './app.js';

async function start() {
  try {
    await connectDatabase();

    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port} (NODE_ENV=${config.nodeEnv ?? 'unset'})`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
