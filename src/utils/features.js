import mongoose from 'mongoose';
import { Product } from '../models/products.js';
import { myCache } from '../server.js';
import { TryCatch } from '../middlewares/error.js';
import { Order } from '../models/orders.js';


export const ConnectDB= (mongo_uri)=>{
   mongoose.connect(mongo_uri, {dbName: "E-commerce-app"})
   .then((c)=> console.log(`DB connected to ${c.connection.host}`))
   .catch((e)=> console.log(e));
}

export const invalidateCache=({product, admin, order, productId, userId, orderId})=>{
   if(product){
    let cacheKeys= ["latest-products", "categories", "all-products",];
    
    if(typeof productId==='string')
    cacheKeys.push(`singleProduct-${productId}`);

    if(typeof productId==='object'){
      productId.forEach((id)=>cacheKeys.push(`singleProduct-${id}`))
    }

    myCache.del(cacheKeys);
   }

   if(order){
      let cacheKeys= ["all-orders", `my-orders-${userId}`, `order-${orderId}`];
       myCache.del(cacheKeys); 
   }

   if(admin){
      myCache.del([
         "admin-stats",
         "admin-pie-charts",
         "admin-bar-charts",
         "admin-line-charts"
      ])
   }
}

export const reductStock =async(orderItems)=>{
   for (let i = 0; i < orderItems.length; i++) {
      const order = orderItems[i];
      let product = await Product.findById(order.productId);
      if(!product) throw new Error("Product Not Found");
      product.stock-= order.quantity;
      await product.save(); 
   }  
}


export const calculatePercentage=(thisMonth, lastMonth)=>{
  if(lastMonth === 0) return (thisMonth*100);
 let percentage= Number((((thisMonth)/lastMonth)*100).toFixed(0));
 return percentage;
}


export const InventoryCount=  async(allCategories, productCount)=>{
   const categoriesCountPromise = allCategories.map((category)=>Product.countDocuments({category}))
   const categoriesCount = await Promise.all(categoriesCountPromise);
   let categoryCount = [];
   allCategories.map((category,i)=>{
       categoryCount.push({[category]: (Math.round((categoriesCount[i]/productCount)*100))});
   })

   return categoryCount;
}



export const getChartData=(length, arrayItem, today, property)=>{
   let data= new Array(length).fill(0);

   arrayItem.forEach((i)=>{
       const creationDate = i.createdAt;
       let monthDiff;
       if(today.getMonth() >= creationDate.getMonth())
       monthDiff= today.getMonth()- creationDate.getMonth();
       else 
       monthDiff = (today.getMonth())+ 12 - creationDate.getMonth();

       if(monthDiff < length){
         data[length-1-monthDiff]+= (property)? i[property] : 1
       }
   })
   return data;
}