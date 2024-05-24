const mongoose = require("mongoose")

const connectionSchema = new mongoose.Schema({
    username:{type:String,require:true},
    email:{type:String,require:true},
    premiumUser:{type:Boolean,require:true},
    picture:{type:String},
    joinDate:{type:Number},
    lastLoginDate:{type:Number},
    maxDevices:{type:Number},
    adminToken:{type:String},
    clientTokens:{type:Array},
    maxRequests:{type:Number},
    planName:{type:String}

})

const ConnectionModel = mongoose.model("elsocketUsers",connectionSchema)
module.exports =ConnectionModel