const mongoose=require('mongoose')

const businessCard=mongoose.Schema({
    businessName:{
        type:String,
        required:true
    },
    businessAddress:{
        type:String,
        required:true
    },
    businessEmail:{
        type:String
    },
    phoneNumber:{
        type:String
    },
    website:{
        type:String
    },
    photo:{
        type:String
    },
    googleReviewLink:{
        type:String
    },
    qrScanCount:{
        type:Number
    },
    visitCount:{
        type:Number
    },
    website:{
type:String
    },
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'user'
    }
},{timestamps:true})


const businessModel=mongoose.model('business',businessCard)
module.exports=businessModel