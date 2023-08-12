
const User = require('../models/userSchema')

const isLogin = (req, res, next) => {
    if (req.session.user) {
   
        res.redirect('/home')
    } else {
        next()
    }
}
const isLogOut = async (req, res, next) => {
    if (!req.session.user) {
        res.redirect('/login');
    } else {
        
        const userData = await User.findById(req.session.user);

        if (userData && userData.isBlocked==true) {
            return res.render("userSide/userLogin", {
                message: "Your account is blocked. Please contact support.",
            });
        }

        next();
    }
};


module.exports = {
    isLogin,
    isLogOut
}