import { Order } from "../models/orders.js";
import { myCache } from "../server.js";
import { invalidateCache, reductStock } from "../utils/features.js";


export const myOrders=async(req,res)=>{
    try {
        const {id} = req.query;
        const key=  `my-orders-${id}`;

        let orders=[];
        if(myCache.has(key)){
        orders= JSON.parse(myCache.get(key));
        }
        else{
        orders = await Order.find({user:id});
        myCache.set(key, JSON.stringify(orders));
        }

        return res.status(200).send({
            success:true,
            orders,
        });

    } catch (error) {
        return res.status(500).send({
            success:false,
            message:"Internal Server Error",
        });
    }
}


export const allOrders= async(req,res)=>{
    try {
        const key=  `all-orders`;
        let orders=[];
        if(myCache.has(key)){
        orders= JSON.parse(myCache.get(key));
        }
        else{
        orders = await Order.find({}).populate("user", "name");
        myCache.set(key, JSON.stringify(orders));
        }
 
        return res.status(200).send({
            success:true,
            orders,
        });
    } catch (error) {
        return res.status(500).send({
            success:false,
            message:"Internal Server Error",
        });
    }
}


export const getSingleOrder= async(req,res)=>{
    try {
     const {id} = req.params;
     const key= `order-${id}`;
     let order;

     if(myCache.has(key)){
      order = JSON.parse(myCache.get(key));
     }
     else{
        order= await Order.findById(id).populate('user', 'name');
        if(!order){
            return res.status(404).send({
                success:false,
                message:"Order not found",
            });    
        }
        
        myCache.set(key, JSON.stringify(order));
     }
     
     return res.status(200).send({
        success:true,
        order
    })
    } catch (error) {
        return res.status(400).send({
            success:false,
            message:"Invalid Id",
        });
    }
}


export const newOrder= async(req,res)=>{
    const {shippingInfo, user, subtotal, tax, shippingCharges, discount, total, orderItems } = req.body;

    if(!shippingInfo || !user || !subtotal || !tax || !shippingCharges || discount===undefined || !total || !orderItems ){
        return res.status(400).send({
            success:false,
            message:"Please fill all fields",
        })
    }

    const order = new Order(req.body);
    await order.save();

    await reductStock(req.body.orderItems);
    
    invalidateCache({product:true, order:true, admin:true, userId:order.user,
        productId: orderItems.map((item)=> item.productId)
    });

    return res.status(201).send({
        success:true,
        message:"Order placed successfully",
        order,
    })
}


export const processOrder= async(req,res)=>{
    try {
        const {id} = req.params;
        let order= await Order.findById(id);
        if(!order){
            return res.status(404).send({
                success:false,
                message:"Order not found",
            });    
        }

        switch (order.status) {
            case "Processing":
                order.status= "Shipped";
                break;

            case "Shipped":
                order.status= "Delivered";
                break;
        
            default:
                order.status= "Delivered";
                break;
        }
        await order.save();

        invalidateCache({product:false, order:true, admin:true, userId:order.user, orderId:id});

        return res.status(200).send({
            success:true,
            message: "Order processed successfully",
        })
    } catch (error) {
        return res.status(400).send({
            success:false,
            message:"Invalid Id",
        });   
    }
}


export const deleteOrder = async(req,res)=>{
    try {
        const {id} = req.params;
        let order= await Order.findById(id);
        if(!order){
            return res.status(404).send({
                success:false,
                message:"Order not found",
            });    
        }
        await order.deleteOne();

        invalidateCache({product:false, order:true, admin:true, userId: order.user, orderId:id});

        return res.status(200).send({
            success:true,
            message: "Order deleted successfully",
        })
    } catch (error) {
        return res.status(400).send({
            success:false,
            message:"Invalid Id",
        });  
    }
}