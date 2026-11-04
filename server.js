// require("dotenv").config();

// const app = require("./src/app");
// const connectToDB = require("./src/config/db");

// connectToDB();

// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });





require("dotenv").config();

const app = require("./src/app");
const connectToDB = require("./src/config/db");

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // Connect to MongoDB before starting the server
        await connectToDB();

        const server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`API URL: http://localhost:${PORT}`);
        });

        // Handle graceful shutdown
        process.on("SIGINT", () => {
            console.log("\nShutting down server...");

            server.close(async () => {
                const mongoose = require("mongoose");
                await mongoose.connection.close();

                console.log("Server and database connection closed.");
                process.exit(0);
            });
        });

    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
}

startServer();
