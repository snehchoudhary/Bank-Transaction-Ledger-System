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





const mongoose = require("mongoose");

const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function validateTransactionInput({ amount, idempotencyKey }) {
    if (
        typeof amount !== "number" ||
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        throw createError("Amount must be a valid positive number");
    }

    if (
        Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-8
    ) {
        throw createError(
            "Amount cannot have more than two decimal places"
        );
    }

    if (
        typeof idempotencyKey !== "string" ||
        !idempotencyKey.trim() ||
        idempotencyKey.trim().length > 128
    ) {
        throw createError("A valid idempotency key is required");
    }
}

function sameTransaction(existing, fromAccount, toAccount, amount) {
    return (
        existing.fromAccount.toString() === fromAccount._id.toString() &&
        existing.toAccount.toString() === toAccount._id.toString() &&
        existing.amount === amount
    );
}

async function respondToExistingTransaction(
    res,
    existing,
    fromAccount,
    toAccount,
    amount
) {
    if (!sameTransaction(existing, fromAccount, toAccount, amount)) {
        return res.status(409).json({
            message:
                "This idempotency key has already been used for another request"
        });
    }

    if (existing.status === "COMPLETED") {
        return res.status(200).json({
            message: "Transaction already completed",
            transaction: existing
        });
    }

    if (existing.status === "PENDING") {
        return res.status(202).json({
            message: "Transaction is still processing",
            transaction: existing
        });
    }

    return res.status(409).json({
        message:
            "This idempotency key belongs to a transaction that did not complete",
        transaction: existing
    });
}

async function findExistingTransaction(
    idempotencyKey,
    fromAccount,
    toAccount,
    amount
) {
    const existing = await transactionModel.findOne({ idempotencyKey });

    if (!existing) return null;

    return {
        existing,
        matches: sameTransaction(
            existing,
            fromAccount,
            toAccount,
            amount
        )
    };
}

async function executeTransfer({
    req,
    res,
    fromAccount,
    toAccount,
    amount,
    idempotencyKey,
    sendEmail = false
}) {
    if (fromAccount._id.toString() === toAccount._id.toString()) {
        throw createError(
            "Sender and receiver accounts cannot be the same"
        );
    }

    if (
        fromAccount.status !== "ACTIVE" ||
        toAccount.status !== "ACTIVE"
    ) {
        throw createError("Both accounts must be active");
    }

    if (fromAccount.currency !== toAccount.currency) {
        throw createError(
            "Transfers between different currencies are not supported"
        );
    }

    // Check whether this request has already been processed.
    const existing = await findExistingTransaction(
        idempotencyKey,
        fromAccount,
        toAccount,
        amount
    );

    if (existing) {
        if (!existing.matches) {
            return res.status(409).json({
                message:
                    "This idempotency key has already been used for another request"
            });
        }

        return respondToExistingTransaction(
            res,
            existing.existing,
            fromAccount,
            toAccount,
            amount
        );
    }

    const session = await mongoose.startSession();

    let completedTransaction;

    try {
        await session.withTransaction(async () => {
            // Lock the sender account to prevent concurrent overspending.
            const lockResult = await accountModel.updateOne(
                {
                    _id: fromAccount._id,
                    status: "ACTIVE"
                },
                {
                    $inc: { transactionVersion: 1 }
                },
                { session }
            );

            if (lockResult.matchedCount !== 1) {
                throw createError(
                    "Sender account is no longer active",
                    409
                );
            }

            // Calculate balance inside the transaction.
            const balance = await fromAccount.getBalance(session);

            if (balance < amount) {
                throw createError(
                    "Insufficient account balance",
                    400
                );
            }

            // Create transaction record.
            // ordered: true is required for multiple documents with a session.
            const [transaction] = await transactionModel.create(
                [
                    {
                        fromAccount: fromAccount._id,
                        toAccount: toAccount._id,
                        amount,
                        idempotencyKey,
                        status: "PENDING"
                    }
                ],
                {
                    session,
                    ordered: true
                }
            );

            // Create debit and credit ledger entries atomically.
            await ledgerModel.create(
                [
                    {
                        account: fromAccount._id,
                        amount,
                        transaction: transaction._id,
                        type: "DEBIT"
                    },
                    {
                        account: toAccount._id,
                        amount,
                        transaction: transaction._id,
                        type: "CREDIT"
                    }
                ],
                {
                    session,
                    ordered: true
                }
            );

            // Mark transaction completed.
            transaction.status = "COMPLETED";

            await transaction.save({ session });

            completedTransaction = transaction;
        });

        // Send email only after successful database commit.
        if (sendEmail && completedTransaction) {
            try {
                await emailService.sendTransactionEmail(
                    req.user.email,
                    req.user.name,
                    amount,
                    toAccount._id
                );
            } catch (emailError) {
                console.error(
                    "Transaction email failed:",
                    emailError.message
                );
            }
        }

        return res.status(201).json({
            message: "Transaction completed successfully",
            transaction: completedTransaction
        });

    } finally {
        await session.endSession();
    }
}

