// const express = require("express");
// const cookieParser = require("cookie-parser");

// const app = express();

// app.use(express.json());
// app.use(cookieParser());

// // Health check / root route
// app.get("/", (req, res) => {
//     res.status(200).json({
//         message: "Bank Transaction Ledger API is running"
//     });
// });

// // Routes
// const authRouter = require("./routes/auth_routes");
// const accountRouter = require("./routes/account.routes");
// const transactionRoutes = require("./routes/transaction.routes");

// // Use routes
// app.use("/api/auth", authRouter);
// app.use("/api/accounts", accountRouter);
// app.use("/api/transactions", transactionRoutes);

// module.exports = app;




const express = require("express");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");

const swaggerSpec = require("./config/swagger");

const app = express();

app.use(express.json());
app.use(cookieParser());

// Swagger API Documentation
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        explorer: true,
        swaggerOptions: {
            persistAuthorization: true
        },
        customSiteTitle: "Bank Transaction Ledger API Documentation"
    })
);

// Optional JSON OpenAPI specification
app.get("/api-docs.json", (req, res) => {
    res.status(200).json(swaggerSpec);
});

// Health check / root route
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Bank Transaction Ledger API is running"
    });
});

// Routes
const authRouter = require("./routes/auth_routes");
const accountRouter = require("./routes/account.routes");
const transactionRoutes = require("./routes/transaction.routes");

// Register routes
app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transactions", transactionRoutes);

module.exports = app;
