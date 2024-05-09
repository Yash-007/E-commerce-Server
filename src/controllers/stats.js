import { Order } from '../models/orders.js';
import { Product } from '../models/products.js';
import { User } from '../models/users.js';
import {myCache} from '../server.js';
import { InventoryCount, calculatePercentage, getChartData } from '../utils/features.js';

export const getDashboardStats=async(req,res)=>{
    try {
        let stats;
        if(myCache.has("admin-stats")){
          stats= JSON.parse(myCache.get("admin-stats"))
        }
        else{
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth()-6);
        if(sixMonthsAgo.getMonth()>=6) sixMonthsAgo.setFullYear(sixMonthsAgo.getFullYear()-1);

        let date= new Date();
        let thisMonth= {
        first: new Date(date.getFullYear(), date.getMonth(), 1),
        last: date
       }
      let lastMonth= {
        first: new Date(date.getFullYear(),date.getMonth()-1,1),
        last: new Date(date.getFullYear(),date.getMonth(),0)
      }

     const thisMonthProductsPromise= Product.find({createdAt : {
        $gte: thisMonth.first,
        $lte: thisMonth.last 
     }})

     const lastMonthProductsPromise= Product.find({createdAt : {
        $gte: lastMonth.first,
        $lte: lastMonth.last 
     }})

     const thisMonthUsersPromise= User.find({createdAt : {
        $gte: thisMonth.first,
        $lte: thisMonth.last 
     }})

     const lastMonthUsersPromise= User.find({createdAt : {
        $gte: lastMonth.first,
        $lte: lastMonth.last 
     }})


     const thisMonthOrdersPromise= Order.find({createdAt : {
        $gte: thisMonth.first,
        $lte: thisMonth.last 
     }})

     const lastMonthOrdersPromise= Order.find({createdAt : {
        $gte: lastMonth.first,
        $lte: lastMonth.last 
     }})

     const lastSixMonthsOrdersPromise= Order.find({createdAt: {
        $gte: sixMonthsAgo,
        $lte: date,
     }})

     const latestTransactionPromise = Order.find({}).select(["orderItems", "discount", "total", "status"]).limit(4);

     const [thisMonthProducts,
            lastMonthProducts,
            thisMonthUsers, 
            lastMonthUsers, 
            thisMonthOrders, 
            lastMonthOrders,
            lastSixMonthsOrders,
            allCategories,
            latestTransaction,
            productCount,
            userCount,
            femaleCount,
            allOrders] = 
                                  await Promise.all([
                                  thisMonthProductsPromise,
                                  lastMonthProductsPromise,
                                  thisMonthUsersPromise, 
                                  lastMonthUsersPromise,
                                  thisMonthOrdersPromise,
                                  lastMonthOrdersPromise,
                                  lastSixMonthsOrdersPromise,
                                  Product.distinct('category'),
                                  latestTransactionPromise,
                                  Product.countDocuments(),
                                  User.countDocuments(),
                                  User.countDocuments({gender:"female"}),
                                  Order.find()])

        let thisMonthRevenue= thisMonthOrders.reduce((total, order)=>{
                total+=(order?.total || 0);
                return total;
        },0);

        let lastMonthRevenue= lastMonthOrders.reduce((total, order)=>{
            total+=(order?.total || 0);
            return total;
        },0);


        // change in percentage  
        let percentageChange={
            revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
            product: calculatePercentage(thisMonthProducts.length, lastMonthProducts.length),
            user:  calculatePercentage(thisMonthUsers.length, lastMonthUsers.length),
            order: calculatePercentage(thisMonthOrders.length, lastMonthOrders.length),
        }
        // all counts 
        let count={
            revenue:thisMonthRevenue,
            product:productCount,
            user:userCount,
            order:allOrders.length,
        }

        // last six months order and revenue 
        let orderMonthyCounts= new Array(6).fill(0);
        let orderMonthyRevenue= new Array(6).fill(0);

        lastSixMonthsOrders.forEach((order)=>{
            const creationDate = order.createdAt;
            let monthDiff;
            if(date.getMonth() >= creationDate.getMonth())
            monthDiff= date.getMonth()- creationDate.getMonth();
            else 
            monthDiff = (date.getMonth()+1)+ 11 - creationDate.getMonth();

            if(monthDiff < 6){
                orderMonthyCounts[5-monthDiff]++;
                orderMonthyRevenue[5-monthDiff]+= order.total;
            }
        })

        // categories and their percentage 
        const categoryCount = await InventoryCount(allCategories, productCount);

        // user ratio 
        let userRatio={
            male: userCount-femaleCount,
            female: femaleCount,
        }

        // top 4 transactions 
       let modifiedLatestTransactions = latestTransaction.map((item)=>({
         _id : item._id,
         discount: item.discount,
         amount: item.total,
         quantity: item.orderItems.length,
         status: item.status,
       }));
        

        stats={
            categoryCount,
            percentageChange,
            count,
            chart:{
                order: orderMonthyCounts,
                revenue: orderMonthyRevenue,
            },
            userRatio,
            latestTransactions: modifiedLatestTransactions,
        }

        myCache.set("admin-stats", JSON.stringify(stats));
     }

     return res.status(200).send({
        success:true,
        stats,
    })
    } catch (error) {
        return res.send({
            success:false,
            message: error.message
        })
    }
}


