import {S3Client, DeleteObjectCommand} from '@aws-sdk/client-s3'
import multer from 'multer';
import multerS3 from 'multer-s3'



const s3Client = new S3Client({
    region: process.env.AWS_OBJECT_STORAGE_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  export const uploadHandler = multer({
    storage : multerS3({
        s3: s3Client,
        bucket: process.env.AWS_BUCKET_NAME,

        metadata: (req, file, cb) => {
            cb(null, { fieldName: "photo" });
          },
          key: (req, file, cb) => {
            cb( null,Date.now().toString() + "_" +  file.originalname);
          },
    })
  });

  export const deleteFileFromObjectStorage = (path)=>{
    const deleteCommand = new DeleteObjectCommand({
      Bucket: 'yashbuck1',
      Key:path,
    });

    s3Client.send(deleteCommand)
    .then(()=>console.log("deleted successfully"))
    .catch((e)=> console.log(`error: ${e.message}`))
  }

  