{
  "root_cause": "SHIPPING_SURPRISE",
  "confidence": 0.85,
  "evidence": [
    "Cart value ₹3200 is unusually close to common ₹3500 free-shipping thresholds.",
    "Abandonment occurred during shipping phase, suggesting unexpected shipping costs.",
    "Registered customer, indicating familiarity with site, yet still abandoned at shipping."
  ],
  "fix": "Lower free-shipping threshold from ₹3500 to ₹3000 for electronics carts.",
  "impact_inr": 12000
}

{
  "root_cause": "PRICE_SHOCK",
  "confidence": 0.85,
  "evidence": [
    "Cart value ₹7800.0 is high, indicating potential budget hesitation",
    "Abandonment during payment phase suggests sticker shock or payment concerns",
    "Registered customer, yet still abandoned, implies price was a significant factor"
  ],
  "fix": "Offer a 5% discount for orders above ₹7000 to alleviate price concerns",
  "impact_inr": 12000
}

{
  "root_cause": "JUST_BROWSING",
  "confidence": 0.7,
  "evidence": [
    "Cart value ₹1800.0 is moderate, not indicating a strong purchase intent",
    "Abandonment during cart phase suggests a lack of commitment to purchase",
    "No clear friction pattern observed in the customer's behavior"
  ],
  "fix": "Offer a limited-time discount of 5% for first-time customers to encourage purchase completion",
  "impact_inr": 1200
}

{
  "root_cause": "PRICE_SHOCK",
  "confidence": 0.85,
  "evidence": [
    "Cart value ₹9500.0 is unusually high, indicating potential budget hesitation",
    "Abandonment during payment phase suggests sticker shock or last-minute price consideration",
    "Registered customer indicates familiarity with the brand, yet still abandoned due to price concerns"
  ],
  "fix": "Offer financing options or payment plans for high-value electronics products like premium smartwatches",
  "impact_inr": 12000
}

{
  "root_cause": "JUST_BROWSING",
  "confidence": 0.7,
  "evidence": [
    "Cart value ₹499.0 is relatively low",
    "Abandonment occurred at cart phase, indicating weak purchase intent",
    "No clear friction pattern observed in customer behavior"
  ],
  "fix": "Offer limited-time discounts or bundle deals for electronics products to incentivize purchase",
  "impact_inr": 1200
}


//After updating the engine

{
  "root_cause": "SHIPPING_SURPRISE",
  "confidence": 0.85,
  "evidence": [
    "Cart value ₹3200 is unusually close to common ₹3500 free-shipping thresholds.",
    "Customer hovered free shipping banner, indicating awareness of potential shipping costs.",
    "Checked delivery timeline, suggesting shipping details were a point of consideration."
  ],
  "fix": "Lower free-shipping threshold from ₹3500 to ₹3000 for electronics carts.",
  "impact_inr": 12000
}

{
  "root_cause": "TRUST_GAP",
  "confidence": 0.85,
  "evidence": [
    "Customer viewed return policy, indicating concern about post-purchase support",
    "Checked seller profile, suggesting uncertainty about seller credibility",
    "Opened reviews section twice, implying a desire for social proof"
  ],
  "fix": "Display trust badges and seller ratings more prominently on product and checkout pages",
  "impact_inr": 12000
}

{
  "root_cause": "VARIANT_CONFUSION",
  "confidence": 0.85,
  "evidence": [
    "Toggled size M and L repeatedly, indicating uncertainty about fit",
    "Opened size guide, suggesting customer needed help with sizing",
    "Returned to product images, possibly to reassess product choice"
  ],
  "fix": "Add a size recommendation tool on the product page for clothing items",
  "impact_inr": 1200
}

{
  "root_cause": "PRICE_SHOCK",
  "confidence": 0.85,
  "evidence": [
    "Cart value ₹9500.0 is high, indicating potential budget hesitation",
    "Changed payment method twice, suggesting payment flexibility exploration",
    "Revisited pricing section, indicating price sensitivity"
  ],
  "fix": "Offer financing options like EMI for high-value electronics products",
  "impact_inr": 12000
}

{
  "root_cause": "JUST_BROWSING",
  "confidence": 0.7,
  "evidence": [
    "Low cart value of ₹499.0",
    "Abandoned during cart phase with minimal time on page (28 seconds)",
    "No strong purchase intent signals observed"
  ],
  "fix": "Offer limited-time discounts or bundle deals for electronics products to incentivize purchase",
  "impact_inr": 1200
}

