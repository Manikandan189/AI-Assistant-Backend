import dotenv from 'dotenv';
dotenv.config();

/**
 * Application Configuration
 */
export const config = {
    // Server Config
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,

    // Database Config
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        name: process.env.DB_NAME || 'ai_assistant',
        user: process.env.DB_USER || 'postgres',
        password: String(process.env.DB_PASSWORD || 'postgres'),
    },

    // Authentication Config
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },

    // CORS Config
    cors: {
        origin: (origin, callback) => {
            const allowedOrigins = [
                'http://localhost:3000',
                'http://localhost:3001',
                process.env.FRONTEND_URL
            ].filter(Boolean);

            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Content-Range', 'X-Content-Range'],
    },

    // File Upload Config
    upload: {
        uploadDir: process.env.UPLOAD_DIR || './uploads',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5368709120, // 5GB default
    },

    // AI Config
    ai: {
        apiKey: process.env.GEMINI_API_KEY || '',
        defaultModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    },
};
