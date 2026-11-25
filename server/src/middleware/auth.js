const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Please log in to continue.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select('_id name email');
    if (!user) return res.status(401).json({ message: 'Account not found. Please log in again.' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Session expired or invalid. Please log in again.' });
  }
}
module.exports = auth;
