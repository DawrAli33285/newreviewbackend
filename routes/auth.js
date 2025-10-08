const router=require('express').Router();
const {login,updatePassword,deleteUser}=require('../controllers/auth')
const {auth}=require('../middlewares/auth')
router.post('/login',login)
router.patch('/updatePassword',updatePassword)
router.delete('/deleteUser/:id',auth,deleteUser)

module.exports=router;