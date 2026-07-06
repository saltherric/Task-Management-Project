// const passport = require("passport");
// const GoogleStrategy = require("passport-google-oauth20").Strategy;
// const User = require("../models/User");
// const generateUniqueUsername = require("../utils/generateUniqueUsername");

// passport.use(
//     new GoogleStrategy(
//         {
//             clientID: process.env.GOOGLE_CLIENT_ID,
//             clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//             callbackURL: process.env.GOOGLE_CALLBACK_URL,
//         },
//         async (accessToken, refreshToken, profile, done) => {
//             try {
//                 // 1. Check if this Google account is already linked to a user
//                 let user = await User.findOne({
//                     "authProviders.provider": "google",
//                     "authProviders.providerId": profile.id,
//                 });

//                 if (user) {
//                     return done(null, user);
//                 }

//                 // 2. Check if a user already exists with this email (local or other provider)
//                 const email = profile.emails?.[0]?.value?.toLowerCase();

//                 if (email) {
//                     user = await User.findOne({ email });

//                     if (user) {
//                         // Link Google to the existing account
//                         user.authProviders.push({
//                             provider: "google",
//                             providerId: profile.id,
//                         });
//                         if (!user.emailVerified) user.emailVerified = true; // Google already verified it
//                         await user.save();
//                         return done(null, user);
//                     }
//                 }

//                 // 3. No existing user — create a new one
//                 const username = await generateUniqueUsername(profile.displayName);

//                 user = await User.create({
//                     username,
//                     email: email || undefined, // avoid saving "undefined" string
//                     emailVerified: !!email,
//                     avatar: profile.photos?.[0]?.value || null,
//                     authProviders: [
//                         {
//                             provider: "google",
//                             providerId: profile.id,
//                         },
//                     ],
//                 });

//                 return done(null, user);
//             } catch (err) {
//                 return done(err, null);
//             }
//         }
//     )
// );

// module.exports = passport;