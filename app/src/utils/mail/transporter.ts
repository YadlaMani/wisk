import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "wisk.zk.dev@gmail.com",
    pass: process.env.MAIL_PASS || "http://localhost:3000",
  },
});
export default transporter;
