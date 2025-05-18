// pages/api/get-ip.js
export default function handler(req, res) {
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.socket?.remoteAddress ||
      'unknown';
    res.status(200).json({ ip });
  }