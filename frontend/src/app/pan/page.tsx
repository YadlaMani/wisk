/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPanVerify } from "@/actions/panActions";
import { getPanDashboardData } from "@/actions/dashboardActions";
import Link from "next/link";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { CheckCircle, ArrowLeft } from "lucide-react";

const PanVerificationDashboard = () => {
  const { user, isLoaded, isSignedIn } = useUser();

  const [panId, setPanId] = useState("");
  const [name, setName] = useState("");
  const [receiverEmail, setReceiverEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);

  const userEmail = user?.primaryEmailAddress?.emailAddress;

  const fetchDashboardData = async () => {
    if (!userEmail) return;
    setFetching(true);
    try {
      const res = await getPanDashboardData(userEmail);
      if (res.success) {
        if (!res.data) {
          toast.message("No data found");
          return;
        }
        setReceivedRequests(res.data.recievedPanVerificationsRequest || []);
        setSentRequests(res.data.sentPanVerificationsRequest || []);
      } else {
        toast.error(res.message || "Failed to fetch data.");
      }
    } catch {
      toast.error("Failed to fetch dashboard data.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (userEmail) fetchDashboardData();
  }, [userEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) {
      toast.error("User email not found. Please sign in again.");
      return;
    }

    setLoading(true);
    try {
      const res = await createPanVerify(name, panId, userEmail, receiverEmail);
      if (res.success) {
        setSuccess(true);
        setPanId("");
        setName("");
        setReceiverEmail("");
        fetchDashboardData();
      } else {
        toast.error(res.message || "Failed to send PAN verification request.");
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

  if (!isLoaded) {
    return <p className="p-6 text-gray-500">Loading...</p>;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return (
    <div className="flex justify-center items-start min-h-screen gap-6 p-6">
      {/* Left side - Form */}
      <Card className="w-[400px] text-center">
        {!success ? (
          <>
            <CardHeader>
              <CardTitle>PAN Card Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  type="text"
                  placeholder="Enter PAN Card ID"
                  value={panId}
                  onChange={(e) => setPanId(e.target.value.toUpperCase())}
                  maxLength={10}
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
            <h2 className="text-lg font-semibold">Request Sent!</h2>
            <p className="text-sm text-gray-500">
              PAN verification mail sent successfully.
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
            ) : receivedRequests.length > 0 ? (
              receivedRequests.map((req) => (
                <Link
                  key={req._id}
                  href={`/pan/${req._id}`}
                  className="block p-3 border rounded-md hover:bg-gray-50 transition cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{req.proverName}</p>
                      <p className="text-xs text-gray-500">{req.proverPanId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{req.email}</p>
                      {renderStatus(req.isVerified)}
                    </div>
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
                  key={req._id}
                  href={`/pan/${req._id}`}
                  className="block p-3 border rounded-md hover:bg-gray-50 transition cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{req.proverName}</p>
                      <p className="text-xs text-gray-500">{req.proverPanId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {req.recieverEmail}
                      </p>
                      {renderStatus(req.isVerified)}
                    </div>
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

export default PanVerificationDashboard;
