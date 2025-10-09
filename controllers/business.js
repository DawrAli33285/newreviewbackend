const businessModel = require('../models/businessCard');

const userModel = require('../models/user');
const {cloudinaryUploadImage}=require('../middlewares/cloudinary')
const jwt=require('jsonwebtoken');
const mongoose = require('mongoose');
const reviewsModel = require('../models/reviews');
const nodemailer=require('nodemailer')
const complaintModel = require('../models/complaint');
const fs=require('fs')

function generatePassword(length = 12) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }

  return password;
}
module.exports.createBusiness = async (req, res) => {
  const { ...data } = req.body;

  try {
    if (req.file) {
      console.log('File received:', req.file.path);
      
      let alreadyExists=await businessModel.findOne({businessName:data.businessName})
      if(alreadyExists){
        return res.status(400).json({
          error:"Business already exsists"
        })
      }
      const cloudinaryResult = await cloudinaryUploadImage(req.file.path);
      
      if (cloudinaryResult.url) {
        data.photo = cloudinaryResult.url;
        console.log('Image uploaded to Cloudinary:', cloudinaryResult.url);
        
        fs.unlinkSync(req.file.path);
      } else {
        throw new Error('Failed to upload image to Cloudinary');
      }
    }
    
    const [business] = await Promise.all([
      businessModel.create(data),
    ]);
    
    
    let userName = data.businessName.toLowerCase().replace(/\s+/g, ''); 
    let uniqueUserName = userName;
    let counter = 1;
    
   
    while (await userModel.findOne({ userName: uniqueUserName })) {
      uniqueUserName = `${userName}${counter}`;
      counter++;
    }
    

    const password = generatePassword(12);
    
    let user = await userModel.create({
      userName: uniqueUserName,
      password,
      business: business._id
    });

    await businessModel.findByIdAndUpdate(business._id, {
      $set: {
        user: user._id
      }
    });
    
    user = user.toObject();

    let token = await jwt.sign(user, "FDSFSDJGJFDJGDJJJ#J$J#$J#J$#J$#$#$!$#$#$#!#%^&");

    return res.status(201).json({
      message: "Business created successfully",
      businessId: business._id,
      user,
      token
    });
  } catch (e) {
    console.error(e);
    return res.status(400).json({
      error: "Error occurred while creating your business. Please try again."
    });
  }
};

module.exports.getBusiness=async(req,res)=>{

    try{
      console.log(req.user._id)
      console.log(req.user._id)
      let business = await businessModel.findOne({
        $expr: { $eq: [{ $toString: "$user" }, req.user._id.toString()] }
      })
     
return res.status(200).json({
    business
})
    }catch(e){
        console.error(e);
        return res.status(400).json({
          error: "Error occurred while fetching your business. Please try again."
        });
    }
}

module.exports.updateBusiness = async (req, res) => {
  let { ...data } = req.body;

  try {
      // Convert empty/undefined values to empty strings
      Object.keys(data).forEach(key => {
          if (data[key] === undefined || data[key] === null) {
              data[key] = '';
          }
      });

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

      await businessModel.findByIdAndUpdate(data.businessId, {
          $set: data
      });

      console.log("DATA");
      console.log(data);

      return res.status(200).json({
          message: "business updated successfully"
      });

  } catch (e) {
      console.error(e);
      return res.status(400).json({
          error: "Error occurred while updating your business. Please try again."
      });
  }
};

module.exports.getOverview=async(req,res)=>{
  try{
    let user=await userModel.findById(req.user._id).populate('business').populate({
      path:'subscription',
      populate:{
        path:'planId',
        model:'plan'
      }
    })
   
let reviews=await reviewsModel.aggregate([
  {
    $match:{business:user.business._id}
  },
  {
    $group:{
      _id:'$business',
      averageRating:{$avg:'$rating'},
      totalReviews:{$sum:1}
    }
  }
])

const startOfMonth = new Date();
startOfMonth.setDate(1);
startOfMonth.setHours(0, 0, 0, 0);

const endOfMonth = new Date();
endOfMonth.setMonth(endOfMonth.getMonth() + 1);
endOfMonth.setDate(0);
endOfMonth.setHours(23, 59, 59, 999);

const thisMonthReviews = await reviewsModel.aggregate([
  { 
    $match: { 
      business: user.business._id,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    } 
  },
  {
    $count: "reviewsThisMonth"
  }
]);

return res.status(200).json({
  user,
  thisMonthReviews,
  reviews
})

  }catch(e){
    console.error(e);
        return res.status(400).json({
          error: "Error occurred while fetching your overview. Please try again."
        });
  }
}


