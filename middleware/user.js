
const isLogin = (req, res, next) => {
    if (req.session.user) {
   
        res.redirect('/')
    } else {
        next()
    }
}
const isLogOut =(req,res,next)=>{
    if(!req.session.user){
        res.redirect('/login');
    }else{
        next()
    }
}


module.exports = {
    isLogin,
    isLogOut
}