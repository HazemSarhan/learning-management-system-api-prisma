require('dotenv').config();
require('express-async-errors');
const express = require('express');
const app = express();

// Rest of packages
const path = require('path');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');

const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const courseRoutes = require('./routes/course.routes');
const sectionRoutes = require('./routes/section.routes');
const lectureRoutes = require('./routes/lecture.routes');
const reviewRoutes = require('./routes/review.routes');
const orderRoutes = require('./routes/order.routes');

app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));
app.use(express.static(path.join(__dirname, './public')));
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp',
  })
);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/sections', sectionRoutes);
app.use('/api/v1/lectures', lectureRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/orders', orderRoutes);

app.get('/api/v1/payments/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/frontend', 'success.html'));
});

app.get('/api/v1/payments/cancel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/frontend', 'cancel.html'));
});

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;
const start = async () => {
  try {
    app.listen(port, () => console.log(`server is running on port ${port}`));
  } catch (error) {
    console.log(error);
  }
};

start();
