const input = document.getElementById("pnrInput");
const button = document.getElementById("checkBtn");
const error = document.getElementById("error");
const resultBox = document.getElementById("resultBox");


button.addEventListener("click", checkPNR);


input.addEventListener("keypress", function(e){

if(e.key === "Enter"){
checkPNR();
}

});


async function checkPNR(){

const pnr = input.value.trim();

error.textContent = "";
resultBox.innerHTML = "";


if(!/^\d{10}$/.test(pnr)){

error.textContent =
"Please enter a valid 10-digit PNR number.";

return;

}


button.disabled = true;
button.textContent = "⏳ Checking...";


try{

const response = await fetch(
"/api/pnr?pnr=" + encodeURIComponent(pnr)
);


const result = await response.json();


if(!response.ok || !result.success){

throw new Error(
result.message || "Unable to fetch PNR status."
);

}


showResult(result.data);


}catch(err){

console.error(err);

error.textContent =
err.message || "Failed to fetch PNR status.";

}


button.disabled = false;
button.textContent = "🔍 Check Status";

}


function showResult(data){

const train = data?.train || {};
const journey = data?.journey || {};
const passengers = data?.passengers || [];


const source =
journey?.source?.name ||
journey?.source?.code ||
"-";


const destination =
journey?.destination?.name ||
journey?.destination?.code ||
"-";


const passengerHTML = passengers.length

? passengers.map((p,i)=>`

<div class="passenger">

<strong>
Passenger ${i + 1}
</strong>

<span>
Booking:
${p?.booking?.details ||
p?.booking?.status ||
"-"}
</span>

<span>
Current:
${p?.current?.details ||
p?.current?.status ||
"-"}
</span>

</div>

`).join("")

: "<p>No passenger information available.</p>";


resultBox.innerHTML = `

<section class="result">

<div class="result-head">

<div>

<small>PNR Number</small>

<div class="pnr">
${data?.pnr || "-"}
</div>

</div>

<div class="status">
${data?.status || "AVAILABLE"}
</div>

</div>


<div class="train">

🚆 ${train?.number || "-"}
-
${train?.name || "Train"}

</div>


<div class="grid">

<div class="item">
<small>Journey Date</small>
<b>${journey?.date || "-"}</b>
</div>


<div class="item">
<small>From</small>
<b>${source}</b>
</div>


<div class="item">
<small>To</small>
<b>${destination}</b>
</div>


<div class="item">
<small>Class</small>
<b>${journey?.class || "-"}</b>
</div>


<div class="item">
<small>Chart Status</small>
<b>${data?.chartStatus || "-"}</b>
</div>


<div class="item">
<small>Passengers</small>
<b>${passengers.length}</b>
</div>

</div>


<div class="passengers">

<h3>Passenger Status</h3>

${passengerHTML}

</div>

</section>

`;


resultBox.scrollIntoView({
behavior:"smooth"
});

     }
