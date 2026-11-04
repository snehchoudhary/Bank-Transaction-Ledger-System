// const mongoose = require("mongoose")




// function connectToDB() {

//     mongoose.connect(process.env.MONGO_URI).then(() => {
//         console.log("Server is connected to DB")
//     })
//     .catch(err=> {
//         console.log("Error connecting to DB", err);
//         process.exit(1)
//     })
// }


// module.exports = connectToDB



const mongoose = require("mongoose");

async function connectToDB() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing from .env file");
        }

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected successfully");

    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        throw error;
    }
}

module.exports = connectToDB;
