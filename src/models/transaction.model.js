// const mongoose = require("mongoose")

// const transactionSchema = new mongoose.Schema({
//    fromAccount: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "account",
//     required: [true, "Transaction must be associated with a from account"],
//     index: true
//    },

//    toAccount: {
//       type: mongoose.Schema.Types.ObjectId,
//     ref: "account",
//     required: [true, "Transaction must be associated with a account"],
//     index: true
//    },

//    status: {
//      type: String,
//      enum : {
//         values : ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
//         messages: "Status can be either PENDING, COMPLETED, FAILED or REVERSED",
//      },
//      default: "PENDING"
//    },

//    amount: {
//     type: Number,
//     required: [true, "Amount is required for creating a transaction"],
//     min: [0, "Transaction amount cannot be negative"]
//    },

//    idempotencyKey: {
//     type: String,
//     required: [true, "Idempotency Key is required for creating a transaction"],
//     index: true,
//     unique: true
//    },

// },
// {
//     timestamps: true
// })

// const transactionModel = mongoose.model("transaction", transactionSchema)

// module.exports = transactionModel


const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        fromAccount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "account",
            required: [true, "Sender account is required"],
            index: true
        },

        toAccount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "account",
            required: [true, "Receiver account is required"],
            index: true
        },

        status: {
            type: String,
            enum: {
                values: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
                message: "Status must be PENDING, COMPLETED, FAILED or REVERSED"
            },
            default: "PENDING"
        },

        amount: {
            type: Number,
            required: [true, "Transaction amount is required"],
            min: [0.01, "Transaction amount must be greater than zero"],
            validate: {
                validator: Number.isFinite,
                message: "Transaction amount must be a valid number"
            }
        },

        idempotencyKey: {
            type: String,
            required: [true, "Idempotency key is required"],
            trim: true,
            minlength: [1, "Idempotency key cannot be empty"],
            unique: true
        }
    },
    {
        timestamps: true
    }
);

const transactionModel = mongoose.model(
    "transaction",
    transactionSchema
);

module.exports = transactionModel;
