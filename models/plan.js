const mongoose=require('mongoose')

const planSchema=mongoose.Schema({
    planName:{
        type:String,
        required:true
    },
    reviewsAllowed:{
        type:Number,
        
    },
    price:{
        type:Number,
        required:true
    },
    unlimited:{
        type:Boolean,
        default:false
    }
},{
    timestamps:true
})


const planModel=mongoose.model('plan',planSchema)

module.exports=planModel