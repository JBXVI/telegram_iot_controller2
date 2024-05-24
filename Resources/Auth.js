const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2");
const crypto = require("./Crypto")
const GOOGLE_CLIENT_ID = `10329065596-3rooq82ogfmjk08qiddh3sv2c16hhqo1.apps.googleusercontent.com`
const GOOGLE_CLIENT_SECRET = `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`
const PASSWORD = process.env.PASSWORD;
const KEY = process.env.KEY;
const CALLBACK_URL = process.env.CALLBACK_URL;

const AddOrUpdateToDatabase=async(name,email,picture,maxDevices,UserSchema)=>{
    const user = await UserSchema.findOne({email:email}).exec(); //check if user exists
    if(user){ //if user exists
        const data = await UserSchema.findOneAndUpdate({email:email},{lastLoginDate:Date.now()}).exec(); //update last login time
        if(data){
            return {success:true,message:"updated existing user"}
        }
    }else{ //if user doesn't exists
        const newUser = new UserSchema({
            username:name,
            email:email,
            premiumUser:false,
            picture:picture,
            joinDate:Date.now(),
            lastLoginDate:Date.now(),
            maxDevices:maxDevices,
            adminToken:"",
            clientTokens:[],
            maxRequests:1000,
            planName:"--"

        });
        const adminToken = crypto.Encrypt(`{"uname":"${newUser._id.toString()}","password":"${PASSWORD}","admin":true}`,KEY); //admin telegram connection token
        const clientTokens = []; //store client ws/tcp tokens

        //store each devices
        for(i=1;i<=maxDevices;i++){
            let clientName = `_client${i}@${newUser._id.toString()}`
            let tokenModel =  crypto.Encrypt(`{"uname":"${clientName}","ref":"${newUser._id.toString()}"}`,KEY);
            clientTokens.push({uname:clientName,token:tokenModel})
        }

        newUser.adminToken = adminToken; //adding admin token
        newUser.clientTokens = clientTokens; //addmin client/devices tokens 
        await newUser.save(); //save to database
        return {success:true,message:"created new user"}

    }
}

const configurePassport=(UserSchema)=>{
    passport.use(new GoogleStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: CALLBACK_URL,
        passReqToCallback: true,
      },
      async function(request, accessToken, refreshToken, profile, done) {
        const name = profile.given_name
        const email = profile.email
        const picture = profile.picture;
        const maxDevices = 5;
        AddOrUpdateToDatabase(name,email,picture,maxDevices,UserSchema);//add or update the user function
        return done(null, profile);
      }));
      
      passport.serializeUser(function(user, done) {
        done(null, user);
      });
      
      passport.deserializeUser(function(user, done) {
        done(null, user);
      });
    return configurePassport
}

module.exports = {configurePassport};