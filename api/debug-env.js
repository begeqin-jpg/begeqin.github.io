module.exports = (req, res) => {
  res.status(200).json({
    hasClientId: !!process.env.PAYPAL_CLIENT_ID,
    hasSecret: !!process.env.PAYPAL_CLIENT_SECRET,
    env: process.env.PAYPAL_ENV || null,
    brand: process.env.PAYPAL_BRAND_NAME || null
  });
};