export const getPieCharts= async(req,res)=>{
    try {
     let charts;
     if(myCache.has("admin-pie-charts")){
        charts = JSON.parse(myCache.get("admin-pie-charts"));
     }
     else{
        const [ProcessingOrders,
            ShippedOrders,
            DeliveredOrders,
            allCategories,
            productCount,
            outOfStock,
            allOrders,
            allUsers,
            adminUsers,
            customerUsers] = await Promise.all([
                                   Order.countDocuments({status: "Processing"}),
                                   Order.countDocuments({status: "Shipped"}),
                                   Order.countDocuments({status: "Delivered"}),
                                   Product.distinct("category"),
                                   Product.countDocuments(),
                                   Product.countDocuments({stock: 0}),
                                   Order.find({}),
                                   User.find({}).select("dob"),
                                   User.countDocuments({role: 'admin'}),
                                   User.countDocuments({role: 'user'})])

    // order fullfillment 
     const orderFullfillment = {
         processing : ProcessingOrders,
         shipped: ShippedOrders,
         delivered: DeliveredOrders,
     }

    //  product categories count 
    const productCategories = await InventoryCount(allCategories, productCount);

    // stock count 
    const stockAvailability = {
     inStock : productCount - outOfStock,
     outOfStock,
    }
     
//    distibution 

    const grossIncome = allOrders.reduce((total,item)=>{
         total+= item.total || 0;
         return total;
     },0)


     const discount = allOrders.reduce((total,item)=>{
         total+= item.discount || 0;
         return total;
     },0)

     const productionCost = allOrders.reduce((total,item)=>{
         total+= item.shippingCharges || 0;
         return total;
     },0)

     const burnt = allOrders.reduce((total,item)=>{
         total+= item.tax || 0;
         return total;
     },0)

     const marketingCost = Math.round(((grossIncome*30)/100));

     const netMargin = grossIncome - (discount + productionCost + burnt + marketingCost);

     const revenueDistribution = {
      netMargin,
      discount,
      productionCost,
      burnt,
      marketingCost
     }

    //  age group distribution 
     const userAgeGroups = {
         teen : allUsers.filter((user)=> user.age<20).length,
         adult: allUsers.filter((user)=> user.age>20 && user.age<40).length,
         old:   allUsers.filter((user)=> user.age>=40).length,
     }

    //  admin customer distribution 
     const adminCustomer = {
         admin: adminUsers,
         customer: customerUsers,
     }

     charts =  {
         orderFullfillment,
         productCategories,
         stockAvailability,
         revenueDistribution,
         userAgeGroups,
         adminCustomer,
     }
     myCache.set("admin-pie-charts",JSON.stringify(charts));
 }

        res.status(200).send({
            success: true,
            charts,
        })
     } catch (error) {
        return res.send({
            success:false,
            message: error.message
        })
    }
}

export const getBarCharts = async(req,res)=>{
    try {
        const key= 'admin-bar-charts';
        let charts;
        if(myCache.has(key)){
         charts = JSON.parse(myCache.get(key));
        }
        else{
            let sixMonthsAgo = new Date();
            let twelveMonthsAgo = new Date();

            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth()-6);
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth()-12);

            const today = new Date();

            const lastSixMonthUsersPromise= User.find({createdAt : {
                $gte: sixMonthsAgo,
                $lte: today 
             }}).select("createdAt")

             const lastSixMonthProductsPromise= Product.find({createdAt : {
                $gte: sixMonthsAgo,
                $lte: today 
             }}).select("createdAt")

             const lastTwelveMonthOrdersPromise= Order.find({createdAt : {
                $gte: twelveMonthsAgo,
                $lte: today 
             }}).select("createdAt")

            const [lastSixMonthUsers, 
                  lastSixMonthProducts,
                  lastTwelveMonthOrders]  = await Promise.all([lastSixMonthUsersPromise,
                                                               lastSixMonthProductsPromise,
                                                               lastTwelveMonthOrdersPromise])
            


                 const usersCount= getChartData(6,lastSixMonthUsers,today);
                 const productsCount= getChartData(6,lastSixMonthProducts,today);
                 const ordersCount= getChartData(12,lastTwelveMonthOrders,today);

                 charts = {
                    users: usersCount,
                    product: productsCount,
                    order: ordersCount,
                 }

                 myCache.set(key, JSON.stringify(charts));
        }
        res.status(200).send({
            success: true,
            charts,
        })
    } catch (error) {
        return res.send({
            success:false,
            message: error.message
        })
    }
}

export const getLineCharts = async(req,res)=>{
    try {
        const key= 'admin-line-charts';
        let charts;
        if(myCache.has(key)){
         charts = JSON.parse(myCache.get(key));
        }
        else{
            let twelveMonthsAgo = new Date();

            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth()-12);

            const today = new Date();

            const baseQuery =  {
                $gte: twelveMonthsAgo,
                $lte: today 
             }


            const [lastTwelveMonthUsers, 
                  lastTwelveMonthProducts,
                  lastTwelveMonthOrders]  = await Promise.all([User.find({createdAt : baseQuery}).select("createdAt"),
                                                               Product.find({createdAt : baseQuery}).select("createdAt"),
                                                               Order.find({createdAt : baseQuery}).select(["createdAt", "discount", "total"])])
            

                                                               
                 const usersCount= getChartData(12,lastTwelveMonthUsers,today);
                 const productsCount= getChartData(12,lastTwelveMonthProducts,today);
                 const discountCount= getChartData(12,lastTwelveMonthOrders,today, "discount");
                 const revenueCount= getChartData(12,lastTwelveMonthOrders,today, "total");

                 charts = {
                    users: usersCount,
                    product: productsCount,
                    discount: discountCount,
                    revenue: revenueCount,
                 }

                 myCache.set(key, JSON.stringify(charts));
        }
        res.status(200).send({
            success: true,
            charts,
        })
    } catch (error) {
        return res.send({
            success:false,
            message: error.message
        })
    }
}

