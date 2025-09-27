/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { createAcademicVerify } from "@/actions/academicActions";
import { getAcademicDashboardData } from "@/actions/dashboardActions";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { CheckCircle, ArrowLeft } from "lucide-react";

const AcademicVerificationPage = () => {
  const { user, isLoaded, isSignedIn } = useUser();

  const [proverName, setProverName] = useState("");
  const [proverAcademicId, setProverAcademicId] = useState("");
  const [proverInstitute, setProverInstitute] = useState("");
  const [proverCGPA, setProverCGPA] = useState("");
  const [receiverEmail, setReceiverEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [recievedRequests, setRecievedRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);

  const userEmail = user?.primaryEmailAddress?.emailAddress;

  useEffect(() => {
    if (userEmail) fetchDashboardData();
  }, [userEmail]);

  const fetchDashboardData = async () => {
    if (!userEmail) return;
    setFetching(true);
    try {
      const res = await getAcademicDashboardData(userEmail);
      if (res.success) {
        if (!res.data) {
          toast.message("No data found");
          return;
        }
        setRecievedRequests(res.data.recievedVerificationsRequest || []);
        setSentRequests(res.data.sentVerificationsRequest || []);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to fetch dashboard data.");
    } finally {
      setFetching(false);
    }
  };

  if (!isLoaded) return <p>Loading...</p>;
  if (!isSignedIn || !user) return <RedirectToSignIn />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) {
      toast.error("User email not found. Please sign in again.");
      return <RedirectToSignIn />;
    }

    if (!receiverEmail) {
      toast.error("Please enter receiver's email.");
      return;
    }

    setLoading(true);
    try {
      const res = await createAcademicVerify(
        proverName,
        proverAcademicId,
        proverInstitute,
        proverCGPA,
        userEmail,
        receiverEmail
      );
      if (res.success) {
        setSuccess(true);
        setProverName("");
        setProverAcademicId("");
        setProverInstitute("");
        setProverCGPA("");
        setReceiverEmail("");
        fetchDashboardData();
      } else {
        toast.error(res.message || "Failed to send academic verification.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => setSuccess(false);

  const renderStatus = (isVerified: boolean) =>
    isVerified ? (
      <span className="text-green-600 font-medium">Verified</span>
    ) : (
      <span className="text-yellow-600 font-medium">Pending</span>
    );

  return (
    <div className="flex justify-center items-start min-h-screen gap-6 p-6">
      {/* Left side - Form */}
      <Card className="w-[400px] text-center">
        {!success ? (
          <>
            <CardHeader>
              <CardTitle>Academic Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter full name"
                  value={proverName}
                  onChange={(e) => setProverName(e.target.value)}
                  required
                />
                <Input
                  type="text"
                  placeholder="Enter Academic ID"
                  value={proverAcademicId}
                  onChange={(e) => setProverAcademicId(e.target.value)}
                  required
                />
                <Input
                  type="text"
                  placeholder="Enter Institute Name"
                  value={proverInstitute}
                  onChange={(e) => setProverInstitute(e.target.value)}
                  required
                />
                <Input
                  type="text"
                  placeholder="Enter CGPA"
                  value={proverCGPA}
                  onChange={(e) => setProverCGPA(e.target.value)}
                  required
                />
                <Input
                  type="email"
                  placeholder="Enter receiver's email"
                  value={receiverEmail}
                  onChange={(e) => setReceiverEmail(e.target.value)}
                  required
                />
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Sending..." : "Send verification request"}
                </Button>
              </form>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-gray-500">Logged in as: {userEmail}</p>
            </CardFooter>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <h2 className="text-lg font-semibold">Verification Successful!</h2>
            <p className="text-sm text-gray-500">
              Academic verification mail sent successfully.
            </p>
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </Button>
          </div>
        )}
      </Card>

      {/* Right side - Dashboard */}
      <div className="flex-1 flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Verification Requests Received</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {fetching ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : recievedRequests.length > 0 ? (
              recievedRequests.map((req) => (
                <Link
                  href={`/academic/${req._id}`}
                  key={req._id}
                  className="block p-2 border rounded-md hover:bg-gray-50 transition flex justify-between items-center text-sm cursor-pointer"
                >
                  <span>{req.proverName}</span>
                  <div className="flex gap-4 items-center">
                    <span className="text-gray-500">{req.email}</span>
                    {renderStatus(req.isVerified)}
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-500">No requests received.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verification Requests Sent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {fetching ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : sentRequests.length > 0 ? (
              sentRequests.map((req) => (
                <Link
                  href={`/academic/${req._id}`}
                  key={req._id}
                  className="block p-2 border rounded-md hover:bg-gray-50 transition flex justify-between items-center text-sm cursor-pointer"
                >
                  <span>{req.proverName}</span>
                  <div className="flex gap-4 items-center">
                    <span className="text-gray-500">{req.recieverEmail}</span>
                    {renderStatus(req.isVerified)}
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-500">No requests sent.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AcademicVerificationPage;
