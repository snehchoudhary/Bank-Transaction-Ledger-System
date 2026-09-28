const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const tokenBlackListModel = require("../models/blackList.model")

async function authMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        })
    }

    const isBlackListed = await tokenBlackListModel.findOne({token})

    if(isBlackListed) {
        return res.status(401).json({
            message:  "Unauthorized access, token is invalid"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)


        console.log("DECODED TOKEN:", decoded)

        const user = await userModel.findById(decoded.userid)

          console.log("FOUND USER:", user)

         if (!user) {
            return res.status(401).json({
                message: "User not found"
            })
        }
        req.user = user
        return next()

    } catch (err) {

         console.error("AUTH ERROR:", err)

        return res.status(401).json({
           message: "Unauthorized access, token is invalid" 
        })
    }
}

async function authSystemUserMiddleware(req, res, next) {

    //  const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1]
    const token =
    req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : req.cookies.token;

    console.log("AUTH HEADER:", req.headers.authorization);
    console.log("COOKIE TOKEN:", req.cookies.token);
    console.log("TOKEN BEING VERIFIED:", token);

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        })
    }


     const isBlackListed = await tokenBlackListModel.findOne({token})

    if(isBlackListed) {
        return res.status(401).json({
            message:  "Unauthorized access, token is invalid"
        })
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await userModel.findById(decoded.userid).select("+systemUser");

        if(!user.systemUser){
            return res.status(403).json ({
              message: "Forbidden access, not a system user"
            })
        }
        req.user = user

        return next()
    }
    // catch (err) {
    //    return res.status(401).json({
    //     message: "Unauthorized access, token is invalid"
    //    })
    // }

    catch (err) {
    console.error("AUTH ERROR NAME:", err.name);
    console.error("AUTH ERROR MESSAGE:", err.message);
    console.error("JWT SECRET EXISTS:", !!process.env.JWT_SECRET);

    return res.status(401).json({
        message: "Unauthorized access, token is invalid",
        error: err.message
    });
}
}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware
}


