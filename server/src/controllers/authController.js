const { registerUserService, loginUserService } = require("../services/authService");

const registerUser = async (req, res) => {
    try {
        const user = await registerUserService(req.body);
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const user = await loginUserService(req.body);
        res.json(user);
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
};