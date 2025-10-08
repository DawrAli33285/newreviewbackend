const mongoose=require('mongoose')

const userSchema=mongoose.Schema({

userName:{
    type:String,
    required:true
},
password:{
    type:String,
    required:true
},
reviewsUser:{
    type:Number,
    default:30
},
business:{
    type:mongoose.Schema.ObjectId,
    ref:'business'
},
subscription:{
type:mongoose.Schema.ObjectId,
ref:'subscription'
},
lastGivenOn: {
    type: Date,
    default: Date.now
  }
  
},{timestamps:true})


const userModel=mongoose.model('user',userSchema)

module.exports=userModel;