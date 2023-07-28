// const userModel = require('../../models/userSchema');
// const orderModel = require('../../models/OderSchema');


// const userProfile = async (req,res)=>{
//     try{
//         const userId = req.session.user;
//         const userDetails = await userModel.findById({_id: userId});
//         const userAddress = userDetails.address;
//         res.render('userSide/UserProfile',{ userAddress });

//     } catch (error) {
//     console.log(error);
//   }
// };

// const addAddress = async(req,res)=>{
//     try{
//         const UserId = req.session.user;
//         const {name,addressline,street,city,state,phone,country } = req.body;
//         await userModel.findbyIdAndUpdate(
//             {_id: UserId},
//             {
//                 $push:{
//                     address :{name,addressline,street,city,state,phone,country}
//                 }
//             }
//             );
//             res.redirect("/profile");
//     } catch (error) {
//     console.log(error);
//   }
// } 




// module.exports ={
//     userProfile,
//     addAddress,


// }