const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
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
                message: error.message,
            });
        }
    }
    
    if (!token) {
        res.status(401);
        throw new Error("Not authorized");
    }

};

module.exports = { authMiddleware };