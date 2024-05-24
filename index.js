//import modules
const express = require("express"); //express for website
const session = require("express-session"); //manage sessions
const passport = require("passport"); //manage google signin
const mongoose = require("mongoose");// mongodb database
const TelegramBot = require("node-telegram-bot-api"); //manage telegram bot
const net = require("net"); //run tcp socket
const WebSocket = require("ws"); //run websocket
require("dotenv").config(); // dotenv

//static values
const SECRET = process.env.SECRET; //session secret
const MONGO_CONNECTION_STRING = process.env.MONGO_CONNECTION_STRING; // mongodb connection string
const password = process.env.PASSWORD; //admin verification password (telegram)
const token = process.env.TOKEN; //telegram bot token
const KEY = process.env.KEY; //encrypt&decrypt key
const TCP_PORT = process.env.TCP_PORT; //tcp socket port
const WS_PORT = process.env.WS_PORT; //websocket port
const HTTP_PORT = process.env.HTTP_PORT; //http express port

//innitializations 
const app = express(); //express initialization
mongoose.connect(MONGO_CONNECTION_STRING,{dbName:'controller'});//connect mongoose db

//values dynamic
const admins = {}; //store telegram admins
const devices = {}; //store websocket&tcp socket devices


//custom imports
const passportRunner = require("./Resources/Auth"); //import google signin auth js (custom)
const Routes = require("./Resources/Route")
const userSchema = require('./Resources/UserSchema');//mognoose schema
passportRunner.configurePassport(userSchema); //run passport google authentication
const socketFunctions = require("./Resources/ManageSocket"); //manage tcp/ws sockets
const manageTelegram = require("./Resources/ManageTelegramBot"); // manage telegram bots
const crypto = require("./Resources/Crypto"); //encode decode TOKEN

//middle wares
const isLoggedIn=(req,res,next)=>{req.user?next(): res.redirect("/")} //check logged in middle ware
app.use(express.static('Public'))
app.use(session({secret:SECRET,resave:false,saveUninitialized:true})); //session initialization
app.use(passport.initialize()); //passport initializatin
app.use(passport.session()); //passport session initialization
app.use('/',Routes(passport,isLoggedIn,userSchema)); //routes setup
app.use(isLoggedIn); //middleware

//inititalize & manage telegram bot
const bot = new TelegramBot(token,{polling:true}); //telegram bot
//manage telegram events
bot.onText(/\/start/,(msg)=>{manageTelegram.manageStart(msg,admins,bot)}); //manage /start
bot.onText(/\/status/,(msg)=>{manageTelegram.connectionStatus(msg,admins,bot)}); //manage /status
bot.onText(/\/stop/,(msg)=>{manageTelegram.stopConnection(msg,admins,bot)}); //manage /stop
bot.onText(/\/ping/,(msg)=>{}); //manage /ping
bot.onText(/\/devices/,(msg)=>{manageTelegram.showDevices(msg,admins,bot,devices)}); //manage /devices
bot.onText(/\/selected/,(msg)=>{manageTelegram.selectedClient(msg,admins,bot)}); //manage /devices
bot.on('message',(msg)=>{manageTelegram.manageMessage(msg,admins,bot,KEY,password,devices)}); //manage all messages

//handle socket message
const handleSocketMessage=(data,socket)=>{
    try{socketFunctions.newSocketConnection(JSON.parse(crypto.Decrypt(data.toString(),KEY)),admins,bot,devices,socket)} //manage new connection
    catch(e){
        console.log("here")
        socketFunctions.forwardMessage(data,admins,bot,socket,devices); //manage message
    }
}

//websocket
const wss = new WebSocket.Server({port:WS_PORT});
wss.on('listening',()=>{console.log(`Websocket server on port : ${WS_PORT}`)})
wss.on('connection',(socket)=>{
    socket.on('message',(data)=>{handleSocketMessage(data.toString(),socket)})
    socket.on('close',()=>socketFunctions.handleSocketClose(devices,socket,admins,bot))
});

//tcp
const tcpServer = net.createServer(socket=>{
    socket.on('data',(data)=>{handleSocketMessage(data,socket)});
    socket.on('error',()=>{socketFunctions.handleSocketClose(devices,socket,admins,bot)})
    socket.on('end',()=>{socketFunctions.handleSocketClose(devices,socket,admins,bot)})
})
tcpServer.listen(TCP_PORT,()=>{console.log(`tcp server on port : ${TCP_PORT}`)});


app.listen(HTTP_PORT,()=>{console.log(`HTTP running on port : ${HTTP_PORT}`)})