module.exports.getSpecificBusiness=async(req,res)=>{
  let {businessName}=req.params
  try{
   
let business=await businessModel.findOne({businessName})

return res.status(200).json({
  business
})
  }catch(e){
    conosle.log(e.message)
    return res.status(400).json({
      error:"Error occured while fetching business details"
    })
  }
}

module.exports.createComplaint=async(req,res)=>{
  let {...data}=req.body;
  try{
    let business=await businessModel.findById(data.business)
    if(!business){
return res.status(400).json({
  error:"Business not found"
})
    }
await complaintModel.create(data)


return res.status(200).json({
  message:"Compaint created sucessfully"
})

  }catch(e){
    conosle.log(e.message)
    return res.status(400).json({
      error:"Error occured while creating complaint"
    })
  }
}


module.exports.getAllData=async(req,res)=>{
  try{
    let user=await userModel.findById(req.user._id).populate('business')
    let reviews=await reviewsModel.find({business:user.business._id})
    return res.status(200).json({
      user,
      reviews
    })
  }catch(e){
    console.log(e.message)
    return res.status(400).json({
      error:"Error occured while fetching the data"
    })
  }
}


module.exports.updateVisitor = async (req, res) => {
  console.log("CALLED");
  let { id } = req.params;

  try {
    await businessModel.updateOne(
      {
        $expr: {
          $eq: [{ $toString: "$_id" }, id]  
        }
      },
      {
        $inc: { visitCount: 1 } 
      }
    );

    return res.status(200).json({
      message: "Visitor updated successfully"
    });
  } catch (e) {
    console.log(e.message);
    return res.status(400).json({
      error: "Error occurred while updating the visitor"
    });
  }
};


module.exports.contactUsEmail = async (req, res) => {
  const { firstName, lastName, email, businessName, subject, message, businessEmail } = req.body;
  
  try {
   
    if (!firstName || !lastName || !email || !subject || !message) {
      return res.status(400).json({
        error: "First name, last name, email, subject, and message are required fields"
      });
    }

 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Please provide a valid email address"
      });
    }

    
    const transporter = nodemailer.createTransport({
      host:'smtp.gmail.com',
      port:587,
      secure: false,
      auth: {
        user: 'lemightyeagle@gmail.com',
        pass: 'hmxnktrcgadzarnl',
      },
    });

  
    const adminMailOptions = {
      from:'lemightyeagle@gmail.com' ,
      to: 'lemightyeagle@gmail.com',
      subject: `Contact Form: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #f4f4f4; padding: 15px; border-radius: 5px; }
                .content { background: white; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
                .field { margin-bottom: 15px; }
                .label { font-weight: bold; color: #555; }
                .message { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 15px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>New Contact Form Submission</h2>
                </div>
                <div class="content">
                    <div class="field">
                        <span class="label">Name:</span> ${firstName} ${lastName}
                    </div>
                    <div class="field">
                        <span class="label">Email:</span> ${email}
                    </div>
                    ${businessName ? `
                    <div class="field">
                        <span class="label">Business Name:</span> ${businessName}
                    </div>
                    ` : ''}
                    ${businessEmail ? `
                    <div class="field">
                        <span class="label">Business Email:</span> ${businessEmail}
                    </div>
                    ` : ''}
                    <div class="field">
                        <span class="label">Subject:</span> ${subject}
                    </div>
                    <div class="message">
                        <span class="label">Message:</span><br>
                        ${message.replace(/\n/g, '<br>')}
                    </div>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `
        New Contact Form Submission
        
        Name: ${firstName} ${lastName}
        Email: ${email}
        ${businessName ? `Business Name: ${businessName}` : ''}
        ${businessEmail ? `Business Email: ${businessEmail}` : ''}
        Subject: ${subject}
        
        Message:
        ${message}
      `
    };


    const userMailOptions = {
      from: process.env.SMTP_FROM || `"Your Company Name" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Thank you for contacting us',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px; }
                .content { background: white; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
                .footer { text-align: center; margin-top: 20px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Thank You for Contacting Us</h2>
                </div>
                <div class="content">
                    <p>Dear ${firstName},</p>
                    <p>Thank you for reaching out to us. We have received your message and will get back to you within 24-48 hours.</p>
                    <p><strong>Here's a summary of your inquiry:</strong></p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <p><strong>Message:</strong><br>${message}</p>
                    <p>If you have any urgent questions, please don't hesitate to contact us directly.</p>
                    <p>Best regards,<br>Your Company Team</p>
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `
    };

   
    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(userMailOptions);

    return res.status(200).json({
      message: 'Email sent successfully. We will get back to you soon!'
    });

  } catch (error) {
    console.error('Email sending error:', error.message);
    
    return res.status(500).json({
      error: "Error occurred while sending email",
      details: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
};