import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

import routes from './routes/index.js';
import { middleware, connection } from './services/socket.service.js';
import environments from './utils/environments.js';

const { PORT } = environments;

const main = () => {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  app.get('/', (req, res) => {
    res.send('OK');
  });

  app.use('/api', routes);

  const server = createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });

  io.use(middleware).on('connection', connection);
  global._io = io;

  server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
};

main();
