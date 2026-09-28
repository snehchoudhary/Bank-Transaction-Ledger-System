// const transactionModel = require("../models/transaction.model")
// const ledgerModel = require("../models/ledger.model")
// const accountModel = require("../models/account.model")
// const emailService = require("../services/email.service")
// const mongoose = require("mongoose")

// // create new transaction 
// //steps:
// //1. validate rqst
// //2. validate idempotency key
// //3. check account status
// //4. derive sender balance from ledger
// //create transaction (PENDING)
// //6. create DEBIT ledger entry
// //7. create CREDIT ledger entry
// //8. mark transaction COMPLETED
// //9. commit mongoDB session
// //10. send email notification

// async function createTransaction(req, res) {

//     //step 1
//     const {fromAccount, toAccount, amount, idempotencyKey} = req.body


// if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
//      return res.status(400).json ({
//         message: "FromAccount, toAccount, amount and idempotencyKey are required"
//      })
// }

// const fromUserAccount = await accountModel.findOne({
//     _id: fromAccount,
// })

// const toUserAccount = await accountModel.findOne({
//     _id: toAccount,
// })

// if (!fromUserAccount || !toUserAccount) {
//     return res.status(400).json({
//         message: "Invalid fromAccount or toAccount"
//     })
// }


// // step 2

// const isTransactionAlreadyExists = await transactionModel.findOne({
//     idempotencyKey: idempotencyKey 
// })
// if (isTransactionAlreadyExists){
//     if(isTransactionAlreadyExists.status === "COMPLETED"){
//         return res.status(200).json({
//             message: "Transaction already processed",
//             transaction: isTransactionAlreadyExists
//         })
//     }

//     if (isTransactionAlreadyExists.status === "PENDING"){
//         return res.status(200).json({
//             message: "Transaction is still processing",
//         })
//     }

//     if(isTransactionAlreadyExists.status === "FAILED") {
//         return res.status(500).json ({
//             message: "Transaction processing failed, please retry"
//         })
//     }
//     if (isTransactionAlreadyExists.status === "REVERSED"){
//         return res.status(500).json({
//             message: "Transaction was reversed, please retry"
//         })
//     }
    
// }

// //step 3

// if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE"){
//   return res.status(400).json ({
//     message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
//   })
// }

// //step 4:
// const balance = await fromUserAccount.getBalance()

// if (balance < amount) {
//     return res.status(400).json({
//         message: `Insufficient balance.Current balance is ${balance}. Requested amount is ${amount}.`
//     })
// }

// try{


// // step 5
// const session =await mongoose.statrtSession()
// session.startTransaction()

// const transaction = (await transactionModel({
//     fromAccount,
//     toAccount,
//     amount,
//     idempotencyKey,
//     status: "PENDING"
// }))[0]

// const debitLedgerEntry = await ledgerModel.create([{
//     account: fromAccount,
//     amount: amount,
//     transaction: transaction._id,
//     type: "DEBIT"
// }], {session})

// const creditLedgerEntry = await ledgerModel.create([{
//     account: toAccount,
//     amount: amount,
//     transaction: transaction._id,
//     type: "CREDIT"
// }], {session})

// transaction.status = "COMPLETED"
// await transaction.save({session})

// await session.commitTransaction()
// session.endSession()

// //step 10
// await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)

// return res.status(201).json({
//     message: "Transaction completed successfully",
//     transaction: transaction
// })
// }

// async function createInitialFundsTransaction(req, res) {
//     const {toAccount, amount, idempotencyKey} = req.body

//     if(!toAccount || !amount || !idempotencyKey) {
//         return res.status(400).json({
//             mesage: "toAccount, amount and idempotencykey are required"
//         })
//     }

//     const toUserAccount = await accountModel.findOne({
//         _id: toAccount,
//         status: "ACTIVE"
//     })

//     if (!toUserAccount) {
//         return res.status(400).json({
//             message: "Invalid toAccount"
//         })
//     }

//     const fromUserAccount = await accountModel.findOne({
//         // systemUser: true,
//         user: req.user._id,
//         status: "ACTIVE"
//     })

//     if (!fromUserAccount) {
//         return res.status(400).json({
//             message: "System user account not found"
//         })
//     }

//     const session = await mongoose.startSession()
//     session.startTransaction()

//     const transaction = await transactionModel.create({
//         fromAccount: fromUserAccount._id,
//         toAccount,
//         amount,
//         idempotencyKey,
//         status: "PENDING"
//     }, {session})

//     const debitLedgerEntry =await ledgerModel.create({
//         account: fromUserAccount._id,
//         amount: amount,
//         transaction: transaction._id,
//         type: "DEBIT"
//     }, {session})

//     await (() => {
//         return new Promise((resolve) => setTimeout(resolve, 100 * 1000))
//     })

//      const creditLedgerEntry =await ledgerModel.create({
//         account: toAccount,
//         amount: amount,
//         transaction: transaction._id,
//         type: "CREDIT"
//     }, {session})

