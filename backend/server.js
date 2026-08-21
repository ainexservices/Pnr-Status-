import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import {
  configure,
  checkPNRStatus
} from "railkit";


dotenv.config();


const app=express();

app.use(cors());

app.use(express.json());


const PORT=process.env.PORT || 3000;


if(!process.env.RAILKIT_API_KEY){

console.error(
"RAILKIT_API_KEY is missing in .env"
);

process.exit(1);

}


configure(
process.env.RAILKIT_API_KEY
);


app.get("/",(req,res)=>{

res.json({

success:true,

service:"AINEX E Ticket",

message:"PNR API is running"

});

});


app.get("/api/pnr/:pnr",async(req,res)=>{

const pnr=req.params.pnr;


if(!/^\d{10}$/.test(pnr)){

return res.status(400).json({

success:false,

message:"PNR must contain exactly 10 digits."

});

}


try{

const result=await checkPNRStatus(pnr);


return res.json(result);


}catch(error){

console.error("PNR ERROR:",error);


return res.status(500).json({

success:false,

message:
"Unable to fetch PNR status. Please try again."

});

}

});


app.listen(PORT,()=>{

console.log(
`AINEX E Ticket backend running on port ${PORT}`
);

});
