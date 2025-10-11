const businessModel = require("../models/businessCard");
const subscriptionModel = require("../models/subscription");
const userModel = require("../models/user");
const jwt=require('jsonwebtoken')

module.exports.login=async(req,res)=>{
    let {userName,password}=req.body;
    try{
let userNameMatch=await userModel.findOne({userName})
if(!userName){
    return res.status(400).json({
        error:"No user found"
    })
}

let passwordMatch=await userModel.findOne({password})

if(!passwordMatch){
    return res.status(400).json({
        error:"Invalid password"
    })
}
userNameMatch=userNameMatch.toObject();
let token=await jwt.sign(userNameMatch,"FDSFSDJGJFDJGDJJJ#J$J#$J#J$#J$#$#$!$#$#$#!#%^&")

return res.status(200).json({
    user:userNameMatch,
    token
})

    }catch(e){
        console.log(e.message)
        return res.status(400).json({
            error:"Error occured while trying to login"
        })
    }
}




module.exports.updatePassword=async(req,res)=>{
    let {userName,newPassword}=req.body;
  console.log(userName)
    try{
let user=await userModel.findOne({userName})
console.log("USER IS PASSWORD")
console.log(user)
if(!user){
    return res.status(400).json({
        error:"No user name found"
    })
}

await userModel.updateOne({userName},{
    $set:{
        password:newPassword
    }
})
return res.status(200).json({
    message:"Password updated successfully"
})

    }catch(e){
        console.log(e.message)
        return res.status(400).json({
            error:"Error occured while updating password"
        })
    }
}

module.exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const stripe = require('stripe')(process.env.STRIPE_LIVE);

        // 1️⃣ Rename user
        await userModel.findByIdAndUpdate(id, {
            $set: {
                userName: `deleteduser-${id}`
            }
        }, { new: true });

        // 2️⃣ Rename business
        await businessModel.updateOne({
            $expr: {
                $eq: [{ $toString: "$user" }, id]
            }
        }, {
            $set: {
                businessName: `deletedBusiness-${id}`
            }
        });

        // 3️⃣ Get user with subscription populated
        const user = await userModel.findById(id).populate('subscription');

        // 4️⃣ If active subscription → cancel on Stripe and update DB
        if (user?.subscription?.status === 'active') {
            await stripe.subscriptions.cancel(user.subscription.subscriptionId);

            await subscriptionModel.findByIdAndUpdate(user.subscription._id, {
                $set: {
                    status: 'cancelled'
                }
            });
        }

        // 5️⃣ Remove subscription reference from user
        await userModel.findByIdAndUpdate(id, {
            $unset: { subscription: "" }
        });

        return res.status(200).json({
            message: 'User deleted successfully'
        });

    } catch (e) {
        console.log(e.message);
        return res.status(400).json({
            error: "Error occurred while deleting user"
        });
    }
};