//     // transaction.status = "COMPLETED"
//     // await transaction.save({session})

//     await transactionModel.findOneAndUpdate(
//         {
//         _id: transaction._id},
//         {status: "COMPLETED"},
//          {session})

//     await session.commitTransaction()
//     session.endSession()
//         }

//         catch(error){
//             return res.status(400).json({
//                 message: "transaction is Pending due to some issue, please retry after sometime."
//             })
//         }

//         //step 10 - send email notification
//         await emailService.sendTransactionEmail(req.user.email,req.user.name )
//     return res.status(201).json({
//         message: "Initial funds transaction completed successfully.",
//         transaction: transaction
//     })
// }
// module.exports = {
//     createTransaction,
//     createInitialFundsTransaction
// }



const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");


// ======================================================
// CREATE NORMAL TRANSACTION
// POST /api/transactions
// ======================================================

async function createTransaction(req, res) {

    let session;

    try {

        // ==================================================
        // STEP 1: Validate request
        // ==================================================

        const {
            fromAccount,
            toAccount,
            amount,
            idempotencyKey
        } = req.body;

        if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
            return res.status(400).json({
                message: "fromAccount, toAccount, amount and idempotencyKey are required"
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than 0"
            });
        }


        // ==================================================
        // STEP 2: Validate account IDs
        // ==================================================

        if (
            !mongoose.Types.ObjectId.isValid(fromAccount) ||
            !mongoose.Types.ObjectId.isValid(toAccount)
        ) {
            return res.status(400).json({
                message: "Invalid account ID"
            });
        }


        // ==================================================
        // STEP 3: Find sender account
        // IMPORTANT:
        // Sender must belong to logged-in user
        // ==================================================

        const fromUserAccount = await accountModel.findOne({
            _id: fromAccount,
            user: req.user._id
        });

        if (!fromUserAccount) {
            return res.status(404).json({
                message: "From account not found or does not belong to you"
            });
        }


        // ==================================================
        // STEP 4: Find receiver account
        // ==================================================

        const toUserAccount = await accountModel.findOne({
            _id: toAccount
        });

        if (!toUserAccount) {
            return res.status(404).json({
                message: "To account not found"
            });
        }


        // ==================================================
        // STEP 5: Check account status
        // ==================================================

        if (
            fromUserAccount.status !== "ACTIVE" ||
            toUserAccount.status !== "ACTIVE"
        ) {
            return res.status(400).json({
                message: "Both accounts must be ACTIVE"
            });
        }


        // ==================================================
        // STEP 6: Check idempotency
        // ==================================================

        const existingTransaction =
            await transactionModel.findOne({
                idempotencyKey
            });

        if (existingTransaction) {

            if (existingTransaction.status === "COMPLETED") {
                return res.status(200).json({
                    message: "Transaction already processed",
                    transaction: existingTransaction
                });
            }

            if (existingTransaction.status === "PENDING") {
                return res.status(200).json({
                    message: "Transaction is still processing"
                });
            }

            if (existingTransaction.status === "FAILED") {
                return res.status(500).json({
                    message: "Previous transaction failed. Please use a new idempotencyKey."
                });
            }

            if (existingTransaction.status === "REVERSED") {
                return res.status(500).json({
                    message: "Transaction was reversed. Please use a new idempotencyKey."
                });
            }
        }


        // ==================================================
        // STEP 7: Check sender balance
        // ==================================================

        const balance = await fromUserAccount.getBalance();

        if (balance < amount) {
            return res.status(400).json({
                message:
                    `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}.`
            });
        }


        // ==================================================
        // STEP 8: Start MongoDB transaction
        // ==================================================

        session = await mongoose.startSession();

        session.startTransaction();


        // ==================================================
        // STEP 9: Create transaction with PENDING status
        // ==================================================

        const transaction = new transactionModel({
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        });

        await transaction.save({ session });


        // ==================================================
        // STEP 10: Create DEBIT ledger entry
        // ==================================================

        await ledgerModel.create(
            [{
                account: fromAccount,
                amount,
                transaction: transaction._id,
                type: "DEBIT"
            }],
            { session }
        );


        // ==================================================
        // STEP 11: Create CREDIT ledger entry
        // ==================================================

        await ledgerModel.create(
            [{
                account: toAccount,
                amount,
                transaction: transaction._id,
                type: "CREDIT"
            }],
            { session }
        );


        // ==================================================
        // STEP 12: Mark transaction COMPLETED
        // ==================================================

        transaction.status = "COMPLETED";

        await transaction.save({ session });


        // ==================================================
        // STEP 13: Commit MongoDB transaction
        // ==================================================

        await session.commitTransaction();


        // ==================================================
        // STEP 14: Send email AFTER successful commit
        // ==================================================

        try {

            await emailService.sendTransactionEmail(
                req.user.email,
                req.user.name,
                amount,
                toAccount
            );

        } catch (emailError) {

            console.error(
                "Transaction completed but email failed:",
                emailError.message
            );
        }


        // ==================================================
        // STEP 15: Response
        // ==================================================

        return res.status(201).json({
            message: "Transaction completed successfully",
            transaction
        });

    } catch (error) {

        console.error("CREATE TRANSACTION ERROR:", error);


        // Abort transaction if it was started
        if (session) {

            try {
                await session.abortTransaction();
            } catch (abortError) {
                console.error(
                    "Error aborting transaction:",
                    abortError.message
                );
            }
        }


        return res.status(500).json({
            message: "Transaction failed",
            error: error.message
        });

    } finally {

        if (session) {
            await session.endSession();
        }
    }
}



