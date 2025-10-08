const adminModel = require("../models/admin");
const businessModel = require("../models/businessCard");
const reviewsModel = require("../models/reviews");
const subscriptionModel = require("../models/subscription");
const userModel = require("../models/user");
const jwt=require('jsonwebtoken')

module.exports.updateUser=async(req,res)=>{
    let {...data}=req.body;
    try{
await userModel.findByIdAndUpdate(data.userId,{
    $set:data
})

    }catch(e){
console.log(e.message)
return res.status(400).json({
    error:"Error occured while updating user"
})
    }
}





module.exports.deleteUser=async(req,res)=>{
    let {businessId,userId}=req.params;
    try{
const stripe = require('stripe')(process.env.STRIPE_LIVE); 
await businessModel.findByIdAndDelete(businessId)
await userModel.findByIdAndDelete(userId)
let subscription=await subscriptionModel.findOne({user:userId})
 await stripe.subscriptions.cancel(
subscription.subscriptionId
  );

await subscriptionModel.deleteOne({user:userId})

return res.status(200).json({
    message:"Business deleted sucessfully"
})
    }catch(e){
console.log(e.message)
return res.status(400).json({
    error:"Error occured while updating user"
})
    }
}




module.exports.updateUser=async(req,res)=>{
    let {...data}=req.body;
    try{
await userModel.findByIdAndUpdate(data.userId,{
    $set:data
})
return res.status(200).json({
    message:"User updated sucessfully"
})
    }catch(e){
console.log(e.message)
return res.status(400).json({
    error:"Error occured while updating user"
})
    }
}





module.exports.getUsers=async(req,res)=>{
 
    try{
let users=await userModel.find({}).populate('business')
return res.status(200).json({
  users
})
    }catch(e){
console.log(e.message)
return res.status(400).json({
    error:"Error occured while updating user"
})
    }
}


module.exports.getReviews=async(req,res)=>{
    try{
        let reviews = await reviewsModel.find({reviewBy:{$exists:true,$ne:[]}})
        .populate({
          path: 'business',      
          populate: {
            path: 'user',        
            model: 'user'        
          }
        });
      
return res.status(200).json({
   reviews
})
    }catch(e){
        console.log(e.message)
return res.status(400).json({
    error:"Error occured while fetching reviews"
})
    }
}






module.exports.deleteBusiness=async(req,res)=>{
    let {businessId,userId}=req.params;
    try{
const stripe = require('stripe')(process.env.STRIPE_LIVE); 
await businessModel.findByIdAndDelete(businessId)
await userModel.findByIdAndDelete(userId)
let subscription=await subscriptionModel.findOne({user:userId})
 await stripe.subscriptions.cancel(
subscription.subscriptionId
  );

await subscriptionModel.deleteOne({user:userId})

return res.status(200).json({
    message:"Business deleted sucessfully"
})
    }catch(e){
console.log(e.message)
return res.status(400).json({
    error:"Error occured while updating user"
})
    }
}



module.exports.updateBusiness=async(req,res)=>{
    let {...data}=req.body;
    let {businessId}=req.params
    try{
        if (req.file) {
            console.log('File received:', req.file.path);
          
            const cloudinaryResult = await cloudinaryUploadImage(req.file.path);
            
            if (cloudinaryResult.url) {
             
                data.photo = cloudinaryResult.url;
                console.log('Image uploaded to Cloudinary:', cloudinaryResult.url);
                
                
                fs.unlinkSync(req.file.path);
            } else {
                throw new Error('Failed to upload image to Cloudinary');
            }
        }

await businessModel.findByIdAndUpdate(businessId,{
    $set:data
})


return res.status(200).json({
    message:"business updated sucessfully"
})

    }catch(e){
        console.error(e);
        return res.status(400).json({
          error: "Error occurred while updating your business. Please try again."
        });
    }
}


module.exports.register=async(req,res)=>{
let {email,password}=req.body;
    try{
let adminAlredyExists=await adminModel.findOne({email})
if(adminAlredyExists){
    return res.status(400).json({
        error:"Admin already exists"
    })
}

     let admin=await adminModel.create({
            password,
            email
        })

        admin=admin.toObject();

        let token=await jwt.sign(admin,"FDSFSDJGJFDJGDJJJ#J$J#$J#J$#J$#$#$!$#$#$#!#%^&")

        return res.status(200).json({
            message:"Admin created sucessfully",
            token
        })


    }catch(e){
        console.error(e);
        return res.status(400).json({
          error: "Error occurred while registering admin. Please try again."
        });
    }
}



