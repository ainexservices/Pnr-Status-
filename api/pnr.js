import { configure, checkPNRStatus } from "railkit";


export default async function handler(req,res){

const pnr = req.query?.pnr;


if(!pnr || !/^\d{10}$/.test(pnr)){

return res.status(400).json({

success:false,

message:"Please enter a valid 10-digit PNR number."

});

}


if(!process.env.RAILKIT_API_KEY){

return res.status(500).json({

success:false,

message:"RailKit API key is not configured."

});

}


try{

configure(
process.env.RAILKIT_API_KEY
);


const result =
await checkPNRStatus(pnr);


return res.status(200).json(result);


}catch(error){

console.error(
"RailKit Error:",
error
);


return res.status(500).json({

success:false,

message:
"Unable to fetch PNR status right now."

});

}

}
