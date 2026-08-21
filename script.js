const input=document.getElementById("pnrInput");
const btn=document.getElementById("checkBtn");
const msg=document.getElementById("message");

function showMsg(text,type="error"){
  msg.className=type;
  msg.textContent=text;
  msg.style.display="block";
}

input.addEventListener("input",()=>{
  input.value=input.value.replace(/\D/g,"").slice(0,10);
  msg.style.display="none";
});

async function checkPNR(){
  const pnr=input.value.trim();

  if(!/^\d{10}$/.test(pnr)){
    showMsg("Please enter a valid 10-digit PNR.");
    input.focus();
    return;
  }

  btn.disabled=true;
  btn.textContent="⏳ Checking...";

  try{
    const response=await fetch(`/api/pnr?pnr=${encodeURIComponent(pnr)}`);
    const text=await response.text();

    let data;
    try{data=JSON.parse(text)}
    catch{throw new Error("Server response is not valid JSON.")}

    if(!response.ok || data.success===false){
      throw new Error(data.message||data.error||"Unable to fetch PNR status.");
    }

    showMsg("✓ PNR status fetched successfully.","success");

    const old=document.querySelector(".result");
    if(old)old.remove();

    const result=document.createElement("div");
    result.className="result";

    const passengers=data.passengers||data.Passengers||[];
    const train=data.trainName||data.TrainName||"-";
    const number=data.trainNumber||data.TrainNumber||"-";
    const from=data.from||data.From||"-";
    const to=data.to||data.To||"-";
    const status=data.status||data.Status||"";

    result.innerHTML=`
      <h3>PNR Details</h3>
      <div class="result-grid">
        <div><small>PNR</small><b>${pnr}</b></div>
        <div><small>Train</small><b>${number}</b></div>
        <div><small>Train Name</small><b>${train}</b></div>
        <div><small>From</small><b>${from}</b></div>
        <div><small>To</small><b>${to}</b></div>
        <div><small>Status</small><b>${status||"Available"}</b></div>
      </div>
      ${passengers.length?`
      <div style="margin-top:12px">
        <b>Passenger Status</b>
        ${passengers.map((p,i)=>`
          <div style="padding:8px 0;border-bottom:1px solid #e8edf3;font-size:12px">
            Passenger ${i+1}: 
            ${p.currentStatus||p.CurrentStatus||p.status||p.Status||"-"}
          </div>`).join("")}
      </div>`:""}
    `;

    document.querySelector(".pnr-card").appendChild(result);
    result.scrollIntoView({behavior:"smooth",block:"nearest"});

  }catch(error){
    showMsg(error.message||"Something went wrong.");
  }finally{
    btn.disabled=false;
    btn.textContent="🔍 Check Status";
  }
}

btn.addEventListener("click",checkPNR);

input.addEventListener("keydown",e=>{
  if(e.key==="Enter")checkPNR();
});
