import transporter from "./transporter";

export const sendAcademicVerificationEmail = async (
  to: string,
  fromEmail: string,
  proverName: string,
  academicId: string,
  institute: string,
  cgpa: string,
  id: string
) => {
  try {
    const verifyUrl = `${process.env.API_URL}/academic/${id}`;

    const mailOptions = {
      from: `"Wisk" <wisk.zk.dev@gmail.com>`,
      to,
      subject: `Verify Academic Record - Wisk`,
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
            Academic Verification Request
          </h2>
          
          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
            You received an academic verification request from 
            <strong>${fromEmail}</strong> for the following details:
          </p>

          <ul style="font-size: 15px; line-height: 1.6; margin: 0 0 24px 20px; padding: 0;">
            <li><strong>Name:</strong> ${proverName}</li>
            <li><strong>Academic ID:</strong> ${academicId}</li>
            <li><strong>Institute:</strong> ${institute}</li>
            <li><strong>CGPA:</strong> ${cgpa}</li>
          </ul>

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
            Verify Academic Record
          </a>

          <p style="font-size: 12px; color: #444; margin-top: 24px;">
            If you did not expect this request, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Academic verification email sent:", info.messageId);
  } catch (err) {
    console.error("Error sending academic verification email:", err);
  }
};

export const sendConfirmedAcademicVerificationEmail = async (
  to: string,
  fromEmail: string,
  proverName: string,
  proverAcademicId: string,
  proverInstitute: string,
  proverCGPA: string,
  id: string
) => {
  try {
    const detailsUrl = `${process.env.API_URL}/academic/${id}`;

    const mailOptions = {
      from: `"Wisk" <wisk.zk.dev@gmail.com>`,
      to,
      subject: `Academic Verification Confirmed - Wisk`,
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
            Academic Verification Successful
          </h2>

          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
            The academic details of <strong>${proverName}</strong> have been successfully verified by 
            <strong>${fromEmail}</strong>.
          </p>

          <ul style="font-size: 14px; line-height: 1.6; margin: 0 0 24px 20px; padding: 0;">
            <li><strong>Academic ID:</strong> ${proverAcademicId}</li>
            <li><strong>Institute:</strong> ${proverInstitute}</li>
            <li><strong>CGPA:</strong> ${proverCGPA}</li>
          </ul>

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
    console.log("Academic confirmation email sent:", info.messageId);
  } catch (err) {
    console.error("Error sending academic confirmation email:", err);
  }
};
