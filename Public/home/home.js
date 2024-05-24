const username = document.getElementById("name");
const email = document.getElementById("email");
const maxDev = document.getElementById("maxDev");
const planName = document.getElementById("planName");
const joinDate = document.getElementById("joinDate");
const profilePic = document.getElementById("profilePic");
const adminTokenInput = document.getElementById("adminTokenInput");
const devices = document.getElementById("devices");
const logout = document.getElementById("logout");




const getData=async()=>{
    const response = await axios.post('/getData',{});
    if(response.data.success === true){
        const data = response.data.data;
        username.innerText = data.username;
        email.innerText = data.email;
        maxDev.innerText = data.maxDevices;
        planName.innerText = data.planName;
        joinDate.innerText = new Date(data.joinDate).toLocaleDateString();
        profilePic.src = data.picture;
        adminTokenInput.value = data.adminToken;
        devices.innerHTML = ``;

        for(i=1;i<=(data.clientTokens).length;i++){
            devices.innerHTML+=`<div class="input-group mb-3" ><span class="input-group-text groupTitle">Client${i}</span><input type="text" class="form-control tokenInput"  aria-describedby="basic-addon3" value="${data.clientTokens[i-1].token}" disabled></div>`
        }

    }
}
getData()

logout.addEventListener('click',async()=>{
    const response = await axios.post('/logout',{});
    if(response.data.success === true){
        window.location.href = "/";
    }
})