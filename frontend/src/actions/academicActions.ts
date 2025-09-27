/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import connectToDB from "@/utils/connectToDb";
import AcademicVerify from "@/models/academicModel";
import {
  sendAcademicVerificationEmail,
  sendConfirmedAcademicVerificationEmail,
} from "@/utils/mail/academicMail";
export async function createAcademicVerify(
  proverName: string,
  proverAcademicId: string,
  proverInstitute: string,
  proverCGPA: string,
  email: string,
  recieverEmail: string
) {
  try {
    await connectToDB();
    const newPanVerify = new AcademicVerify({
      proverName,
      proverAcademicId,
      proverInstitute,
      proverCGPA,
      email,
      recieverEmail,
    });
    await newPanVerify.save();
    await sendAcademicVerificationEmail(
      recieverEmail,
      email,
      proverName,
      proverAcademicId,
      proverInstitute,
      proverCGPA,
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
export async function getVerifyAcademic(id: string) {
  try {
    await connectToDB();
    const academicVerify = await AcademicVerify.findById(id);
    if (!academicVerify) {
      return { message: "Name Verify not found", success: false };
    }

    return {
      message: "Name Verify fetched successfully",
      success: true,
      data: academicVerify,
    };
  } catch (err) {
    return {
      message: "Something went wrong",
      success: false,
      error: err,
    };
  }
}
export async function sendAcademicProofMail(
  id: string,
  to: string,
  fromEmail: string,
  proverName: string,
  proverAcademicId: string,
  proverInstitute: string,
  proverCGPA: string,
  publicKeyPEM: string,
  proofData: any
) {
  try {
    await connectToDB();
    const academicVerify = await AcademicVerify.findById(id);
    if (!academicVerify) {
      return { message: "Academic Verify not found", success: false };
    }

    academicVerify.snark = proofData;
    academicVerify.isVerified = true;
    academicVerify.signature = publicKeyPEM;
    await academicVerify.save();

    await sendConfirmedAcademicVerificationEmail(
      to,
      fromEmail,
      proverName,
      proverAcademicId,
      proverInstitute,
      proverCGPA,
      academicVerify._id
    );

    return { message: "Academic proof mail sent successfully", success: true };
  } catch (err) {
    return {
      message: "Something went wrong",
      success: false,
      error: err,
    };
  }
}
