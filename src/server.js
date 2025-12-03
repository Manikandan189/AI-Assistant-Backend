import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/config.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import directoryRoutes from './routes/directoryRoutes.js';

const app = express();

// Middleware
app.use(cors(config.cors));
app.use(express.json({ limit: '5gb' })); // Increased to 5GB
app.use(express.urlencoded({ extended: true, limit: '5gb' })); // Increased to 5GB
app.use(morgan('dev'));

// Routes
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'AI Virtual Assistant API',
        version: '1.0.0',
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/directory', directoryRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
    try {
        // Database is initialized via Prisma (npx prisma db push)

        // Start server
        app.listen(config.port, () => {
            console.log(`
   🚀 AI Virtual Assistant API Server                
   Environment: ${config.env.padEnd(36)}
   Port: ${config.port.toString().padEnd(42)}
   URL: http://localhost:${config.port.toString().padEnd(30)}
      `);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
