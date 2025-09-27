/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import connectToDB from "@/utils/connectToDb";
import NameVerify from "@/models/nameModel";

import {
  sendNameVerificationEmail,
  sendConfirmedVerificationEmail,
} from "@/utils/mail/nameMail";
export async function createNameVerify(
  name: string,
  email: string,
  recieverEmail: string
) {
  try {
    await connectToDB();
    const newNameVerify = new NameVerify({
      proverName: name,
      email,
      recieverEmail,
    });
    await newNameVerify.save();
    await sendNameVerificationEmail(
      recieverEmail,
      email,
      name,
      newNameVerify._id
    );
    return { message: "Name Verify created successfully", success: true };
  } catch (err) {
    return {
      message: "Something went wrong",
      success: false,
      error: err,
    };
  }
}
export async function getVerifyName(id: string) {
  try {
    await connectToDB();
    const nameVerify = await NameVerify.findById(id);
    if (!nameVerify) {
      return { message: "Name Verify not found", success: false };
    }

    return {
      message: "Name Verify fetched successfully",
      success: true,
      data: nameVerify,
    };
  } catch (err) {
    return {
      message: "Something went wrong",
      success: false,
      error: err,
    };
  }
}
export async function sendProofMail(
  id: string,
  to: string,
  fromEmail: string,
  proverName: string,
  publicKeyPEM: string,
  proofData: any
) {
  try {
    const nameVerify = await NameVerify.findById(id);
    if (!nameVerify) {
      return { message: "Name Verify not found", success: false };
    }
    nameVerify.snark = proofData;
    nameVerify.isVerified = true;
    nameVerify.signature = publicKeyPEM;
    await nameVerify.save();
    await sendConfirmedVerificationEmail(
      to,
      fromEmail,
      proverName,
      nameVerify._id
    );
    return { message: "Proof mail sent successfully", success: true };
  } catch (err) {
    return {
      message: "Something went wrong",
      success: false,
      error: err,
    };
  }
}
