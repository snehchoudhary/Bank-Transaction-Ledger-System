// const accountModel = require("../models/account.model");


// async function createAccountController(req, res) {
//     const user = req.user;

//     const account = await accountModel.create({
//         user: user._id
//     })

//     res.status(201).json({
//         account
//     })
// }

// async function getUserAccountController(req, res) {
//     const accounts= await accountModel.find({user: req.user._id});

//     res.status(200).json({
//         accounts
//     })
// }

// async function getAccountBalanceController(req, res) {
//     const{accountId} = req.params;

//     const account = await accountModel.findOne({
//         _id: accountId,
//         user: req.user._id
//     })

//     if (!account) {
//         return res.status(404).json({
//             message: "Account not found"
//         })
//     }

//     const balance = await account.getBalance();

//     res.status(200).json({
//         accountId: account._id,
//         balance: balance
//     })
// }

// module.exports = {
//     createAccountController,
//     getUserAccountController,
//     getAccountBalanceController
// }



const mongoose = require("mongoose");
const accountModel = require("../models/account.model");

// Create a new account
async function createAccountController(req, res) {
    try {
        const account = await accountModel.create({
            user: req.user._id
        });

        return res.status(201).json({
            message: "Account created successfully",
            account
        });

    } catch (error) {
        console.error("Create account error:", error.message);

        return res.status(500).json({
            message: "Unable to create account"
        });
    }
}

// Get all accounts belonging to the logged-in user
async function getUserAccountController(req, res) {
    try {
        const accounts = await accountModel.find({
            user: req.user._id
        });

        return res.status(200).json({
            count: accounts.length,
            accounts
        });

    } catch (error) {
        console.error("Get accounts error:", error.message);

        return res.status(500).json({
            message: "Unable to fetch accounts"
        });
    }
}

// Get balance of a particular account
async function getAccountBalanceController(req, res) {
    try {
        const { accountId } = req.params;

        // Validate MongoDB ObjectId
        if (!mongoose.isValidObjectId(accountId)) {
            return res.status(400).json({
                message: "Invalid account ID"
            });
        }

        // Verify that the account belongs to the logged-in user
        const account = await accountModel.findOne({
            _id: accountId,
            user: req.user._id
        });

        if (!account) {
            return res.status(404).json({
                message: "Account not found"
            });
        }

        const balance = await account.getBalance();

        return res.status(200).json({
            accountId: account._id,
            currency: account.currency,
            balance
        });

    } catch (error) {
        console.error("Get account balance error:", error.message);

        return res.status(500).json({
            message: "Unable to fetch account balance"
        });
    }
}

module.exports = {
    createAccountController,
    getUserAccountController,
    getAccountBalanceController
};
