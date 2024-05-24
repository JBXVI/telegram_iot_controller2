const express = require("express"); //express
const router = express.Router(); //routes
const path = require("path");//path

module.exports=(passport,isLoggedIn,UserSchema)=>{
    //login screen
    router.get('/', (req, res) => {
        if(req.user){
            res.redirect('/protected')
        }else{
            res.sendFile(path.join(__dirname,"..","Public","login","login.html"))
        }
       // res.send('<a href="/auth/google">Authenticate with Google</a>');
    });

    ///google auth 1st step
    router.get('/auth/google',passport.authenticate('google', { scope: [ 'email', 'profile' ] }));

    ///google auth 2nd step
    router.get( '/auth/google/callback',passport.authenticate( 'google', {successRedirect: '/protected',failureRedirect: '/auth/google/failure'}));

    //protected page
    router.get('/protected', isLoggedIn, async(req, res) => {
        res.sendFile(path.join(__dirname,"..","Public","home","home.html"))
    });

    //logout user
    router.get('/logout', (req, res) => {req.logout();req.session.destroy();res.send('Goodbye!');});

    //google signin failure route
    router.get('/auth/google/failure', (req, res) => {res.send('Failed to authenticate..');});

    //get user data
    router.post('/getData',isLoggedIn,async(req,res)=>{
        const email = req.user.email;
        const name = req.user.given_name;
        const data = await UserSchema.findOne({email:email,username:name}).exec()
        res.json({"success":true,"data":data})
    })

    //logout user
    router.post('/logout',isLoggedIn,async(req,res)=>{
        req.session.destroy(err=>{
            if(err){
                res.json({"success":false,"error":err})
            }else{
                res.json({"success":true})
            }
        })
    });

    //for any other
    router.get('*',(req,res)=>{
        if(req.user){
            res.redirect('/protected')
        }else{
            res.redirect('/')
        }
    })

    return router;
}