/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import connectToDB from "@/utils/connectToDb";
import PanVerify from "@/models/panModel";
import {
  sendNamePanVerificationEmail,
  sendConfirmedPanVerificationMail,
} from "@/utils/mail/panMail";
export async function createPanVerify(
  proverName: string,
  proverPanId: string,
  email: string,
  recieverEmail: string
) {
  try {
    await connectToDB();
    const newPanVerify = new PanVerify({
      proverName,
      proverPanId,
      email,
      recieverEmail,
    });
    await newPanVerify.save();
    await sendNamePanVerificationEmail(
      recieverEmail,
      email,
      proverName,
      proverPanId,
      newPanVerify._id
    );

    return { message: "Pan Verify created successfully", success: true };
  } catch (err) {
    return {
      message: "Something went wrong",
      success: false,
      error: err,
    };
  }
}
export async function getVerifyPan(id: string) {
  try {
    await connectToDB();
    const panVerify = await PanVerify.findById(id);
    if (!panVerify) {
      return { message: "Name Verify not found", success: false };
    }

    return {
      message: "Name Verify fetched successfully",
      success: true,
      data: panVerify,
    };
  } catch (err) {
    return {
      message: "Something went wrong",
      success: false,
      error: err,
    };
  }
}

export async function sendPanProofMail(
  id: string,
  to: string,
  fromEmail: string,
  proverName: string,
  proverPanId: string,
  publicKeyPEM: string,
  proofData: any
) {
  try {
    const nameVerify = await PanVerify.findById(id);
    if (!nameVerify) {
      return { message: "Name Verify not found", success: false };
    }
    nameVerify.snark = proofData;
    nameVerify.isVerified = true;
    nameVerify.signature = publicKeyPEM;
    await nameVerify.save();
    await sendConfirmedPanVerificationMail(
      to,
      fromEmail,
      proverName,
      proverPanId,

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
