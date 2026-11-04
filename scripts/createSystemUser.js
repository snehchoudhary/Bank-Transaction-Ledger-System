
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const userModel = require("../src/models/user.model");
const accountModel = require("../src/models/account.model");

async function createSystemUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");

        const email = "system@ledger.local";
        const password = "SystemLedger@2026";
        
        let systemUser = await userModel.findOne({ email }).select("+systemUser");

        if (!systemUser) {
            const hashedPassword = await bcrypt.hash(password, 10);

            // Use the native collection to intentionally create
            // a system user despite the immutable Mongoose field.
            const result = await userModel.collection.insertOne({
                email,
                name: "Ledger System",
                password: hashedPassword,
                systemUser: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            systemUser = await userModel.findById(result.insertedId)
                .select("+systemUser");

            console.log("System user created");
        } else if (!systemUser.systemUser) {
            throw new Error("This email already belongs to a non-system user.");
        } else {
            console.log("System user already exists");
        }

        let systemAccount = await accountModel.findOne({
            user: systemUser._id,
            currency: "INR"
        });

        if (!systemAccount) {
            systemAccount = await accountModel.create({
                user: systemUser._id,
                currency: "INR"
            });
            console.log("System account created");
        } else {
            console.log("System account already exists");
        }

        console.log("System user ID:", systemUser._id.toString());
        console.log("System account ID:", systemAccount._id.toString());
        console.log("Setup completed");

    } catch (error) {
        console.error("Setup failed:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

createSystemUser();
