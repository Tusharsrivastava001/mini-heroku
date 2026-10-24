process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://deployforge:deployforge_secret@localhost:5432/deployforge?schema=public';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test_jwt_secret_must_be_at_least_32_characters_long!';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
