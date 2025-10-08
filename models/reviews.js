const mongoose=require('mongoose')

const reviewsSchema=mongoose.Schema({
    description:{
        type:String,
  
    },
    rating:{
        type:Number,
        
    },
    business:{
        type:mongoose.Schema.ObjectId,
        ref:'business'
    },
    reviewBy:{
        type:[{
            name:{
                type:String
            },
            email:{
                type:String
            }
        }]
    },
    source:{
        type:String
    }
},{timestamps:true})

const reviewsModel=mongoose.model('reviews',reviewsSchema)

module.exports=reviewsModel