
export const errorMiddleware=(err, req, res, next)=>{
  err.message||= "Internal Server Error";
  err.statusCode||= 500;

  return res.status(err.statusCode).send({
    success: false,
    message: err.message,
  })
}


export const TryCatch=(func)=>{
    return (req, res, next)=>{
       return Promise.resolve(func(req,res,next)).catch(next);
    }
}


