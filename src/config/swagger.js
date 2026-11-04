
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.3",

        info: {
            title: "Bank Transaction Ledger System API",
            version: "1.0.0",
            description: `
A REST API for managing user accounts and secure financial transactions.

Features:
- User registration and authentication
- JWT-based authorization
- Account creation and balance management
- Double-entry ledger system
- Atomic MongoDB transactions
- Idempotency protection
- System-user initial funding
`
        },

        servers: [
            {
                url: "/",
                description: "Current server"
            }
        ],

        tags: [
            { name: "Health", description: "API health check" },
            { name: "Authentication", description: "User authentication" },
            { name: "Accounts", description: "Account management" },
            { name: "Transactions", description: "Money transfer operations" }
        ],

        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "Enter the JWT token received from login or registration."
                }
            },

            schemas: {
                RegisterRequest: {
                    type: "object",
                    required: ["email", "password", "name"],
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            example: "user@example.com"
                        },
                        password: {
                            type: "string",
                            minLength: 6,
                            example: "StrongPassword123"
                        },
                        name: {
                            type: "string",
                            example: "John Doe"
                        }
                    }
                },

                LoginRequest: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            example: "user@example.com"
                        },
                        password: {
                            type: "string",
                            example: "StrongPassword123"
                        }
                    }
                },

                TransactionRequest: {
                    type: "object",
                    required: [
                        "fromAccount",
                        "toAccount",
                        "amount",
                        "idempotencyKey"
                    ],
                    properties: {
                        fromAccount: {
                            type: "string",
                            example: "6aeb15cc6f1371764fadf8dd"
                        },
                        toAccount: {
                            type: "string",
                            example: "6aeb16426f1371764fadf8de"
                        },
                        amount: {
                            type: "number",
                            exclusiveMinimum: 0,
                            multipleOf: 0.01,
                            example: 2000
                        },
                        idempotencyKey: {
                            type: "string",
                            maxLength: 128,
                            example: "TRANSFER-TEST-001"
                        }
                    }
                },

                InitialFundsRequest: {
                    type: "object",
                    required: ["toAccount", "amount", "idempotencyKey"],
                    properties: {
                        toAccount: {
                            type: "string",
                            example: "6aeb15cc6f1371764fadf8dd"
                        },
                        amount: {
                            type: "number",
                            exclusiveMinimum: 0,
                            multipleOf: 0.01,
                            example: 10000
                        },
                        idempotencyKey: {
                            type: "string",
                            maxLength: 128,
                            example: "INITIAL-FUND-TEST-001"
                        }
                    }
                },

                ErrorResponse: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                            example: "Invalid account ID"
                        }
                    }
                }
            }
        },

        paths: {
            "/": {
                get: {
                    tags: ["Health"],
                    summary: "Check API health",
                    responses: {
                        200: {
                            description: "API is running",
                            content: {
                                "application/json": {
                                    example: {
                                        message: "Bank Transaction Ledger API is running"
                                    }
                                }
                            }
                        }
                    }
                }
            },

            "/api/auth/register": {
                post: {
                    tags: ["Authentication"],
                    summary: "Register a new user",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/RegisterRequest"
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: "User registered successfully; response includes JWT token"
                        },
                        400: {
                            description: "Required fields missing"
                        },
                        422: {
                            description: "User already exists"
                        },
                        500: {
                            description: "Registration failed"
                        }
                    }
                }
            },

            "/api/auth/login": {
                post: {
                    tags: ["Authentication"],
                    summary: "Login user and receive JWT",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/LoginRequest"
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: "Login successful; response includes JWT token"
                        },
                        400: {
                            description: "Email or password missing"
                        },
                        401: {
                            description: "Invalid credentials"
                        },
                        500: {
                            description: "Login failed"
                        }
                    }
                }
            },

            "/api/auth/logout": {
                post: {
                    tags: ["Authentication"],
                    summary: "Logout user and blacklist JWT",
                    description: "Provide a Bearer token in the Authorization header or use the authentication cookie. This endpoint does not have route-level authentication middleware.",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: "User logged out or already logged out"
                        },
                        500: {
                            description: "Logout failed"
                        }
                    }
                }
            },

            "/api/accounts/": {
                post: {
                    tags: ["Accounts"],
                    summary: "Create a new account",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        201: {
                            description: "Account created successfully"
                        },
                        500: {
                            description: "Unable to create account"
                        }
                    }
                },

                get: {
                    tags: ["Accounts"],
                    summary: "Get all accounts of logged-in user",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: "List of user accounts"
                        },
                        500: {
                            description: "Unable to fetch accounts"
                        }
                    }
                }
            },

            "/api/accounts/balance/{accountId}": {
                get: {
                    tags: ["Accounts"],
                    summary: "Get account balance",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: "accountId",
                            in: "path",
                            required: true,
                            schema: {
                                type: "string"
                            },
                            example: "6aeb15cc6f1371764fadf8dd"
                        }
                    ],
                    responses: {
                        200: {
                            description: "Account balance retrieved successfully"
                        },
                        400: {
                            description: "Invalid account ID"
                        },
                        404: {
                            description: "Account not found"
                        },
                        500: {
                            description: "Unable to fetch account balance"
                        }
                    }
                }
            },

            "/api/transactions/": {
                post: {
                    tags: ["Transactions"],
                    summary: "Transfer money between accounts",
                    description: "The sender account must belong to the authenticated user. Both accounts must be active and have the same currency. Amount supports up to two decimal places.",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/TransactionRequest"
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: "Transaction completed successfully"
                        },
                        200: {
                            description: "Previously completed idempotent transaction"
                        },
                        202: {
                            description: "Transaction is still processing"
                        },
                        400: {
                            description: "Invalid input, inactive account, currency mismatch or insufficient balance"
                        },
                        404: {
                            description: "Sender or receiver account not found"
                        },
                        409: {
                            description: "Idempotency conflict or duplicate request"
                        },
                        500: {
                            description: "Unable to process transaction"
                        }
                    }
                }
            },

            "/api/transactions/system/initial-funds": {
                post: {
                    tags: ["Transactions"],
                    summary: "Transfer initial funds from system account",
                    description: "Only an authenticated system user can access this endpoint.",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/InitialFundsRequest"
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: "Initial funds transaction completed"
                        },
                        400: {
                            description: "Invalid input or inactive account"
                        },
                        403: {
                            description: "System user privileges required"
                        },
                        404: {
                            description: "Receiver or system funding account not found"
                        },
                        409: {
                            description: "Duplicate transaction request"
                        },
                        500: {
                            description: "Unable to process initial funds transaction"
                        }
                    }
                }
            }
        }
    },

    apis: []
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
