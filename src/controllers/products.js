import { Product } from "../models/products.js";
import { myCache } from "../server.js";
import { invalidateCache } from "../utils/features.js";
import {rm} from 'fs';


export const getLatestProducts= async(req,res)=>{
    let products;
    if(myCache.has("latest-prodcuts")){
        products = JSON.parse(myCache.get("latest-products"))
    }
    else{
        products = await Product.find({}).sort({createdAt: -1}).limit(6);
        myCache.set("latest-products", JSON.stringify(products));
    }

    return res.status(200).send({
        success: true,
        products,
    })
};

export const getAllCategories= async(req,res)=>{
   let categories;
   if(myCache.has("categories")){
    categories= JSON.parse(myCache.get("categories"));
   }
   else{
    categories= await Product.distinct("category");
    myCache.set("categories",JSON.stringify(categories));
   }


    return res.status(200).send({
        success: true,
        categories,
    });
};

export const getAdminProducts= async(req,res)=>{
    let products;
    if(myCache.has("all-products")){
        products= JSON.parse(myCache.get("all-products"))
    }
    else{
        products = await Product.find({});
        myCache.set("all-products", JSON.stringify(products));
    }

    return res.status(200).send({
        success: true,
        products,
    });
};

export const getSingleProduct= async(req,res)=>{
     const {id} = req.params;
     let product;
     if(myCache.has(`singleProduct-${id}`)){
      product = JSON.parse(myCache.get(`singleProduct-${id}`))
     }
     else{
     product = await Product.findById(id);
     myCache.set(`singleProduct-${id}`, JSON.stringify(product));
     }
    if(!product){
        return res.status(404).send({
            success: false,
            message:"Product not found",
        })
    }

    return res.status(200).send({
        success: true,
        product,
    })
};


export const getFilteredProduct= async(req,res)=>{
    const {search, sort, category, price} = req.query;

    const page = req.query.page || 1;
    const limit = process.env.PRODUCT_PER_PAGE || 8;
    const skip = (page-1)*limit;

    let baseQuery = {};
    if(search){
        baseQuery.name={
            $regex: search,
            $options: "i",
        }
    }

    if(price){
        baseQuery.price = {
            $lte: Number(price),
        }
    }

    if(category)
    baseQuery.category= category;

    const productPromise= Product.find(baseQuery).sort(
      sort && {price: (sort==='asc')? 1 : -1}
    ).limit(limit).skip(skip);

    const [products, filteredOnlyProducts] = await Promise.all([
        productPromise, 
        Product.find(baseQuery),
    ]);

    const totalPage= Math.ceil(filteredOnlyProducts.length / limit);

   return res.status(200).send({
    success:true,
    products,
    totalPage,
   })
  }
  

  export const newProduct = async(req,res)=>{
    const {name,price,category,stock} = req.body;
  
    if(!req.file){
        return res.status(400).send({
            success: false,
            message: "Please add photo",
          })
    }

    req.body.photo = req.file?.path;
  
    if(!name || !price || !category || !stock){
      rm(req.body.photo, ()=>{
          console.log("Deleted");
      })
      
      return res.status(400).send({
        success: false,
        message: "Please fill all fields",
      })
    }
    
    req.body.category= req.body.category;
    const product = new Product(req.body);
    await product.save();
    
   invalidateCache({product:true, admin:true});
    
   return res.status(201).send({
      success: true,
      message: "Product created successfully",
    })
  };


export const updateProduct= async(req,res)=>{
  const {id} = req.params;

  let product = await Product.findById(id);
  if(!product){
    return res.status(404).send({
        success: false,
        message: "Invalid Product Id",
      })
  }

  if(req.file){
   rm(product.photo, ()=>{
    console.log("deleted");
   })
   req.body.photo= req.file.path;
  }

 const updated = await Product.findByIdAndUpdate(id, req.body, {new:true});

 invalidateCache({product:true, admin:true, productId: String(updated.id)});

 return res.status(200).send({
    success: true,
    message: "Product updated successfully",
    updated
  })};


  export const deleteProduct= async(req,res)=>{
    const {id} = req.params;
    const product = await Product.findById(req.params.id);
    if(!product){
        return res.status(404).send({
            success: false,
            message: "Product not found",
          })
    }
    
    rm(product.photo, ()=>{
        console.log("Product photo deleted");  
    });

    await product.deleteOne();

    invalidateCache({product:true, admin:true, productId:String(id)});

    return res.status(200).send({
        success: true,
        message: "Product deleted successfully",
    })
};
