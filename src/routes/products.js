import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { singleUpload } from "../middlewares/multer.js";
import { deleteProduct, getAdminProducts, getAllCategories, getFilteredProduct, getLatestProducts, getSingleProduct, newProduct, updateProduct } from "../controllers/products.js";
import { uploadHandler } from "../middlewares/bucket.js";
const app = express.Router();


// route - /api/v1/product/new 
app.post("/new", adminOnly, uploadHandler.single("photo"), newProduct);


// route - /api/v1/product/all 
app.get("/all", getFilteredProduct);


// route - /api/v1/product/latest 
app.get("/latest", getLatestProducts);


// route - /api/v1/product/categories 
app.get("/categories", getAllCategories);


// route - /api/v1/product/admin-products 
app.get("/admin-products", adminOnly, getAdminProducts);


// route - /api/v1/product/:id 
app.route("/:id").get(getSingleProduct).put(adminOnly, uploadHandler.single("photo"), updateProduct).delete(adminOnly, deleteProduct);

export default app;