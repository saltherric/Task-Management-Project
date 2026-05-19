const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    // Check authorization header
    if ( 
        req.headers.authorization && 
        req.headers.authorization.startsWith("Bearer")
    ) 
    {
        try {
            // get token from header
            token = req.headers.authorization.split(" ")[1];

            // verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // get user from database
            req.user = await User.findById(
                decoded.id
            ).select("-password");
            next();
        } catch (error) {
            res.status(401).json({
                message: "Not authorized"
            });
        }
    }
};

module.exports = { protect };



// Frontend Login
//     ↓
// JWT Token
//     ↓
// Frontend stores token
//     ↓
// Send token in Authorization header
//     ↓
// Backend middleware verifies token
//     ↓
// req.user created
//     ↓
// Controllers use req.user.id