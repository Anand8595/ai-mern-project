import Stripe from "stripe";
import UserModel from "../models/user.model.js";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Stripe secret key missing in .env");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const CREDIT_MAP = {
  100: 50,
  200: 120,
  500: 300,
};

export const createCreditsOrder = async (req, res) => {
  try {
    console.log("👉 API HIT");
    console.log("👉 BODY:", req.body);

    const userId = req.userId;

    // ✅ FIX 1: amount number madhe convert
    const amt = Number(req.body.amount);

    // ✅ validation
    if (!CREDIT_MAP[amt]) {
      return res.status(400).json({
        message: "Invalid credit plan",
      });
    }

    // ✅ FIX 2: CLIENT_URL check
    if (!process.env.CLIENT_URL) {
      throw new Error("CLIENT_URL missing in env");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      success_url: `${process.env.CLIENT_URL}/payment-success`,
      cancel_url: `${process.env.CLIENT_URL}/payment-failed`,
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `${CREDIT_MAP[amt]} Credits`,
            },
            unit_amount: amt * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        credits: CREDIT_MAP[amt],
      },
    });

    console.log("✅ SESSION CREATED:", session.id);

    res.status(200).json({ url: session.url });

  } catch (error) {
    // ✅ FIX 3: full error print
    console.log("❌ FULL ERROR 👉", error);

    res.status(500).json({
      message: error.message || "Stripe error",
    });
  }
};

export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.log("❌ Webhook signature error:", error.message);
    return res.status(400).send("Webhook Error");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const creditsToAdd = Number(session.metadata.credits);

    if (!userId || !creditsToAdd) {
      return res.status(400).json({ message: "Invalid metadata" });
    }

    await UserModel.findByIdAndUpdate(
      userId,
      {
        $inc: { credits: creditsToAdd },
        $set: { isCreditAvailable: true },
      },
      { new: true }
    );

    console.log("✅ Credits updated for user:", userId);
  }

  res.json({ received: true });
};