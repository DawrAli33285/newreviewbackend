const router = require('express').Router();
const upload = require('../middlewares/image');
const {auth}=require('../middlewares/auth')
const {
    updateUser,
    deleteUser,
    getUsers,
    getReviews,
    deleteBusiness,
    updateBusiness,
    register,
    getAdminDashboard,
    getAnalyticsReviews,
    login
} = require('../controllers/admin'); 


router.patch('/users/:userId', auth, updateUser);
router.delete('/users/:userId', auth, deleteUser);
router.get('/admin/users', auth, getUsers);
router.post('/admin/register',register)
router.post('/admin/login',login)

router.patch('/business/:businessId', auth, upload.single('photo'), updateBusiness);
router.delete('/business/:businessId/:userId', auth, deleteBusiness);


router.get('/admin/reviews', auth, getReviews);
router.get('/admin/getAnalyticsReviews',auth,getAnalyticsReviews)
router.get('/getAdminDashboard',auth,getAdminDashboard)
module.exports = router;