// Normal user-to-user transaction.
async function createTransaction(req, res) {
    try {
        const {
            fromAccount,
            toAccount,
            amount,
            idempotencyKey
        } = req.body;

        validateTransactionInput({
            amount,
            idempotencyKey
        });

        if (
            !mongoose.isValidObjectId(fromAccount) ||
            !mongoose.isValidObjectId(toAccount)
        ) {
            throw createError("Invalid account ID");
        }

        // Sender must belong to the authenticated user.
        const senderAccount = await accountModel.findOne({
            _id: fromAccount,
            user: req.user._id
        });

        if (!senderAccount) {
            throw createError("Sender account not found", 404);
        }

        const receiverAccount = await accountModel.findById(toAccount);

        if (!receiverAccount) {
            throw createError("Receiver account not found", 404);
        }

        return await executeTransfer({
            req,
            res,
            fromAccount: senderAccount,
            toAccount: receiverAccount,
            amount,
            idempotencyKey: idempotencyKey.trim(),
            sendEmail: true
        });

    } catch (error) {
        // Handle concurrent duplicate idempotency requests.
        if (error.code === 11000) {
            try {
                const {
                    fromAccount,
                    toAccount,
                    amount,
                    idempotencyKey
                } = req.body;

                const sender = await accountModel.findOne({
                    _id: fromAccount,
                    user: req.user._id
                });

                const receiver = await accountModel.findById(toAccount);

                if (sender && receiver) {
                    const existing = await findExistingTransaction(
                        idempotencyKey.trim(),
                        sender,
                        receiver,
                        amount
                    );

                    if (existing) {
                        if (!existing.matches) {
                            return res.status(409).json({
                                message:
                                    "This idempotency key has already been used for another request"
                            });
                        }

                        return respondToExistingTransaction(
                            res,
                            existing.existing,
                            sender,
                            receiver,
                            amount
                        );
                    }
                }
            } catch (replayError) {
                console.error(
                    "Idempotency check failed:",
                    replayError.message
                );
            }

            return res.status(409).json({
                message: "Duplicate transaction request"
            });
        }

        console.error("Create transaction error:", error);

        return res.status(error.statusCode || 500).json({
            message: error.statusCode
                ? error.message
                : "Unable to process transaction"
        });
    }
}

// System user transfers initial funds to a customer account.
async function createInitialFundsTransaction(req, res) {
    try {
        const {
            toAccount,
            amount,
            idempotencyKey
        } = req.body;

        validateTransactionInput({
            amount,
            idempotencyKey
        });

        if (!mongoose.isValidObjectId(toAccount)) {
            throw createError("Invalid receiver account ID");
        }

        if (!req.user.systemUser) {
            throw createError(
                "System user privileges required",
                403
            );
        }

        const receiverAccount = await accountModel.findById(toAccount);

        if (!receiverAccount) {
            throw createError("Receiver account not found", 404);
        }

        // Find active account belonging to the system user.
        const systemAccount = await accountModel.findOne({
            user: req.user._id,
            status: "ACTIVE"
        }).sort({
            createdAt: 1,
            _id: 1
        });

        if (!systemAccount) {
            throw createError(
                "System funding account not found",
                404
            );
        }

        return await executeTransfer({
            req,
            res,
            fromAccount: systemAccount,
            toAccount: receiverAccount,
            amount,
            idempotencyKey: idempotencyKey.trim(),
            sendEmail: false
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Duplicate transaction request"
            });
        }

        console.error("Initial funds transaction error:", error);

        return res.status(error.statusCode || 500).json({
            message: error.statusCode
                ? error.message
                : "Unable to process initial funds transaction"
        });
    }
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
};
