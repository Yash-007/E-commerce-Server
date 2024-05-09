import { Coupon } from "../models/coupons.js";
import { stripe } from "../server.js";


export const createPaymentIntent=async(req,res)=>{
  try {
    const {amount} = req.body; 
    if(!amount) {
       return res.status(400).send({
            success:false,
            message: "Please enter amount"
        })
    }

    const paymentIntent = await stripe.paymentIntents.create({
        amount : Number(amount) * 100,
        currency: "inr",
        description: "for amazon-clone project",
      shipping: {
      name: "Random singh",
      address: {
        line1: "abcd line",
        postal_code: "475661",
        city: "Datia",
        state: "Madhya Pradesh",
        country: "India",
      },
    },
    });
    return res.status(201).send({
        success:true,
        clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    return res.send({
        success:false,
        message: error.message,
    })
  }
}

export const newCoupon=async(req,res)=>{
    try {
        const {code, amount} = req.body;
        if(!code || !amount){
            return res.status(400).send({
                success:false,
                message:"Please enter all coupon details",
            })
        }
        const coupon= new Coupon(req.body);
        await coupon.save()
        return res.status(200).send({
            success:true,
            coupon,
        })
        } catch (error) {
            return res.status(500).send({
                success:false,
                message:"Internal Server Error",
            })
     }
}


export const applyDiscount=async(req,res)=>{
    try {
        const {code} = req.query;
        let coupon= await Coupon.findOne({code});
        if(!coupon){
            return res.status(400).send({
                success:false,
                message:"Invalid Coupon Code",
            }) 
        }
        return res.status(200).send({
            success:true,
            amount:coupon.amount,
        }) 
    } catch (error) {
        return res.status(500).send({
            success:false,
            message:"Internal Server Error",
        })
    }
}


export const allCoupons=async(req,res)=>{
    try {
        const coupons = await Coupon.find({});
        return res.status(200).send({
            success:true,
            coupons
        })
    } catch (error) {
       return res.status(500).send({
            success:false,
            message:"Internal Server Error",
        })
    }
}

export const deleteCoupon =async(req,res)=>{
    try {
        const {id} = req.params;
        const coupon = await Coupon.findByIdAndDelete(id);
        if(!coupon){
           return res.status(404).send({
                success:false,
                message: "Coupon not found"
            })  
        }
       return res.status(200).send({
            success:true,
            message: "Coupon deleted successfully"
        })  
    } catch (error) {
       return res.status(400).send({
            success:false,
            message: "Invalid Id",
        })
    }   
}