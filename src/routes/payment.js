import express from 'express';
import { allCoupons, applyDiscount, createPaymentIntent, deleteCoupon, newCoupon } from '../controllers/payment.js';
import { adminOnly } from '../middlewares/auth.js';

const app = express.Router();


// route - /api/v1/payment/create 
app.post("/create", createPaymentIntent);


// route - /api/v1/payment/discount 
app.get("/discount", applyDiscount);


// route - /api/v1/payment/new 
app.post("/new",adminOnly, newCoupon);


// route - /api/v1/payment/all 
app.get("/all",adminOnly ,allCoupons);


// route - /api/v1/payment/:id 
app.delete("/:id",adminOnly, deleteCoupon);

export default app;

