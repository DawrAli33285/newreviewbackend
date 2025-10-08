const { auth } = require('../middlewares/auth');

const router=require('express').Router();
const {subscribe,subscribed}=require('../controllers/subscription')
router.post('/subscribe',auth,subscribe)
router.get('/subscribed',auth,subscribed)


module.exports=router;