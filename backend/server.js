const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const authRouter = require('./routes/auth');
// Middleware to parse JSON bodies
app.use(express.json());

app.use('/auth', authRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});