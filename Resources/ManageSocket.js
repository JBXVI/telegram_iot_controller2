//new connection setup
const newSocketConnection=(jsonData,admins,bot,devices,socket)=>{
    //if the connection have both uname and ref
    if(jsonData.uname !=null && jsonData.ref !=null){
        let telegram_ref_id = null
        devices[jsonData.uname] = {socket:socket,ref:jsonData.ref,time:new Date().toLocaleTimeString()}; //setting new connection (devices)
        try{telegram_ref_id = Object.keys(admins).filter(user=>admins[user].uname === jsonData.ref)[0]}catch(e){telegram_ref_id = null} //getting telegram user's (ref of device) id
        if(telegram_ref_id!=null){bot.sendMessage(telegram_ref_id,`New Connection : ${(jsonData.uname)}. `)}; //inform new connection message to telegram admin (if exists)
    }
}

//handle socket close
const handleSocketClose=(devices,socket,admins,bot)=>{
    try{
        let telegram_ref_id = null
        const clientName = Object.keys(devices).find(key => devices[key].socket === socket); //get the name of client (device) which is disconnecting
        
        try{telegram_ref_id = Object.keys(admins).filter(user=>admins[user].uname === devices[clientName].ref)[0]}catch(e){telegram_ref_id = null;console.log(e)}
        delete devices[clientName]; //remove the disconnected client from devices list
        if(telegram_ref_id!=null){bot.sendMessage(telegram_ref_id,`Device Disconnected : ${(clientName)}. `)}// inform disconnection message to telegram admin (if exists)

    }catch(e){
        return false
    }
}

//forward message (from tcp/ws socket to telegram)
const forwardMessage=(data,admins,bot,socket,devices)=>{
    let telegram_ref_id = null;
    const clientName = Object.keys(devices).find(key => devices[key].socket === socket);//get the name of client (device) which is sending message
    try{telegram_ref_id = Object.keys(admins).filter(user=>admins[user].uname === devices[clientName].ref)[0]}catch(e){telegram_ref_id = null}
    if(telegram_ref_id!=null){
        bot.sendMessage(id,`Got data from ${clientName}.`); //sending client name to telegram admin (if exists)
        bot.sendMessage(id,data); //sending data to telegram admin (if exists)
    }

}

module.exports = {newSocketConnection,handleSocketClose,forwardMessage}