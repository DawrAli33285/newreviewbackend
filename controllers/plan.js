const planModel=require('../models/plan');
const userModel = require('../models/user');

module.exports.createPlan=async(req,res)=>{
    let {...data}=req.body;
    try{
await planModel.create(data)
return res.status(200).json({
    message:"Plan created sucessfully"
})
    }catch(e){
        console.log(e.message)
return res.status(400).json({
    error:"Error occured while creating a plan"
})
    }
}




module.exports.editPlan=async(req,res)=>{
    let {...data}=req.body;
    try{
await planModel.findByIdAndUpdate(data.planId,{
    $set:data
})
return res.status(200).json({
    message:"Plan edited sucessfully"
})
    }catch(e){
        console.log(e.message)
return res.status(400).json({
    error:"Error occured while creating a plan"
})
    }
}


module.exports.getPlans=async(req,res)=>{
    console.log("HERE")
    try{
let plans=await planModel.find({})
return res.status(200).json({
    plans
})
    }catch(e){
return res.status(400).json({
    error:"Error occured while fetching a plan"
})
    }
}


module.exports.getPlan=async(req,res)=>{
    let {planId}=req.params;
    try{
let plan=await planModel.findOne({_id:planId})
return res.status(200).json({
    plan
})
    }catch(e){
return res.status(400).json({
    error:"Error occured while fetching a plan"
})
    }
}





module.exports.deletePlan = async (req, res) => {
    const { planId } = req.params;
  
    try {
   
      const users = await userModel.find({}).populate('subscription');
  
      const isSubscribed = users.some(user => 
        user.subscription && user.subscription.planId.toString() === planId
      );
  
      if (isSubscribed) {
        return res.status(400).json({
          error: "Unable to delete. A user is subscribed to this plan."
        });
      }
  
      await planModel.findByIdAndDelete(planId);
  
      return res.status(200).json({
        message: "Plan deleted successfully"
      });
  
    } catch (e) {
      console.error(e.message);
      return res.status(400).json({
        error: "Error occurred while deleting the plan"
      });
    }
  };
  