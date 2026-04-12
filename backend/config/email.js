const SibApiV3Sdk = require('@getbrevo/brevo');

let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
let apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const sendVerificationEmail = async (toEmail, firstName, code) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.subject = '💘 Vérifiez votre email — Love Alert';
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; background: #0d0a12; color: #fff; padding: 40px;">
      <h1 style="color: #FF3366;">Love Alert</h1>
      <h2>Bonjour ${firstName},</h2>
      <p>Votre code de vérification est : <strong style="font-size: 28px;">${code}</strong></p>
      <p>Ce code expire dans 10 minutes.</p>
      <p>À très vite sur Love Alert !</p>
    </div>
  `;
  sendSmtpEmail.sender = { name: 'Love Alert', email: 'noreply@lovealert.com' };
  sendSmtpEmail.to = [{ email: toEmail, name: firstName }];

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent:', response);
    return true;
  } catch (err) {
    console.log('❌ Email error:', err.response?.body || err.message);
    return false;
  }
};

module.exports = { sendVerificationEmail };