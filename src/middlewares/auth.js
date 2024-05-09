import { User } from "../models/users.js";

export const adminOnly = async(req,res,next)=>{
    try {
        const {id} = req.query;
        if(!id){
           return res.status(401).send({
                success:false,
                message: "Please login first",
            })
        }
        let user=  await User.findById(id);
        if(!user){
           return res.status(401).send({
                success:false,
                message: "Invalid Id",
            })
        }

        if(user.role !== 'admin'){
           return res.status(401).send({
                success:false,
                message: "Unauthorized user",
            })
        }
       
        next();
    } catch (error) {
        return res.status(500).send({
        success:false,
        message: "Internal Server Error",
       })  
    } 
}