import express from 'express';
import { allOrders, myOrders, newOrder, getSingleOrder, deleteOrder, processOrder } from '../controllers/orders.js';
import { adminOnly } from '../middlewares/auth.js';

const app = express.Router();

// route - /api/v1/order/new 
app.post("/new", newOrder);


// route - /api/v1/order/my 
app.get("/my", myOrders);


// route - /api/v1/order/all 
app.get("/all", adminOnly, allOrders);


// route - /api/v1/order/:id 
app.route("/:id").get(getSingleOrder).put(adminOnly,processOrder).delete(adminOnly,deleteOrder)


export default app;
