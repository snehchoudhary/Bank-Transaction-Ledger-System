// const userModel = require("../models/user.model")
// const jwt = require("jsonwebtoken")
// const emailService = require("../services/email.service")
// const tokenBlackListModel = require("../models/blackList.model")

// // user register controller
// //POST /api/auth/register

// async function userRegisterController(req, res) {
//   const {email, password, name} = req.body

//   const isExists = await userModel.findOne({
//             email: email
//   })

//   if (isExists){
//     return res.status(422).json({
//         message: "user already exists with this email.",
//         status : "failed"
//     })
//   }

//   const user = await userModel.create({
//     email, password, name
//   })

//   const token = jwt.sign({userid:user._id},process.env.JWT_SECRET, {expiresIn: "3d"})

//   res.cookie("token", token)
//   res.status(201).json({
//     user: {
//         _id: user._id,
//         email:user.email,
//         name:user.name
//     },
//     token
//   })

//   await emailService.sendRegistrationEmail(user.email, user.name)
// }



// // -user login controller
// //POST/api/auth/login

// async function userLoginController(req, res) {
//     const{email, password} = req.body

//     const user = await userModel.findOne({email}).select("password")

//     if(!user) {
//         return res.status(401).json({
//             message: "Email or password is INVALID"
//         })
//     }

//     const isValidPassword = await user.comparePassword(password)
//       if(!user) {
//         return res.status(401).json({
//             message: "Email or password is INVALID"
//         })
//     }

//       const token = jwt.sign({userid:user._id},process.env.JWT_SECRET, {expiresIn: "3d"})

//   res.cookie("token", token)
//   res.status(200).json({
//     user: {
//         _id: user._id,
//         email:user.email,
//         name:user.name
//     },
//     token
//   })

// }

// //user logout controller
// //POST /api/auth/logout

// async function userLogoutController(req, res){
// const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

// if (!token){
//   return res.status(400).json({
//     message: "User logges out successfully"
//   })
// }



// await tokenBlackListModel.create({
//   token : token
// })

// res.clearCookie("token")

// res.status(200).json({
//   message: "User logged out successfully"
// })
// }
// module.exports = {userRegisterController, userLoginController, userLogoutController}


const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");
const tokenBlackListModel = require("../models/blackList.model");


// ======================================================
// REGISTER
// POST /api/auth/register
// ======================================================

async function userRegisterController(req, res) {

    try {

        const { email, password, name } = req.body;


        // Validate request
        if (!email || !password || !name) {
            return res.status(400).json({
                message: "Email, password and name are required"
            });
        }


        // Check if user already exists
        const isExists = await userModel.findOne({
            email
        });

        if (isExists) {
            return res.status(422).json({
                message: "User already exists with this email",
                status: "failed"
            });
        }


        // Create user
        const user = await userModel.create({
            email,
            password,
            name
        });


        // Generate JWT
        const token = jwt.sign(
            {
                userid: user._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "3d"
            }
        );


        // Set cookie
        res.cookie("token", token, {
            httpOnly: true
        });


        // Send registration email
        try {

            await emailService.sendRegistrationEmail(
                user.email,
                user.name
            );

        } catch (emailError) {

            console.error(
                "Registration email failed:",
                emailError.message
            );
        }


        // Response
        return res.status(201).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        });

    } catch (error) {

        console.error("REGISTER ERROR:", error);

        return res.status(500).json({
            message: "Registration failed",
            error: error.message
        });
    }
}



// ======================================================
// LOGIN
// POST /api/auth/login
// ======================================================

async function userLoginController(req, res) {

    try {

        const {
            email,
            password
        } = req.body;


        // Validate request
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }


        // Find user
        //
        // +password is important if password has select:false
        // +systemUser is important if systemUser has select:false
        //
        const user = await userModel
            .findOne({ email })
            .select("+password +systemUser");


        if (!user) {
            return res.status(401).json({
                message: "Email or password is INVALID"
            });
        }


        // Compare password
        const isValidPassword =
            await user.comparePassword(password);


        // IMPORTANT:
        // Check isValidPassword, NOT user
        //
        if (!isValidPassword) {
            return res.status(401).json({
                message: "Email or password is INVALID"
            });
        }


        // Generate JWT
        const token = jwt.sign(
            {
                userid: user._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "3d"
            }
        );


        // Set cookie
        res.cookie("token", token, {
            httpOnly: true
        });


        // Response
        return res.status(200).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        });

    } catch (error) {

        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
}



// ======================================================
// LOGOUT
// POST /api/auth/logout
// ======================================================

async function userLogoutController(req, res) {

    try {

        // Prefer Bearer token
        const token =
            req.headers.authorization?.startsWith("Bearer ")
                ? req.headers.authorization.split(" ")[1]
                : req.cookies.token;


        // No token
        if (!token) {
            return res.status(200).json({
                message: "User already logged out"
            });
        }


        // Add token to blacklist
        await tokenBlackListModel.create({
            token
        });


        // Clear cookie
        res.clearCookie("token");


        return res.status(200).json({
            message: "User logged out successfully"
        });

    } catch (error) {

        console.error("LOGOUT ERROR:", error);

        return res.status(500).json({
            message: "Logout failed",
            error: error.message
        });
    }
}



module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController
};