module.exports.login=async(req,res)=>{
    let {email,password}=req.body;
        try{
    
         let adminFound=await adminModel.findOne({email})
         if(!adminFound){
            return res.status(400).json({
                error:"Invalid email"
            })
         }

         let passwordMatch=await adminModel.findOne({password})

         if(!passwordMatch){
            return res.status(400).json({
                error:"Invalid password"
            })
         }
adminFound=adminFound.toObject();
         let token=await jwt.sign(adminFound,"FDSFSDJGJFDJGDJJJ#J$J#$J#J$#J$#$#$!$#$#$#!#%^&")
    
            return res.status(200).json({
                message:"Admin loggedin sucessfully",
                token
            })
    
    
        }catch(e){
            console.error(e);
            return res.status(400).json({
              error: "Error occurred while registering admin. Please try again."
            });
        }
    }







    
module.exports.getAnalyticsReviews = async(req, res) => {
    try {
     
      
        let reviews = await reviewsModel.find({})
            .populate('business')
            .populate('reviewBy')
            .sort({createdAt: -1}); 

        const totalReviews = reviews.length;
        
  
        const avgRating = totalReviews > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
            : 0;

      
        const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
            rating,
            count: reviews.filter(r => r.rating === rating).length
        }));

       
        const sourceCounts = reviews.reduce((acc, review) => {
            const source = review.source || 'direct';
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {});

        const trafficSources = Object.entries(sourceCounts).map(([name, count]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            count,
            percentage: ((count / totalReviews) * 100).toFixed(1)
        }));

      
        const monthlyData = {};
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
            monthlyData[monthKey] = 0;
        }

        reviews.forEach(review => {
            const monthKey = new Date(review.createdAt).toLocaleString('en-US', { 
                month: 'short', 
                year: 'numeric' 
            });
            if (monthlyData.hasOwnProperty(monthKey)) {
                monthlyData[monthKey]++;
            }
        });

        const monthlyComparison = Object.entries(monthlyData).map(([month, count]) => ({
            month,
            count
        }));

   
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const currentMonthReviews = reviews.filter(r => {
            const reviewDate = new Date(r.createdAt);
            return reviewDate.getMonth() === currentMonth && 
                   reviewDate.getFullYear() === currentYear;
        }).length;

        const lastMonthDate = new Date();
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
        const lastMonth = lastMonthDate.getMonth();
        const lastMonthYear = lastMonthDate.getFullYear();

        const lastMonthReviews = reviews.filter(r => {
            const reviewDate = new Date(r.createdAt);
            return reviewDate.getMonth() === lastMonth && 
                   reviewDate.getFullYear() === lastMonthYear;
        }).length;

        const growthRate = lastMonthReviews > 0
            ? (((currentMonthReviews - lastMonthReviews) / lastMonthReviews) * 100).toFixed(1)
            : currentMonthReviews > 0 ? 100 : 0;

    
        const performanceData = {};
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        reviews.forEach(review => {
            const reviewDate = new Date(review.createdAt);
            if (reviewDate >= thirtyDaysAgo) {
                const dateKey = reviewDate.toISOString().split('T')[0];
                performanceData[dateKey] = (performanceData[dateKey] || 0) + 1;
            }
        });

        const performanceTrends = Object.entries(performanceData)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        return res.status(200).json({
            reviews,
            analytics: {
                totalReviews,
                avgRating: parseFloat(avgRating),
                ratingDistribution,
                trafficSources,
                monthlyComparison,
                growthRate: parseFloat(growthRate),
                performanceTrends,
                currentMonthReviews,
                lastMonthReviews
            }
        });
        
    } catch(e) {
        console.log(e.message);
        return res.status(400).json({
            error: "Error occurred while fetching analytics"
        });
    }
};



module.exports.getAdminDashboard=async(req,res)=>{
    try{
let reviews=await reviewsModel.find({}).populate({
    path:'business',
    populate:{
        path:'user',
        model:'user'
    }
})


let business=await businessModel.find({})
let users=await userModel.find({})

return res.status(200).json({
    business,
    users,
    reviews
})
    }catch(e){
        console.log(e.message);
        return res.status(400).json({
            error: "Error occurred while fetching analytics"
        });
    }
}