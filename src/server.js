import express from 'express';
import { ConnectDB } from './utils/features.js';
import userRoute from './routes/users.js'
import productRoute from './routes/products.js'
import orderRoute from './routes/orders.js';
import paymentRoute from './routes/payment.js';
import dashboardRoute from './routes/stats.js';
import { errorMiddleware } from './middlewares/error.js';
import NodeCache from 'node-cache';
import {config} from 'dotenv';
import morgan from 'morgan';
import Stripe from 'stripe'; 
import cors from 'cors';

config({
    path: './.env'
});


const app = express();
const PORT=  5000;
const stripeKey = process.env.STRIPE_KEY || "";

export const myCache = new NodeCache();
export const stripe = new Stripe(stripeKey);

const mongo_uri= process.env.MONGO_URI;
ConnectDB(mongo_uri);

app.use(cors());
app.use(errorMiddleware);
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static("uploads"))


app.get("/", (req, res) => {
    res.send("API Working with /api/v1");
  });
  
    
// routes
app.use("/api/v1/user", userRoute);

app.use("/api/v1/product", productRoute);

app.use("/api/v1/order", orderRoute);

app.use("/api/v1/payment", paymentRoute);

app.use("/api/v1/dashboard", dashboardRoute);


app.listen(PORT, (req,res)=>{
    console.log(`server is listening at port ${PORT}`);
});
