export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'default-secret-key-change-in-production',
  accessExpiry: process.env.JWT_ACCESS_EXPIRY || '365d',
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '365d',
};
