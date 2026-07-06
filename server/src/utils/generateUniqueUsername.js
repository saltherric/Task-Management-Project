const User = require("../models/User");

async function generateUniqueUsername(displayName) {
    const base = (displayName || "user")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 20) || "user";

    let username = base;
    let suffix = 0;

    while (await User.findOne({ username })) {
        suffix += 1;
        username = `${base}${suffix}`;
    }

    return username;
}

module.exports = generateUniqueUsername;