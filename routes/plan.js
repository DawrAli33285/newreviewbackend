const router=require('express').Router();
const {createPlan,getPlan,getPlans,editPlan,deletePlan}=require('../controllers/plan')

router.post('/createPlan',createPlan)
router.patch('/editPlan',editPlan)
router.get('/getPlans',getPlans)
router.get('/getPlan/:planId',getPlan)
router.delete('/deletePlan/:planId',deletePlan)
module.exports=router;