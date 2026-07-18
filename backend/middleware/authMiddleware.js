const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {

    try {

        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {

            token = req.headers.authorization.split(" ")[1];

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            const user = await User.findById(decoded.id).select("-password");
            if (!user) {
                return res.status(401).json({
                    message: "User not found"
                });
            }

            if (decoded.tokenVersion !== undefined && decoded.tokenVersion < user.tokenVersion) {
                return res.status(401).json({
                    message: "Session Expired. Please login again."
                });
            }

            req.user = user;
            next();

        } else {

            return res.status(401).json({
                message: "Not Authorized"
            });

        }

    } catch (error) {

        return res.status(401).json({
            message: "Token Failed"
        });

    }

};

module.exports = protect;