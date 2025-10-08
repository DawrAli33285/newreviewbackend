const router=require('express').Router();
const upload = require('../middlewares/image')
const {auth}=require('../middlewares/auth')

const {createBusiness,getBusiness,getAllData,contactUsEmail,updateVisitor,createComplaint,getOverview,getSpecificBusiness,updateBusiness}=require('../controllers/business')
router.post('/createBusiness',upload.single('photo'),createBusiness)
router.patch('/updateBusiness',upload.single('photo'),updateBusiness)
router.get('/getBusiness',auth,getBusiness)
router.get('/getOverview',auth,getOverview)
router.get('/getSpecificBusiness/:businessName',getSpecificBusiness)
router.post('/createComplaint',createComplaint)
router.get('/getAllData',auth,getAllData)
router.patch('/updateVisitor/:id',updateVisitor)
router.post('/contactUsEmail',contactUsEmail)
module.exports=router;