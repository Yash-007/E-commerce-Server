import { User } from "../models/users.js";
import { invalidateCache } from "../utils/features.js";

export const newUser=  async(req,res)=>{
    const {_id, name, email, photo, gender, dob} = req.body;

    let user = await User.findById(_id);
    if(user){
       return res.status(200).send({
            success:true,
            message:`Welcome ${user.name}`
        })
    }
    
    if(!_id || !name || !email || !photo || !gender || !dob){
         return res.status(400).send({
            success: false,
            message: "Please fill all fields"
          })
    }
  

    user = new User(req.body);
    await user.save();
    
    invalidateCache({admin:true});

  return res.status(201).send({
    success:true,
    message: `Welcome ${user.name}`,
   });
}

export const getAllUsers = async(req,res,next)=>{
  const users= await User.find({});

  return res.status(200).send({
      success:true,
      users,
  });
}

export const getUser = async(req,res,next)=>{
  const id= req.params.id;
  const user= await User.findById(id);

  if(!user){
    return res.status(400).send({
      success:false,
      message: "Invalid Id",
  });
}

  return res.status(200).send({
      success:true,
      user
  });
}


export const deleteUser= async(req,res)=>{
  try {
    const {id} = req.params;
  
    await User.findByIdAndDelete(id);

    invalidateCache({admin:true});

    return res.status(200).send({
      success:true,
      message: "User deleted successfully"
  });  
} catch (error) {
  return res.status(400).send({
    success:false,
    message:"Invalid Id",
});
   }
 }