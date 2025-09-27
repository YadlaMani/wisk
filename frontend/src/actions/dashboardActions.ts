"use server";

import connectToDB from "@/utils/connectToDb";
import AcademicVerify from "@/models/academicModel";
import NameVerify from "@/models/nameModel";
import PanVerify from "@/models/panModel";

export async function getNameDashboardData(email: string) {
  try {
    await connectToDB();
    const recievedVerificationsRequest = await NameVerify.find({
      recieverEmail: email,
    }).sort({ createdAt: -1 });
    const sentVerificationsRequest = await NameVerify.find({
      email: email,
    }).sort({
      createdAt: -1,
    });
    return {
      message: "Data fetched successfully",
      success: true,
      data: { recievedVerificationsRequest, sentVerificationsRequest },
    };
  } catch (err) {
    console.log(err);
    return {
      message: "Something went wrong",
      success: false,
      error: err,
    };
  }
}

export async function getPanDashboardData(email: string) {
  try {
    await connectToDB();
    const recievedPanVerificationsRequest = await PanVerify.find({
      recieverEmail: email,
    }).sort({ createdAt: -1 });
    const sentPanVerificationsRequest = await PanVerify.find({
      email: email,
    }).sort({
      createdAt: -1,
    });
    return {
      message: "Data fetched successfully",
      success: true,
      data: { recievedPanVerificationsRequest, sentPanVerificationsRequest },
    };
  } catch (err) {
    console.log(err);
    return {
      message: "Something went wrong",
      success: false,
      error: err,
    };
  }
}
export async function getAcademicDashboardData(email: string) {
  try {
    await connectToDB();
    const recievedVerificationsRequest = await AcademicVerify.find({
      recieverEmail: email,
    }).sort({ createdAt: -1 });
    const sentVerificationsRequest = await AcademicVerify.find({
      email: email,
    }).sort({
      createdAt: -1,
    });
    return {
      message: "Data fetched successfully",
      success: true,
      data: { recievedVerificationsRequest, sentVerificationsRequest },
    };
  } catch (err) {
    console.log(err);
    return {
      message: "Something went wrong",
      success: false,
      error: err,
    };
  }
}
