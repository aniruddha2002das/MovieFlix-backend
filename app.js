const express = require('express');
const cors = require('cors');
const morgan = require("morgan");
require('express-async-errors')
const app = express();
const port = process.env.PORT || 8000;
const connectDB = require('./db/connect');
const userRouter = require('./routes/user');
const actorRouter = require('./routes/actor');
const movieRouter = require('./routes/movie');
const reviewRouter = require('./routes/review');
const adminRouter = require('./routes/admin');
const { errorHandler } = require('./middleware/error')
const { handleNotFound } = require('./utils/helper')

// Very Very important
// app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan('dev'));
require("dotenv").config();
app.use(cors());

app.use('/api/user',userRouter);
app.use('/api/actor',actorRouter);
app.use('/api/movie',movieRouter);
app.use('/api/review',reviewRouter);
app.use('/api/admin',adminRouter);

app.use('/*',handleNotFound);

app.use(errorHandler);

const start = async () => {
    try {
        app.listen(port, () => {
            console.log(`Server listening on ${port}`);
        });
        await connectDB(process.env.MONGODB_URLE);
    } catch (err) {
        console.log(err);
    }
};


start();
