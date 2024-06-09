const dotenv = require("dotenv");
dotenv.config();

const generateConfirmEmailBody = (code, language, email) => {
  return language === "en"
    ? {
        from: process.env.APP_EMAIL,
        to: email,
        subject: "Welcome to Muscat Driving School! Confirm Your Email",
        html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
  <div style="text-align: center; padding: 10px 0; background-color: #f4f4f4; border-bottom: 1px solid #ddd;">
      <h1>Welcome to Muscat Driving School!</h1>
  </div>
  <div style="padding: 20px;">
      <p>Welcome to Muscat Driving School! We are excited to have you join our community. At Muscat Driving School, we strive to provide the best experience for our users, and we’re thrilled to have you on board.</p>
      <p>To complete your registration, please confirm your email address by using the code below:</p>
      <div style="text-align: center; font-size: 1.2em; margin: 20px 0; padding: 10px; background-color: #f4f4f4; border: 1px solid #ddd; border-radius: 10px;">
          <strong>Your Confirmation Code: ${code} </strong>
      </div>
      <p>To confirm your email, simply enter this code in the confirmation section on our website.</p>
      <p>If you did not sign up for an account, please ignore this email.</p>
      <p>Should you have any questions or need further assistance, feel free to reach out to our support team at <a href="mailto:info@muscatdrivingschool.com">info@muscatdrivingschool.com</a>.</p>
      <p>Thank you for choosing Muscat Driving School. We look forward to serving you!</p>
  </div>
  <div style="margin-top: 20px; padding: 10px; text-align: center; background-color: #f4f4f4; border-top: 1px solid #ddd;">
      <p>Best regards,</p>
      Muscat Driving School<br>
      <a href="muscatdrivingschool.com">muscatdrivingschool.com</a><br>
      <p>Muscat Driving School ©. All rights reserved.</p>
      <p>By sending this email, you acknowledge and agree to our <a href="muscatdrivingschool.com/TermsAndConditions">Terms of Service</a> and <a href="muscatdrivingschool.com/PrivacyPolicy">Privacy Policy</a>.</p>
  </div>
</div>`,
      }
    : {
        from: process.env.APP_EMAIL,
        to: email,
        subject:
          "مرحباً بك في مسقط لتعليم قيادة السيارات! تأكيد بريدك الإلكتروني",
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; direction: rtl;">
  <div style="text-align: center; padding: 10px 0; background-color: #f4f4f4; border-bottom: 1px solid #ddd;">
      <h1>مرحباً بك في مسقط لتعليم قيادة السيارات!</h1>
  </div>
  <div style="padding: 20px;">
      <p>مرحباً بك في مسقط لتعليم قيادة السيارات! نحن متحمسون لانضمامك إلى مجتمعنا. في مسقط لتعليم قيادة السيارات، نسعى جاهدين لتقديم أفضل تجربة لمستخدمينا، ونحن مسرورون لانضمامك إلينا.</p>
      <p>لإكمال تسجيلك، يرجى تأكيد عنوان بريدك الإلكتروني باستخدام الرمز أدناه:</p>
      <div style="text-align: center; font-size: 1.2em; margin: 20px 0; padding: 10px; background-color: #f4f4f4; border: 1px solid #ddd; border-radius: 10px;">
          <strong>رمز التأكيد الخاص بك: ${code}</strong>
      </div>
      <p>لتأكيد بريدك الإلكتروني، قم بإدخال هذا الرمز في قسم التأكيد على موقعنا.</p>
      <p>إذا لم تقم بالتسجيل للحصول على حساب، يرجى تجاهل هذا البريد الإلكتروني.</p>
      <p>إذا كان لديك أي أسئلة أو تحتاج إلى مساعدة إضافية، لا تتردد في التواصل مع فريق الدعم لدينا على <a href="mailto:info@muscatdrivingschool.com">info@muscatdrivingschool.com</a>.</p>
      <p>شكراً لاختيارك مسقط لتعليم قيادة السيارات. نتطلع لخدمتك!</p>
  </div>
  <div style="margin-top: 20px; padding: 10px; text-align: center; background-color: #f4f4f4; border-top: 1px solid #ddd;">
      <p>أطيب التحيات،</p>
      مسقط لتعليم قيادة السيارات<br>
      <a href="muscatdrivingschool.com">muscatdrivingschool.com</a><br></p>
      <p>مسقط لتعليم قيادة السيارات © . جميع الحقوق محفوظة.</p>
      <p>بإرسال هذا البريد الإلكتروني، فإنك تقر وتوافق على <a href="muscatdrivingschool.com/TermsAndConditions">شروط الخدمة</a> و <a href="muscatdrivingschool.com/PrivacyPolicy">سياسة الخصوصية</a> الخاصة بنا.</p>
  </div>
</div>`,
      };
};
const generateWelcomeEmailBody = (language, name, email) => {
  return {
    from: process.env.APP_EMAIL,
    to: email,
    subject:
      language === "en"
        ? "Welcome to Muscat Driving School! Account successfully created "
        : "مرحباً بك في مسقط لتعليم قيادة السيارات! تم تسجيل حسابك بنجاح",
    html:
      language === "en"
        ? `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
    <div style="text-align: center; padding: 10px 0; background-color: #f4f4f4; border-bottom: 1px solid #ddd;">
        <h1>Welcome to Muscat Driving School!</h1>
    </div>
    <div style="padding: 20px;">
        <p>Dear ${name} ,</p>
        <p>We are thrilled to welcome you to Muscat Driving School! Thank you for subscribing. You are now part of a community that values excellence and strives to provide the best services and products to our clients.</p>
        <p>Your subscription unlocks a host of benefits and exclusive content tailored just for you. We are committed to ensuring that your experience with us is nothing short of exceptional.</p>
        <p>If you have any questions or need assistance, our support team is here to help. Feel free to reach out to us at <a href="mailto:info@muscatdrivingschool.com">info@muscatdrivingschool.com</a> or visit our <a href="muscatdrivingschool.com">website</a> for more information.</p>
        <p>We look forward to serving you and hope you enjoy all that Muscat Driving School has to offer.</p>
        <p>Best regards,</p>
        <p>Muscat Driving School<br>
        <a href="muscatdrivingschool.com">muscatdrivingschool.com</a><br>
    </div>
    <div style="margin-top: 20px; padding: 10px; text-align: center; background-color: #f4f4f4; border-top: 1px solid #ddd;">
        <p>Muscat Driving School ©. All rights reserved.</p>
    </div>
</div>
        `
        : `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; direction: rtl;">
        <div style="text-align: center; padding: 10px 0; background-color: #f4f4f4; border-bottom: 1px solid #ddd;">
            <h1>مرحباً بك في مسقط لتعليم قيادة السيارات!</h1>
        </div>
        <div style="padding: 20px;">
            <p>عزيزي/عزيزتي ${name}،</p>
            <p>نحن مسرورون لانضمامك إلى مسقط لتعليم قيادة السيارات! شكراً لك على الاشتراك. أنت الآن جزء من مجتمع يقدر التميز ويسعى لتقديم أفضل الخدمات والمنتجات لعملائنا.</p>
            <p>اشتراكك يفتح لك العديد من الفوائد والمحتوى الحصري المصمم خصيصاً لك. نحن ملتزمون بضمان أن تكون تجربتك معنا مميزة للغاية.</p>
            <p>إذا كان لديك أي أسئلة أو تحتاج إلى مساعدة، فإن فريق الدعم لدينا هنا للمساعدة. لا تتردد في التواصل معنا عبر البريد الإلكتروني <a href="mailto:info@muscatdrivingschool.com">info@muscatdrivingschool.com</a> أو زيارة <a href="muscatdrivingschool.com">موقعنا</a> لمزيد من المعلومات.</p>
            <p>نتطلع لخدمتك ونتمنى أن تستمتع بكل ما تقدمه مسقط لتعليم قيادة السيارات.</p>
            <p>أطيب التحيات،</p>
            مسقط لتعليم قيادة السيارات<br>
            <a href="muscatdrivingschool.com">muscatdrivingschool.com</a><br>
        </div>
        <div style="margin-top: 20px; padding: 10px; text-align: center; background-color: #f4f4f4; border-top: 1px solid #ddd;">
            <p>ملاحظة: تم إرسال هذا البريد الإلكتروني من حساب غير مراقب. يرجى عدم الرد مباشرة على هذا البريد الإلكتروني. لأي استفسارات، تواصل مع فريق الدعم لدينا على <a href="mailto:info@muscatdrivingschool.com">info@muscatdrivingschool.com</a>.</p>
            <p>مسقط لتعليم قيادة السيارات ©. جميع الحقوق محفوظة.</p>
        </div>
    </div>
    `,
  };
};
const generateChargeConfirmationEmail = (
  language,
  email,
  name,
  price,
  currency
) => {
  return language === "en"
    ? {
        from: process.env.APP_EMAIL,
        to: email,
        subject: "Payment Confirmation from Muscat Driving School",
        html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
    <div style="text-align: center; padding: 10px 0; background-color: #f4f4f4; border-bottom: 1px solid #ddd;">
        <h1>Payment Confirmation</h1>
    </div>
    <div style="padding: 20px;">
        <p>Dear ${name},</p>
        <p>We are pleased to inform you that your payment of ${price} ${currency} has been successfully processed. Thank you for your prompt payment and for choosing Muscat Driving School.</p>
        <p>If you have any questions or need further assistance, please feel free to reach out to our support team at <a href="mailto:info@muscatdrivingschool.com">info@muscatdrivingschool.com</a>.</p>
        <p>Thank you once again for your business!</p>
        <p>Best regards,</p>
        Muscat Driving School<br>
        <a href="muscatdrivingschool.com">muscatdrivingschool.com</a><br>
    </div>
    <div style="margin-top: 20px; padding: 10px; text-align: center; background-color: #f4f4f4; border-top: 1px solid #ddd;">
        <p>Muscat Driving School ©. All rights reserved.</p>
    </div>
</div>
`,
      }
    : {
        from: process.env.APP_EMAIL,
        to: email,
        subject: " تأكيد الدفع من مسقط لتعليم قيادة السيارات",
        html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; direction: rtl;">
        <div style="text-align: center; padding: 10px 0; background-color: #f4f4f4; border-bottom: 1px solid #ddd;">
            <h1>تأكيد الدفع</h1>
        </div>
        <div style="padding: 20px;">
            <p>عزيزي/عزيزتي ${name}،</p>
            <p>يسعدنا إبلاغك بأن دفعتك بمقدار ${price} ${currency} قد تمت بنجاح. شكراً لك على دفعك الفوري واختيارك لـمسقط لتعليم قيادة السيارات.</p>
            <p>إذا كان لديك أي أسئلة أو تحتاج إلى مساعدة إضافية، لا تتردد في التواصل مع فريق الدعم لدينا على <a href="mailto:info@muscatdrivingschool.com">info@muscatdrivingschool.com</a>.</p>
            <p>شكراً مرة أخرى لتعاملك معنا!</p>
            <p>أطيب التحيات،</p>
            مسقط لتعليم قيادة السيارات<br>
            <a href="muscatdrivingschool.com">muscatdrivingschool.com</a><br>
        </div>
        <div style="margin-top: 20px; padding: 10px; text-align: center; background-color: #f4f4f4; border-top: 1px solid #ddd;">
            <p>مسقط لتعليم قيادة السيارات ©. جميع الحقوق محفوظة.</p>
        </div>
    </div>
     `,
      };
};
module.exports = {
  generateConfirmEmailBody,
  generateWelcomeEmailBody,
  generateChargeConfirmationEmail,
};