// ======================================================
// CREATE INITIAL FUNDS TRANSACTION
// POST /api/transactions/system/initial-funds
// ======================================================

async function createInitialFundsTransaction(req, res) {

    let session;

    try {

        // ==================================================
        // STEP 1: Validate request
        // ==================================================

        const {
            toAccount,
            amount,
            idempotencyKey
        } = req.body;

        if (!toAccount || !amount || !idempotencyKey) {
            return res.status(400).json({
                message: "toAccount, amount and idempotencyKey are required"
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than 0"
            });
        }


        // ==================================================
        // STEP 2: Validate account ID
        // ==================================================

        if (!mongoose.Types.ObjectId.isValid(toAccount)) {
            return res.status(400).json({
                message: "Invalid toAccount"
            });
        }


        // ==================================================
        // STEP 3: Check idempotency
        // ==================================================

        const existingTransaction =
            await transactionModel.findOne({
                idempotencyKey
            });

        if (existingTransaction) {

            if (existingTransaction.status === "COMPLETED") {
                return res.status(200).json({
                    message: "Initial funds already processed",
                    transaction: existingTransaction
                });
            }

            if (existingTransaction.status === "PENDING") {
                return res.status(200).json({
                    message: "Initial funds transaction is still processing"
                });
            }

            return res.status(400).json({
                message: "This idempotency key was already used. Please use a new one."
            });
        }


        // ==================================================
        // STEP 4: Find destination account
        // ==================================================

        const toUserAccount = await accountModel.findOne({
            _id: toAccount,
            status: "ACTIVE"
        });

        if (!toUserAccount) {
            return res.status(404).json({
                message: "Destination account not found or inactive"
            });
        }


        // ==================================================
        // STEP 5: Verify current user is a system user
        //
        // authSystemUserMiddleware should already do this,
        // but keeping this check makes the controller safer.
        // ==================================================

        if (!req.user.systemUser) {
            return res.status(403).json({
                message: "Only a system user can add initial funds"
            });
        }


        // ==================================================
        // STEP 6: Find SYSTEM USER'S account
        //
        // systemUser belongs to USER MODEL, not ACCOUNT MODEL.
        // ==================================================

        const fromUserAccount = await accountModel.findOne({
            user: req.user._id,
            status: "ACTIVE"
        });

        if (!fromUserAccount) {
            return res.status(404).json({
                message: "System user account not found"
            });
        }


        // ==================================================
        // STEP 7: Start MongoDB transaction
        // ==================================================

        session = await mongoose.startSession();

        session.startTransaction();


        // ==================================================
        // STEP 8: Create transaction
        // ==================================================

        const transaction = new transactionModel({
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        });

        await transaction.save({ session });


        // ==================================================
        // STEP 9: DEBIT system account
        // ==================================================

        await ledgerModel.create(
            [{
                account: fromUserAccount._id,
                amount,
                transaction: transaction._id,
                type: "DEBIT"
            }],
            { session }
        );


        // ==================================================
        // STEP 10: CREDIT user's account
        // ==================================================

        await ledgerModel.create(
            [{
                account: toAccount,
                amount,
                transaction: transaction._id,
                type: "CREDIT"
            }],
            { session }
        );


        // ==================================================
        // STEP 11: Mark transaction COMPLETED
        // ==================================================

        transaction.status = "COMPLETED";

        await transaction.save({ session });


        // ==================================================
        // STEP 12: Commit transaction
        // ==================================================

        await session.commitTransaction();


        // ==================================================
        // STEP 13: Response
        // ==================================================

        return res.status(201).json({
            message: "Initial funds transaction completed successfully",
            transaction
        });

    } catch (error) {

        console.error(
            "INITIAL FUNDS TRANSACTION ERROR:",
            error
        );


        // Abort transaction
        if (session) {

            try {
                await session.abortTransaction();
            } catch (abortError) {
                console.error(
                    "Error aborting transaction:",
                    abortError.message
                );
            }
        }


        return res.status(500).json({
            message: "Initial funds transaction failed",
            error: error.message
        });

    } finally {

        if (session) {
            await session.endSession();
        }
    }
}



// ======================================================
// EXPORT CONTROLLERS
// ======================================================

module.exports = {
    createTransaction,
    createInitialFundsTransaction
};