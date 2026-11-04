// const userModel = require("../models/user.model")
// const jwt = require("jsonwebtoken")
// const tokenBlackListModel = require("../models/blackList.model")

// async function authMiddleware(req, res, next) {
//     const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

//     if (!token) {
//         return res.status(401).json({
//             message: "Unauthorized access, token is missing"
//         })
//     }

//     const isBlackListed = await tokenBlackListModel.findOne({token})

//     if(isBlackListed) {
//         return res.status(401).json({
//             message:  "Unauthorized access, token is invalid"
//         })
//     }

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET)


//         console.log("DECODED TOKEN:", decoded)

//         const user = await userModel.findById(decoded.userid)

//           console.log("FOUND USER:", user)

//          if (!user) {
//             return res.status(401).json({
//                 message: "User not found"
//             })
//         }
//         req.user = user
//         return next()

//     } catch (err) {

//          console.error("AUTH ERROR:", err)

//         return res.status(401).json({
//            message: "Unauthorized access, token is invalid" 
//         })
//     }
// }

// async function authSystemUserMiddleware(req, res, next) {

//     //  const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1]
//     const token =
//     req.headers.authorization?.startsWith("Bearer ")
//         ? req.headers.authorization.split(" ")[1]
//         : req.cookies.token;

//     console.log("AUTH HEADER:", req.headers.authorization);
//     console.log("COOKIE TOKEN:", req.cookies.token);
//     console.log("TOKEN BEING VERIFIED:", token);

//     if (!token) {
//         return res.status(401).json({
//             message: "Unauthorized access, token is missing"
//         })
//     }


//      const isBlackListed = await tokenBlackListModel.findOne({token})

//     if(isBlackListed) {
//         return res.status(401).json({
//             message:  "Unauthorized access, token is invalid"
//         })
//     }
    
//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET)

//         const user = await userModel.findById(decoded.userid).select("+systemUser");

//         if(!user.systemUser){
//             return res.status(403).json ({
//               message: "Forbidden access, not a system user"
//             })
//         }
//         req.user = user

//         return next()
//     }
//     // catch (err) {
//     //    return res.status(401).json({
//     //     message: "Unauthorized access, token is invalid"
//     //    })
//     // }

//     catch (err) {
//     console.error("AUTH ERROR NAME:", err.name);
//     console.error("AUTH ERROR MESSAGE:", err.message);
//     console.error("JWT SECRET EXISTS:", !!process.env.JWT_SECRET);

//     return res.status(401).json({
//         message: "Unauthorized access, token is invalid",
//         error: err.message
//     });
// }
// }

// module.exports = {
//     authMiddleware,
//     authSystemUserMiddleware
// }





const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const tokenBlackListModel = require("../models/blackList.model");

// Extract token from Authorization header or cookie
function getToken(req) {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const parts = authHeader.trim().split(/\s+/);

        if (
            parts.length === 2 &&
            parts[0].toLowerCase() === "bearer" &&
            parts[1]
        ) {
            return parts[1];
        }
    }

    return req.cookies?.token || null;
}

// Verify JWT
function verifyToken(token) {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }

    return jwt.verify(token, process.env.JWT_SECRET);
}

// Normal authenticated user middleware
async function authMiddleware(req, res, next) {
    try {
        const token = getToken(req);

        if (!token) {
            return res.status(401).json({
                message: "Authentication token missing"
            });
        }

        const blacklistedToken = await tokenBlackListModel.findOne({ token });

        if (blacklistedToken) {
            return res.status(401).json({
                message: "Token has been logged out"
            });
        }

        let decoded;

        try {
            decoded = verifyToken(token);
        } catch (error) {
            return res.status(401).json({
                message: "Invalid or expired token"
            });
        }

        const user = await userModel.findById(decoded.userid);

        if (!user) {
            return res.status(401).json({
                message: "User no longer exists"
            });
        }

        req.user = user;
        next();

    } catch (error) {
        console.error("Authentication middleware error:", error.message);

        return res.status(500).json({
            message: "Authentication service error"
        });
    }
}

// System user authentication middleware
async function authSystemUserMiddleware(req, res, next) {
    try {
        const token = getToken(req);

        if (!token) {
            return res.status(401).json({
                message: "Authentication token missing"
            });
        }

        const blacklistedToken = await tokenBlackListModel.findOne({ token });

        if (blacklistedToken) {
            return res.status(401).json({
                message: "Token has been logged out"
            });
        }

        let decoded;

        try {
            decoded = verifyToken(token);
        } catch (error) {
            return res.status(401).json({
                message: "Invalid or expired token"
            });
        }

        const user = await userModel
            .findById(decoded.userid)
            .select("+systemUser");

        if (!user) {
            return res.status(401).json({
                message: "User no longer exists"
            });
        }

        if (!user.systemUser) {
            return res.status(403).json({
                message: "Access denied. System user privileges required."
            });
        }

        req.user = user;
        next();

    } catch (error) {
        console.error("System authentication error:", error.message);

        return res.status(500).json({
            message: "Authentication service error"
        });
    }
}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware
};
