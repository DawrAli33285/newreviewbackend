const express=require('express')
const app=express();
const cron = require('cron');
require('dotenv').config();
const cors=require('cors')
app.use(cors())

const authRoutes=require('./routes/auth')
const businessRoutes=require('./routes/business')
const reviewsRoutes=require('./routes/reviews')
const subscriptionRoutes=require('./routes/subscription')
const adminRoutes=require('./routes/admin')
const connect=require('./connection/connection')
const planRoutes=require('./routes/plan')
const subscriptionModel=require('./models/subscription')
const userModel=require('./models/user')
connect


const endpointSecret = 'whsec_b82d718fbae44ab38035f9ce59915a1c5c7870d001c5d90f38cab27b8e52a15c';


app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (request, response) => {
    let event;
    const stripe = require('stripe')(process.env.STRIPE_LIVE); 

    if (endpointSecret) {
      const signature = request.headers['stripe-signature'];
      try {
        event = stripe.webhooks.constructEvent(
          request.body,
          signature,
          endpointSecret
        );
      } catch (err) {
        console.log(`Webhook signature verification failed:`, err.message);
        return response.status(400).send(`Webhook Error: ${err.message}`);
      }
    }

    console.log(`Received event: ${event.type}`);

    try {
      switch (event.type) {
        case 'customer.subscription.created':
          const newSubscription = event.data.object;
          console.log("New subscription created:", newSubscription.id);
          break;

        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object;
          const stripeSubscriptionId = deletedSubscription.id;
          
          console.log("Subscription cancelled:", stripeSubscriptionId);
          
          const dbSubscription = await subscriptionModel.findOne({ 
            subscriptionId: stripeSubscriptionId 
          });
          
          if (dbSubscription) {
            await subscriptionModel.updateOne(
              { subscriptionId: stripeSubscriptionId },
              { $set: { status: 'cancelled' } }
            );
            
            console.log(`Updated subscription ${dbSubscription._id} status to cancelled`);
            
            const userUpdateResult = await userModel.updateOne(
              { subscription: dbSubscription._id },
              { $unset: { subscription: "" } }
            );
            
            if (userUpdateResult.modifiedCount > 0) {
              console.log(`Removed subscription from user`);
            }
          } else {
            console.log(`Subscription not found in database: ${stripeSubscriptionId}`);
          }
          break;

        case 'charge.refunded':
          const refundedCharge = event.data.object;
          console.log("Charge refunded:", refundedCharge.id);
          
          // If this charge was for a subscription, you might want to cancel it
          if (refundedCharge.invoice) {
            // Get the invoice to find the subscription
            const invoice = await stripe.invoices.retrieve(refundedCharge.invoice);
            
            if (invoice.subscription) {
              console.log("Refund is for subscription:", invoice.subscription);
              
              // Find subscription in database
              const refundedSubscription = await subscriptionModel.findOne({ 
                subscriptionId: invoice.subscription 
              });
              
              if (refundedSubscription) {
                // Update status to cancelled
                await subscriptionModel.updateOne(
                  { subscriptionId: invoice.subscription },
                  { $set: { status: 'cancelled' } }
                );
                
                console.log(`Updated subscription ${refundedSubscription._id} to cancelled after refund`);
                
                // Remove subscription from user
                await userModel.updateOne(
                  { subscription: refundedSubscription._id },
                  { $unset: { subscription: "" } }
                );
                
                console.log(`Removed subscription from user after refund`);
              }
            }
          }
          break;

        case 'invoice.payment_failed':
          const failedInvoice = event.data.object;
          console.log("Invoice payment failed:", failedInvoice.id);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      response.status(200).json({ received: true });

    } catch (error) {
      console.error('Error processing webhook:', error.message);
      response.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);



app.use(express.json())
app.use(authRoutes)
app.use(businessRoutes)
app.use(reviewsRoutes)
app.use(subscriptionRoutes)
app.use(adminRoutes)
app.use(planRoutes)


app.post('/getplaceId', async(req, res) => {
  let {query} = req.body;
  try {
    const apiKey = 'AIzaSyAw8jde9HTH712gCzQijemEoDmU3K3URuA';
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(data.candidates);
    
    if (data.candidates && data.candidates.length > 0) {
      // Return the place_id to frontend
      return res.json({ 
        success: true, 
        place_id: data.candidates[0].place_id 
      });
    } else {
      return res.json({ 
        success: false, 
        message: 'No place found' 
      });
    }
  } catch(e) {
    console.log(e.message);
    return res.status(500).json({ 
      success: false, 
      error: e.message 
    });
  }
});

app.get('/cancel-subscription', async (req, res) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_LIVE); 

    
    const cancelledSubscription = await stripe.subscriptions.cancel("sub_1SEVYDLcfLzcwwOYvpE5zQ0i");
    
    console.log('Subscription cancelled:', cancelledSubscription.id);
    
    res.json({ 
      success: true, 
      message: 'Subscription cancelled successfully' 
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error.message);
    res.status(400).json({ error: error.message });
  }
});

const reviewsUpdateJob = new cron.CronJob(
  '0 0 * * *',
   async function() {
     try {
       console.log('Running reviews update job at:', new Date().toISOString());
       
       const oneMonthAgo = new Date();
       oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
       
       // Find users who need reviews replenishment
       const usersToUpdate = await userModel.find({
         $or: [
           { lastGivenOn: { $exists: false } },
           { lastGivenOn: null },
           { lastGivenOn: { $lte: oneMonthAgo } }
         ]
       }).populate({
         path: 'subscription',
         populate: {
           path: 'planId',
           model: 'plan'
         }
       });
       
       let updatedCount = 0;
       
       for (const user of usersToUpdate) {
         let reviewsToAdd = 30;
         
        
         if (user.subscription && user.subscription.planId) {
           const plan = user.subscription.planId;
           
         
           if (plan.unlimited) {
             console.log(`Skipping user ${user._id} - has unlimited plan`);
             continue;
           }
           
          
           reviewsToAdd = plan.reviewsAllowed || 30;
         }
         
        
         await userModel.updateOne(
           { _id: user._id },
           { 
             $inc: { reviewsUser: reviewsToAdd },
             $set: { lastGivenOn: new Date() }
           }
         );
         
         updatedCount++;
         console.log(`Updated user ${user._id}: added ${reviewsToAdd} reviews`);
       }
       
       console.log(`Updated ${updatedCount} users total`);
       
     } catch (error) {
       console.error('Error in reviews update job:', error.message);
     }
   },
   null, 
   true, 
   'America/New_York' 
 );


 

app.listen(process.env.PORT,()=>{
    console.log(`Listening to PORT ${process.env.PORT}`)
})
