const BACKEND_URL = "http://localhost:3000";


async function checkPNR(){

const input=document.getElementById("pnrInput");
const error=document.getElementById("error");
const button=document.getElementById("checkBtn");

const pnr=input.value.trim();

error.textContent="";


if(!/^\d{10}$/.test(pnr)){

error.textContent="Please enter a valid 10-digit PNR number.";

input.focus();

return;

}


button.disabled=true;
button.textContent="⏳ Checking...";


try{

const response=await fetch(
`${BACKEND_URL}/api/pnr/${pnr}`
);

const result=await response.json();


if(!response.ok || !result.success){

throw new Error(
result.message || "Unable to fetch PNR status"
);

}


showResult(result.data);


}catch(err){

console.error(err);

error.textContent=
err.message || "PNR service unavailable.";

}


button.disabled=false;
button.textContent="🔍 Check Status";

}


function showResult(data){

const old=document.getElementById("pnrResult");

if(old) old.remove();


const train=data.train || {};
const journey=data.journey || {};
const passengers=data.passengers || [];


const section=document.createElement("section");

section.id="pnrResult";

section.className="pnr-result";


const passengerHTML=passengers.map((p,index)=>`

<div class="passenger">

<strong>Passenger ${index+1}</strong>

<span>
Booking:
${p.booking?.details || p.booking?.status || "-"}
</span>

<span>
Current:
${p.current?.details || p.current?.status || "-"}
</span>

</div>

`).join("");


section.innerHTML=`

<div class="result-head">

<div>

<small>PNR Number</small>

<div class="pnr-number">
${data.pnr || "-"}
</div>

</div>

<div class="status-badge">
${data.status || "AVAILABLE"}
</div>

</div>


<div class="train-title">

🚆 ${train.number || "-"}
-
${train.name || "Train"}

</div>


<div class="result-grid">


<div class="result-item">

<small>Journey Date</small>

<b>
${journey.date || "-"}
</b>

</div>


<div class="result-item">

<small>From</small>

<b>
${journey.source?.name || "-"}
</b>

</div>


<div class="result-item">

<small>To</small>

<b>
${journey.destination?.name || "-"}
</b>

</div>


<div class="result-item">

<small>Class</small>

<b>
${journey.class || "-"}
</b>

</div>


<div class="result-item">

<small>Chart Status</small>

<b>
${data.chartStatus || "-"}
</b>

</div>


<div class="result-item">

<small>Passengers</small>

<b>
${passengers.length}
</b>

</div>


</div>


<div class="passengers">

<h3>Passenger Status</h3>

${passengerHTML || "<p>No passenger information available.</p>"}

</div>

`;


document.querySelector("main").appendChild(section);


section.scrollIntoView({
behavior:"smooth"
});

}
