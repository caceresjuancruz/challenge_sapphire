import { createApp } from './app.js';
import { TYPES } from './config/types.js';
import { ILoggerService } from './services/logger/logger.service.interface.js';

const PORT = process.env.PORT ?? 3000;

const { app, container } = createApp();
const logger = container.get<ILoggerService>(TYPES.LoggerService);

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`API docs: http://localhost:${PORT}/api-docs`);
});
