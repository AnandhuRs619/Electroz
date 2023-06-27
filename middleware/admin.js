const isAdmin = (req, res, next) => {
    if ( req.session.admin) {
        
        res.redirect('/admin/Dashboard')
    } else {
        next()
    }
}
const isLogOut =(req,res,next)=>{
    if(!req.session.admin){
        res.redirect('/admin/adminLogin');
    }else{
        next()
    }
}

module.exports = {
    isAdmin,
    isLogOut
}