import mongoose from "mongoose";

const schema=  mongoose.Schema({
    code: {
        type: String,
        required: [true,"Please give coupon code"],
        unique: true,
    },
    amount: {
        type: Number,
        required:[true,"Please enter coupon amount"]
    }
},
{
    timestamps:true
});

export const Coupon= mongoose.model("coupon", schema);