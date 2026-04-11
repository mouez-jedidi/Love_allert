const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (email, firstName, code) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Love Alert <onboarding@resend.dev>',
      to: email,
      subject: '💘 Vérifiez votre email — Love Alert',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0d0a12; color: #fff; padding: 40px; border-radius: 20px;">
          <h1 style="color: #FF3366; text-align: center;">💘 Love Alert</h1>
          <h2 style="text-align: center;">Bonjour ${firstName} !</h2>
          <p style="color: rgba(255,255,255,0.7); text-align: center;">
            Voici votre code de vérification :
          </p>
          <div style="background: #FF3366; border-radius: 14px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #fff; font-size: 40px; letter-spacing: 10px; margin: 0;">
              ${code}
            </h1>
          </div>
          <p style="color: rgba(255,255,255,0.4); text-align: center; font-size: 12px;">
            Ce code expire dans 10 minutes.<br/>
            Si vous n'avez pas créé de compte, ignorez cet email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.log('❌ Email error:', error);
      return false;
    }

    console.log('✅ Email sent:', data);
    return true;
  } catch (err) {
    console.log('❌ Email error:', err.message);
    return false;
  }
};

module.exports = { sendVerificationEmail };