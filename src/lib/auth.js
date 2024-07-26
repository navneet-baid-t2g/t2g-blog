// lib/auth.js
export const apiKeyAuthMiddleware = (handler) => async (req, res) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  return handler(req, res);
};
