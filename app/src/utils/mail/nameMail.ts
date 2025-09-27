import transporter from "./transporter";

export const sendNameVerificationEmail = async (
  to: string,
  fromEmail: string,
  proverName: string,
  id: string
) => {
  try {
    const verifyUrl = `${process.env.API_URL}/name/${id}`;

    const mailOptions = {
      from: `"Wisk" <wisk.zk.dev@gmail.com>`,
      to,
      subject: `Verify Name Request - Wisk`,
      html: `
        <div style="
          font-family: Arial, Helvetica, sans-serif;
          background-color: #ffffff;
          color: #000000;
          padding: 32px;
          max-width: 600px;
          margin: auto;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
        ">
          <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
            Name Verification Request
          </h2>
          
          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
            You received a verification request from <strong>${fromEmail}</strong> 
            to verify the name <strong>${proverName}</strong>.
          </p>

          <a href="${verifyUrl}" 
            style="
              display: inline-block;
              text-decoration: none;
              background-color: #000;
              color: #fff;
              font-size: 14px;
              padding: 12px 20px;
              border-radius: 6px;
              font-weight: 500;
            ">
            Verify Name
          </a>

          <p style="font-size: 12px; color: #444; margin-top: 24px;">
            If you did not expect this request, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent:", info.messageId);
  } catch (err) {
    console.error("Error sending verification email:", err);
  }
};

export const sendConfirmedVerificationEmail = async (
  to: string,
  fromEmail: string,
  proverName: string,
  id: string
) => {
  try {
    const detailsUrl = `${process.env.API_URL}/name/${id}`;

    const mailOptions = {
      from: `"Wisk" <wisk.zk.dev@gmail.com>`,
      to,
      subject: `Name Verification Confirmed - Wisk`,
      html: `
        <div style="
          font-family: Arial, Helvetica, sans-serif;
          background-color: #ffffff;
          color: #000000;
          padding: 32px;
          max-width: 600px;
          margin: auto;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
        ">
          <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
            Name Verification Successful
          </h2>

          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
            The name <strong>${proverName}</strong> has been successfully verified by <strong>${fromEmail}</strong>.
          </p>

          <a href="${detailsUrl}" 
            style="
              display: inline-block;
              text-decoration: none;
              background-color: #000;
              color: #fff;
              font-size: 14px;
              padding: 12px 20px;
              border-radius: 6px;
              font-weight: 500;
            ">
            View Verification Details
          </a>

          <p style="font-size: 12px; color: #444; margin-top: 24px;">
            If you have any questions, please contact the requester directly.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Confirmation email sent:", info.messageId);
  } catch (err) {
    console.error("Error sending confirmation email:", err);
  }
};
