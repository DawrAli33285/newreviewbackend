const router=require('express').Router();
const {getReviews,createReview,createfiveStarReview,bulkdelete,getAnalyticsReviews,deleteReview}=require('../controllers/reviews');
const { auth } = require('../middlewares/auth');

router.get('/getReviews',auth,getReviews)
router.post('/createReview',createReview)
router.delete('/deleteReview/:id',deleteReview)
router.post('/bulkdelete',bulkdelete)
router.get('/getAnalyticsReviews',auth,getAnalyticsReviews)
router.post('/createfiveStarReview',createfiveStarReview)

module.exports=router;