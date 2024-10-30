# Comprehensive backend API for a Learning Management System [LMS] that provides functionalities for managing users courses, reviews, orders, and payments. This API is built using Node.js, Express, and PostgreSQL using Prisma ORM.

## Features

Built with:
Node.JS
Express.JS
PostgreSQL (Prisma ORM)
JWT (JSON Web Tokens)
Cloudinary [For Image Uploading]
Stripe [For Payments & Orders]

## Getting Started

```sh
git clone https://github.com/HazemSarhan/learning-management-system-api-prisma.git
npm install
npx prisma migrate dev --name init
```

## Environment Variables

DATABASE_URL= your-db-connection-string
PORT = 5000
JWT_LIFETIME = 1d
JWT_SECRET = generate-256-encryption-key
CLOUD_NAME = cloudinary-cloud-name
CLOUD_API_KEY = cloudinary-api-key
CLOUD_API_SECRET = cloudinary-api-secret-key
STRIPE_SECRET_KEY = stripe-secret-key
FRONTEND_SUCCESS = http://localhost:5000/api/v1/payments/success

## Usage

After creating .env with all variables

1. Run the server using:

```sh
npm start
```

2. Regsiter a new account, First account automaticly set to ADMIN

> [!NOTE]
> Check the docs for all routes & data [LMS API Documentation](http://localhost:5000/api-docs/).
