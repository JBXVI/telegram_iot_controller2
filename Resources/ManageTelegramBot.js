const crypto = require("./Crypto"); //crypt module (custom)

//manage start : requests token if not not yet verified
const manageStart=(msg,admins,bot)=>{
    const id = msg.chat.id; //user id
    /*messages*/ let enterTokenMsgs = ["Hola! Please enter your TOKEN below.", "Paste Your Token  here 👇.","Please Paste your TOKEN .","you have a TOKEN ? please send it ."];
    /*messages*/ let connectedAlreadyMsgs = ["Looks like you are already Connected.","Already Connected !!","We're Connnected ,use /stop to logout .","Hey! its connected."];
    let randomNumber=Math.floor(Math.random() * 3) + 1; //random number to select random response
    if(admins[id]==undefined){bot.sendMessage(id,enterTokenMsgs[randomNumber])}//if user is verified
    else{bot.sendMessage(id,connectedAlreadyMsgs[randomNumber])}; //if user ain't verified
}

//manage /devices
const showDevices=(msg,admins,bot,devices)=>{
    const id = msg.chat.id; //user id

    //if the id in admin list
    if(admins[id]!==undefined){
        let adminUname = admins[id].uname; //admin username
        let availableClients = Object.keys(devices).filter(user=>devices[user].ref === adminUname); //available devices in devices list (available for admin)
        //if devices list is 0
        if(availableClients.length <1){
            bot.sendMessage(id,"No devices available");
        }
        //if there are devices in devices list
        else{
            //custom keyboard menus
            const options = {
                reply_markup: {
                    keyboard: [
                        availableClients
                    ],
                    resize_keyboard: true, // Allow Telegram to resize the keyboard dynamically
                },
            };
            bot.sendMessage(id,"Please select a client : ",options);
        }
    }
}

//manage /status
const connectionStatus=(msg,admins,bot)=>{
    const id = msg.chat.id; //user id
    /*messages*/  let connectedmsgs = ["You're Connected.","we're Connected.","Connection is still Alive.","Connected!! Ready to control devices. "];
    /*messages*/  let notConnectedMsgs =["Not Connected. ","Sorry! You aren't Connected. ","No Connection, Please Paste your TOKEN here to Connect. ","We are not Connected. "];
    let randomNumber=Math.floor(Math.random() * 3) + 1; //random number to select random response
    //if user in admin list
    if(admins[id]){
        bot.sendMessage(id,connectedmsgs[randomNumber]);
    }
    //if user is not in admin list
    else{
        bot.sendMessage(id,notConnectedMsgs[randomNumber]);
    }
}

//manage /selected
const selectedClient=(msg,admins,bot)=>{
    id = msg.chat.id; //user id
    if(admins[id].ref){
        bot.sendMessage(id,`Selected Device : ${admins[id].ref}.`)
    }
    else{
        bot.sendMessage(id,`No Device were Selected. use /devices to select one`)
    }
}


//manage /stop
const stopConnection=(msg,admins,bot)=>{
    const id = msg.chat.id; //user id
    /*messages*/ let disconnectedMsgs =["You're now Logged out. ","Disconnected Successfully. ","You're No More Connected. ","Adios Amigo! Logged out."];
    /*messages*/ let werentConnectedMsgs =["You're not Connected. ","BTW , You were'nt even Connected. ","You should be Connected to be disconnected. ","Connect First!!"];
    let randomNumber=Math.floor(Math.random() * 3) + 1; //random number to select random response
    try{
        //id user is connected
        if(admins[id]){
            delete admins[id]; //delete user from admin list
            bot.sendMessage(id,disconnectedMsgs[randomNumber]); //send success message to user
        }else{
            bot.sendMessage(id,werentConnectedMsgs[randomNumber]) //send werent connected message to user
        }
    }
    catch(e){
        //for any error , send error message to user
        bot.sendMessage(id,`An Error Occured While Doing that`)
    }
}

