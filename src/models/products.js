import mongoose from "mongoose";


const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required:[true,"Please enter product name"],
        trim: true,
    },
    price : {
        type: Number,
        required:[true,"Please enter product price"],
        maxLength: [8, "Price cannot exceed 8 figure"]
    },

   photo:{
    type:String,
    required:[true, "Please enter Photo"],
   },
    
    category: {
        type:String,
        required: [true,"Please enter product category"],
        trim: true,
    },
    stock: {
        type:Number,
        required: [true,"Please enter product stock"],
    },

},{
    timestamps:true,
});


export const Product=  mongoose.model("Product",productSchema);