const mongoose=require('mongoose')

const complaintSchema=mongoose.Schema({
    name:{
        type:String
    },
    phone:{
        type:String
    },
    feedback:{
        type:String
    },
    business:{
        type:mongoose.Schema.ObjectId,
        ref:'business'
    }
})

const complaintModel=mongoose.model('complaint',complaintSchema)

module.exports=complaintModel