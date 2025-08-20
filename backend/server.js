require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');

// DB connection
mongoose.connect(process.env.MONGODB_URI, {
  dbName: 'timamu',
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));


// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

const authRouter = require('./routes/auth');
app.use('/auth', authRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});