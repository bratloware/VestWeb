import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import router from './src/routes/index.js';
import sequelize from './src/db/index.js';
import { validateJwtConfig } from './src/services/jwtService.js';
import './src/db/models/index.js'; // registra todos os models e associations

validateJwtConfig();

const app = express();

app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

const parseAllowedOrigins = (value) => String(value || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsAllowedOrigins = parseAllowedOrigins(
  process.env.CORS_ALLOWED_ORIGINS || process.env.CLIENT_URL,
);

if (corsAllowedOrigins.length === 0) {
  throw new Error('Missing CORS configuration. Define CORS_ALLOWED_ORIGINS or CLIENT_URL.');
}

const corsOptions = {
  origin: (origin, callback) => {
    // Requests sem header Origin (CLI, health checks, etc.) seguem permitidos.
    if (!origin) return callback(null, true);
    return callback(null, corsAllowedOrigins.includes(origin));
  },
  credentials: true,
};

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: isProduction,
}));

app.use(cors(corsOptions));
app.use(cookieParser());

// Stripe webhook precisa do body raw - deve vir ANTES do express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', router);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = Number.isInteger(err?.status) ? err.status : 500;
  const message = status >= 500 ? 'Internal server error' : (err.message || 'Request error');
  res.status(status).json({ message });
});

sequelize.authenticate()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`VestWeb server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Erro ao conectar ao banco de dados:', err);
    process.exit(1);
  });

export default app;
