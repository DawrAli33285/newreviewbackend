const reviewsModel = require("../models/reviews");
const userModel = require("../models/user");
const businessModel=require('../models/businessCard')

module.exports.createReview = async(req, res) => {
    let {...data} = req.body;
    
    try {
        // Check eligibility first
        let eligibility = await userModel.findOne({business: data.business}).populate({
            path: "subscription",
            populate: {
                path: 'planId',
                model: 'plan'
            }
        });
        
        if (!eligibility) {
            return res.status(404).json({
                error: "Business not found"
            });
        }
        
        // Check eligibility based on subscription status
        let isEligible = false;
        
        if (eligibility.subscription && eligibility.subscription.planId) {
            // User HAS a subscription
            const plan = eligibility.subscription.planId;
            
            if (plan.unlimited) {
                // Plan is unlimited - always eligible
                isEligible = true;
            } else {
                // Plan is limited - check reviewsUser count
                isEligible = eligibility.reviewsUser > 0;
            }
        } else {
            // User does NOT have a subscription - check reviewsUser count
            isEligible = eligibility.reviewsUser > 0;
        }
        
        if (!isEligible) {
            return res.status(400).json({
                error: "Business is out of reviews."
            });
        }

        // Create the review
        await reviewsModel.create({
            description: data.description,
            rating: data.rating,
            business: data.business,
            reviewBy: [{ name: data.name, email: data.email }],
            source: data.source
        });
        
        // Decrement reviewsUser only if:
        // 1. User doesn't have subscription OR
        // 2. User has subscription but plan is NOT unlimited
        const shouldDecrement = !eligibility.subscription || 
                               (eligibility.subscription.planId && !eligibility.subscription.planId.unlimited);
        
        if (shouldDecrement) {
            await userModel.updateOne(
                { 
                    business: data.business,
                    reviewsUser: { $gt: 0 }
                }, 
                { 
                    $inc: { reviewsUser: -1 } 
                }
            );
        }

        return res.status(200).json({
            message: "Review given successfully"
        });
        
    } catch(e) {
        console.log(e.message);
        return res.status(400).json({
            error: "Error occurred while creating review"
        });
    }
}


module.exports.createfiveStarReview = async(req, res) => {
    let {...data} = req.body;
    

    try {
        // Check eligibility first
        let eligibility = await userModel.findOne({business: data.business}).populate({
            path: "subscription",
            populate: {
                path: 'planId',
                model: 'plan'
            }
        });
        console.log("elegibility")
        console.log(eligibility)
        
        if (!eligibility) {
            return res.status(404).json({
                error: "Business not found"
            });
        }
        
        // Check eligibility based on subscription status
        let isEligible = false;
        
        if (eligibility.subscription && eligibility.subscription.planId) {
            // User HAS a subscription
            console.log("PLAN")
            const plan = eligibility.subscription.planId;
            
            if (plan.unlimited) {
                console.log("UNLIMITED PLAN")
                // Plan is unlimited - always eligible
                isEligible = true;
            } else {
                console.log("LIMITED")
                // Plan is limited - check reviewsUser count
                isEligible = eligibility.reviewsUser > 0;
            }
        } else {
            // User does NOT have a subscription - check reviewsUser count
            isEligible = eligibility.reviewsUser > 0;
            console.log("NO PLAN")
        }
        
        if (!isEligible) {
            return res.status(400).json({
                error: "Business is out of reviews."
            });
        }

        // Create the review
      
        // Decrement reviewsUser only if:
        // 1. User doesn't have subscription OR
        // 2. User has subscription but plan is NOT unlimited
        const shouldDecrement = !eligibility.subscription || 
                               (eligibility.subscription.planId && !eligibility.subscription.planId.unlimited);
        
        if (shouldDecrement) {
            console.log("DEDUCT")
            await userModel.updateOne(
                { 
                    business: data.business,
                    reviewsUser: { $gt: 0 }
                }, 
                { 
                    $inc: { reviewsUser: -1 } 
                }
            );
        }

        
        await reviewsModel.create({
           
            rating: data.rating,
            business: data.business,
            source: data.source
        });
        return res.status(200).json({
            message: "Review given successfully"
        });
        
    } catch(e) {
        console.log(e.message);
        return res.status(400).json({
            error: "Error occurred while creating review"
        });
    }
}


module.exports.deleteReview=async(req,res)=>{
    let {id}=req.params;
    try{
await reviewsModel.findByIdAndDelete(id)
return res.status(200).json({
    message:"Review deleted sucessfully"
})
    }catch(e){
        console.log(e.message)
        return res.status(400).json({
            error:"Error occured while created review"
        })
    }
}



module.exports.bulkdelete = async (req, res) => {
    let  reviews  = req.body; 
  console.log(reviews)
  console.log("REVIEWS")
    try {
      if (!Array.isArray(reviews) || reviews.length === 0) {
        return res.status(400).json({
          error: "No review IDs provided"
        });
      }
  
      await reviewsModel.deleteMany({ _id: { $in: reviews } });
  
      return res.status(200).json({
        message: "Reviews deleted successfully"
      });
    } catch (e) {
      console.error(e.message);
      return res.status(400).json({
        error: "Error occurred while deleting reviews"
      });
    }
  };
  



module.exports.getReviews=async(req,res)=>{

    try{
        let business=await businessModel.findOne({$expr:{
            $eq:[{$toString:'$user'},req.user._id]
        }})
       
let reviews=await reviewsModel.find({business,reviewBy:{$exists:true,$ne:[]}})


console.log(reviews)
return res.status(200).json({
   reviews
}
)
    }catch(e){
        console.log(e.message)
        return res.status(400).json({
            error:"Error occured while created review"
        })
    }
}


module.exports.getAnalyticsReviews = async(req, res) => {
    try {
        let business = await businessModel.findOne({
            $expr: {
                $eq: [{$toString: '$user'}, req.user._id]
            }
        });
        
        if (!business) {
            return res.status(404).json({
                error: "Business not found"
            });
        }

        // Get all reviews for the business
        let reviews = await reviewsModel.find({business: business._id})
            .populate('business')
            .populate('reviewBy')
            .sort({createdAt: -1}); // Sort by newest first

        // Calculate analytics
        const totalReviews = reviews.length;
        
        // Calculate average rating
        const avgRating = totalReviews > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
            : 0;

        // Rating distribution
        const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
            rating,
            count: reviews.filter(r => r.rating === rating).length
        }));

        // Traffic sources analysis
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

        // Monthly comparison (last 6 months)
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

        // Calculate growth rate (current month vs previous month)
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

        // Performance trends (last 30 days)
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
