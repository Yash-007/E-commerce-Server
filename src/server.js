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
const PORT= process.env.PORT || 4000;
const stripeKey = process.env.STRIPE_KEY || "";

// export const AWS_OBJECT_STORAGE_REGION= process.env.AWS_OBJECT_STORAGE_REGION;
// export const AWS_ACCESS_KEY_ID= process.env.AWS_ACCESS_KEY_ID;
// export const AWS_SECRET_ACCESS_KEY= process.env.AWS_SECRET_ACCESS_KEY;
// export const AWS_BUCKET_NAME= process.env.AWS_BUCKET_NAME;

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

