const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors'); // Assuming you have a custom error handler
const purchaseCourse = async (req, res) => {
  const { courseId } = req.body;
  const userId = req.user.userId; // Assuming req.user contains the authenticated user

  // Step 1: Check if the course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });
  if (!course) {
    throw new CustomError.NotFoundError(`No course found with id: ${courseId}`);
  }

  // Step 2: Check if the user already has the course
  const existingOrder = await prisma.order.findFirst({
    where: {
      courseId: courseId,
      userId: userId,
      paymentStatus: 'COMPLETED', // Check only if there's a completed order
    },
  });
  if (existingOrder) {
    throw new CustomError.BadRequestError('You already have this course!');
  }

  // Step 3: Create Stripe Checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: course.title,
            description: course.description,
          },
          unit_amount: course.price * 100, // Convert to cents for Stripe
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.FRONTEND_SUCCESS}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.protocol}://${req.get('host')}/api/v1/payments/cancel`,
    metadata: {
      courseId: course.id,
      studentId: userId,
    },
  });

  // Step 4: Create an order in the database
  const order = await prisma.order.create({
    data: {
      userId: userId,
      courseId: courseId,
      price: course.price,
      paymentStatus: 'PENDING',
      stripeSessionId: session.id,
    },
  });

  // Step 5: Send the session ID and URL to the client
  res.status(StatusCodes.CREATED).json({ id: session.id, url: session.url });
};

const getAllOrders = async (req, res) => {
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      user: { select: { id: true, name: true } },
      course: { select: { id: true, title: true } },
      price: true,
      paymentStatus: true,
      stripeSessionId: true,
      purchased_at: true,
      updated_at: true,
    },
  });
  res.status(StatusCodes.OK).json({ orders });
};

const getOrderById = async (req, res) => {
  const { id: orderId } = req.params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      user: { select: { id: true, name: true } },
      course: { select: { id: true, title: true } },
      price: true,
      paymentStatus: true,
      stripeSessionId: true,
      purchased_at: true,
      updated_at: true,
    },
  });
  res.status(StatusCodes.OK).json({ order });
};

module.exports = { purchaseCourse, getAllOrders, getOrderById };
