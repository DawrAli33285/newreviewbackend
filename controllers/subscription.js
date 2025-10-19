const planModel = require('../models/plan');
const subscriptionModel = require('../models/subscription');
const userModel = require('../models/user');


module.exports.subscribe = async (req, res) => {
    
    const stripe = require('stripe')(process.env.STRIPE_LIVE); 
    const { planId, paymentMethod } = req.body;
    console.log(planId)
    let stripeSubscription = null;
    let stripeCustomer = null;
    let stripePrice = null;
    let createdSubscription = null;

    try {
        // Find plan and user without session
        const [plan, user] = await Promise.all([
            planModel.findById(planId).lean(), 
            userModel.findById(req.user._id).lean()
        ]);

        console.log(plan)
        
        if (!plan) {
            throw new Error('Plan not found');
        }

        if (!user) {
            throw new Error('User not found');
        }

        // Check if user already has subscription
        if (user.subscription) {
            throw new Error('User already has an active subscription');
        }

        // Verify payment method
        const pm = await stripe.paymentMethods.retrieve(paymentMethod);

        if (!pm) {
            throw new Error('Invalid payment method');
        }

        // Create Stripe customer
        stripeCustomer = await stripe.customers.create({
            name: user.name,
            email: user.email,
            metadata: {
                userId: user._id.toString()
            }
        });

        // Attach payment method to customer
        await stripe.paymentMethods.attach(paymentMethod, {
            customer: stripeCustomer.id,
        });

        // Set default payment method
        await stripe.customers.update(stripeCustomer.id, {
            invoice_settings: {
                default_payment_method: paymentMethod,
            },
        });

        // Create price
        stripePrice = await stripe.prices.create({
            currency: 'usd',
            unit_amount: Math.round(plan.price * 100), 
            recurring: {
                interval: 'month',
            },
            product_data: {
                name: plan.planName,
                metadata: {
                    planId: plan._id.toString()
                }
            },
        });

        // Create subscription
        stripeSubscription = await stripe.subscriptions.create({
            customer: stripeCustomer.id,
            items: [{ price: stripePrice.id }], 
            default_payment_method: paymentMethod,
            payment_behavior: 'error_if_incomplete', // This will throw error if payment fails
        });
        // Create subscription in database
        const sub = await subscriptionModel.create({
            subscriptionId: stripeSubscription.id,
            planId: plan._id,
            user: req.user._id,
            status: stripeSubscription.status,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
        });

        createdSubscription = sub;

        // Update user with subscription
        await userModel.findByIdAndUpdate(
            req.user._id,
            {
              $set: {
                subscription: sub._id,
                stripeCustomerId: stripeCustomer.id,
              },
              $inc: {
                reviewsUser: plan?.reviewsAllowed || 0
              }
            }
          );
          
        return res.status(200).json({
            success: true,
            message: 'Subscription created successfully',
            subscription: {
                id: sub._id,
                subscriptionId: stripeSubscription.id,
                status: stripeSubscription.status,
                currentPeriodEnd: sub.currentPeriodEnd
            }
        });

    } catch (e) {
        console.log(e.message)
        console.error('Subscription error:', e.message);

        // Rollback logic
        try {
            // Delete MongoDB subscription if created
            if (createdSubscription) {
                await subscriptionModel.findByIdAndDelete(createdSubscription._id);
                console.log('Deleted MongoDB subscription');
            }
            
            // Cancel Stripe subscription
            if (stripeSubscription) {
                await stripe.subscriptions.cancel(stripeSubscription.id);
                console.log('Rolled back Stripe subscription');
            }
            
            // Deactivate price
            if (stripePrice) {
                await stripe.prices.update(stripePrice.id, { active: false });
                console.log('Deactivated Stripe price');
            }
            
            // Delete customer
            if (stripeCustomer) {
                await stripe.customers.del(stripeCustomer.id);
                console.log('Deleted Stripe customer');
            }
        } catch (rollbackError) {
            console.error('Rollback error:', rollbackError.message);
        }

        return res.status(400).json({
            success: false,
            error: e.message || "Error occurred while subscribing to a plan"
        });
    }
};



module.exports.subscribed = async (req, res) => {


    try {
        
        let subscription=await subscriptionModel.findOne({user:req.user._id})
        return res.status(200).json({
            subscribed:subscription?true:false
        })
    } catch (e) {
      
     

        return res.status(400).json({
            success: false,
            error: "Error occurred while subscribing to a plan"
        });

    } 
};
