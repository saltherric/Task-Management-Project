const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authenticateSocket(socket, next) {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Unauthorized"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user || !user.isActive) {
      return next(new Error("Unauthorized"));
    }

    socket.user = user;
    return next();
  } catch (error) {
    return next(new Error("Unauthorized"));
  }
}

module.exports = { authenticateSocket };