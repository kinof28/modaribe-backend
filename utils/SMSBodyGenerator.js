const generateConfirmEmailSMSBody = (language, code) => {
  return language === "en"
    ? `Welcome to Muscat Driving School! Please confirm your email using this code: ${code}. If you didn't sign up, ignore this message.`
    : `مرحباً بك في مسقط لتعليم قيادة السيارات! يرجى تأكيد بريدك الإلكتروني باستخدام هذا الرمز: ${code}. إذا لم تقم بالتسجيل، تجاهل هذه الرسالة.
    `;
};
const generateWelcomeSMSBody = (language, name) => {
  return language === "en"
    ? `
    Welcome to Muscat Driving School, ${name}! Your account has been successfully created. We're excited to have you with us.
    `
    : `مرحباً بك في مسقط لتعليم قيادة السيارات, ${name}! تم إنشاء حسابك بنجاح. نحن سعداء بانضمامك إلينا.
    `;
};
const generateChargeConfirmationSMSBody = (language, name, price, currency) => {
  return language === "en"
    ? `Hello ${name}, your payment of ${price} ${currency} to Muscat Driving School was successful. Thank you!.`
    : `مرحباً ${name}، دفعتك بمقدار ${price} ${currency} إلى مسقط لتعليم قيادة السيارات تمت بنجاح. شكراً لك!
    `;
};
module.exports = {
  generateConfirmEmailSMSBody,
  generateWelcomeSMSBody,
  generateChargeConfirmationSMSBody,
};