//manage message : including verif& add admin, forward message to tcp/ws client, forward to telegram bot
const manageMessage=(msg,admins,bot,key,password,devices)=>{
    id = msg.chat.id; //user id

    //if user is not in admin list
    if(admins[id]===undefined){
        /*messages*/ let invalidTokenMsgs = ["Looks like the TOKEN is Invalid! 😔.","Please re-check your TOKEN .","Enter a valid TOKEN. 😐", "TOKEN ain't working ."];
        /*messages*/ let connectedSuccessfullyMsgs =["¡Felicidades! You're Connected.","Bravo! We're Connected 🥳","Connected!! Happy Controlling . ","Excellent!! We are now Connected ."];
        let randomNumber=Math.floor(Math.random() * 3) + 1; //random number to select random response
        
        try{//check if user entered token or another data
            const  connectionString = JSON.parse(crypto.Decrypt(msg.text,key)); //decrypt user token
            //if user is eligible to be admin
            if(connectionString.uname && connectionString!="" && connectionString.password === password){
                admins[id]={uname:connectionString.uname,time: new Date().toLocaleTimeString(),ref:undefined}; //adding user to admin
                bot.sendMessage(id,connectedSuccessfullyMsgs[randomNumber]); //sending random success message to user
                bot.sendMessage(id,"To avoid token from being stolen, please clear screen once connected .")
            }
            //if user is not eligible to be admin
            else{
                bot.sendMessage(id,invalidTokenMsgs[randomNumber]); //sending random invalid token messages
            }
        }
        catch(e){
            let systemtags = ["/start","/ping","/status","/stop","/devices","/selected"]; //system reserved keywords
            //if message is not any system tags
            if(!systemtags.includes(msg.text)){
                bot.sendMessage(id,invalidTokenMsgs[randomNumber]);//sending random invalid token messages
            }
        }
    }
    //if user is in admin list
    else{
        let systemtags = ["/start","/ping","/status","/stop","/devices","/selected"]; //system tags
        //if message is not any system tags
        if(!systemtags.includes(msg.text)){
            
            //on client selection : client format example >> _client9@xv
            let clientSelectionRegex = /_(\w+)@(\w+)/; //regex to check if user is selecting a client or not
            if(clientSelectionRegex.test(msg.text)){
                //check if client exists and if client is owned by user/admin
                if(devices[msg.text] && devices[msg.text].ref === admins[id].uname){
                    admins[id].ref = msg.text; //set selected client as admin ref
                    bot.sendMessage(id, `Selected : ${msg.text} .`); // send the selected client message to user/admin
                }
                //if client doesnt exists or client isn't owned by user/admin
                else{
                    bot.sendMessage(id, `${msg.text} is not available .`)
                }
            }
            //if it is a client sendable message
            else{
                //if user/admin selected a client
                if(admins[id].ref){
                    //if the selected device is available right now
                    if(devices[admins[id].ref]){
                        let selectedDevice = admins[id].ref; //selected device
                        let selectedSocket = devices[selectedDevice].socket; //socket of the selected device
                        try{
                            if(typeof msg.text==="string"){
                                selectedSocket.send(msg.text); //send message to socket ws method
                                bot.sendMessage(id,"Sent")
                            }else{
                                bot.sendMessage(id,"Only Text allowed")
                            }
                            
                        }catch(e){try{
                            selectedSocket.write(msg.text); //send message to socket tcp method
                            bot.sendMessage(id,"✔✔")
                        }catch(e){
                            bot.sendMessage(id,`Couldnt send Message to device ${selectedDevice}`); 
                        }}
                    }
                    //if selected device is not available
                    else{
                        bot.sendMessage(id,`User ${admins[id].ref} is not available right now . use /devices to view available device`)
                    }
                }
                else{
                    bot.sendMessage(id,`Select a device first. use /devices to view available devices.`)
                }

            }
        }
    }
}



module.exports = {manageStart,manageMessage,showDevices,stopConnection,connectionStatus,selectedClient};