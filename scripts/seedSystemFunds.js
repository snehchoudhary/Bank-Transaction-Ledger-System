
require("dotenv").config();

const mongoose = require("mongoose");
const crypto = require("crypto");

const userModel = require("../src/models/user.model");
const accountModel = require("../src/models/account.model");
const transactionModel = require("../src/models/transaction.model");
const ledgerModel = require("../src/models/ledger.model");

const SYSTEM_EMAIL = "system@ledger.local";
const CLEARING_EMAIL = "clearing@ledger.local";

const OPENING_AMOUNT = 100000;
const IDEMPOTENCY_KEY = "SYSTEM-OPENING-FUNDS-2026-001";

async function seedSystemFunds() {
    let session = null;

    try {
        // 1. Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully");

        // 2. Start session
        session = await mongoose.startSession();

        // 3. Find system user
        const systemUser = await userModel
            .findOne({ email: SYSTEM_EMAIL })
            .select("+systemUser");

        if (!systemUser || systemUser.systemUser !== true) {
            throw new Error("Valid system user not found");
        }

        console.log("System user verified");

        // 4. Check duplicate opening transaction
        const existingTransaction = await transactionModel.findOne({
            idempotencyKey: IDEMPOTENCY_KEY
        });

        if (existingTransaction) {
            console.log("Opening transaction already exists.");
            console.log(
                "Transaction ID:",
                existingTransaction._id.toString()
            );
            console.log("Skipping duplicate funding.");
            return;
        }

        // 5. Find system account
        const systemAccount = await accountModel.findOne({
            user: systemUser._id,
            currency: "INR",
            status: "ACTIVE"
        });

        if (!systemAccount) {
            throw new Error("System funding account not found");
        }

        // 6. Find or create clearing user
        let clearingUser = await userModel.findOne({
            email: CLEARING_EMAIL
        });

        if (!clearingUser) {
            clearingUser = await userModel.create({
                email: CLEARING_EMAIL,
                name: "External Funding Clearing",
                password: crypto.randomBytes(32).toString("hex")
            });

            console.log("Clearing user created");
        }

        // 7. Find or create clearing account
        let clearingAccount = await accountModel.findOne({
            user: clearingUser._id,
            currency: "INR"
        });

        if (!clearingAccount) {
            clearingAccount = await accountModel.create({
                user: clearingUser._id,
                currency: "INR",
                status: "ACTIVE"
            });

            console.log("Clearing account created");
        }

        if (clearingAccount.status !== "ACTIVE") {
            throw new Error("Clearing account is not active");
        }

        // 8. Create opening transaction and ledger entries
        await session.withTransaction(async () => {

            const [transaction] = await transactionModel.create(
                [{
                    fromAccount: clearingAccount._id,
                    toAccount: systemAccount._id,
                    amount: OPENING_AMOUNT,
                    idempotencyKey: IDEMPOTENCY_KEY,
                    status: "PENDING"
                }],
                {
                    session,
                    ordered: true
                }
            );

            // Create matching debit and credit entries
            await ledgerModel.create(
                [
                    {
                        account: clearingAccount._id,
                        amount: OPENING_AMOUNT,
                        transaction: transaction._id,
                        type: "DEBIT"
                    },
                    {
                        account: systemAccount._id,
                        amount: OPENING_AMOUNT,
                        transaction: transaction._id,
                        type: "CREDIT"
                    }
                ],
                {
                    session,
                    ordered: true
                }
            );

            // Mark transaction completed
            transaction.status = "COMPLETED";
            await transaction.save({ session });

            console.log("Opening transaction created");
            console.log(
                "Transaction ID:",
                transaction._id.toString()
            );
        });

        console.log("----------------------------------");
        console.log("OPENING FUNDS SEEDED SUCCESSFULLY");
        console.log("----------------------------------");

        console.log("Amount: INR", OPENING_AMOUNT);
        console.log("System Account:", systemAccount._id.toString());
        console.log("Clearing Account:", clearingAccount._id.toString());

    } catch (error) {
        console.error("SEED ERROR:", error.message);
        process.exitCode = 1;

    } finally {
        if (session) {
            await session.endSession();
        }

        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

seedSystemFunds();
