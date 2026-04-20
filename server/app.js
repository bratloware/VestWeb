import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import router from './src/routes/index.js';
import sequelize from './src/db/index.js';
import './src/db/models/index.js'; // registra todos os models e associations

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
}));

// Stripe webhook precisa do body raw — deve vir ANTES do express.json()
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
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ message, error: process.env.NODE_ENV === 'development' ? err.stack : undefined });
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
