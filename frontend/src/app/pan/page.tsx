/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPanVerify } from "@/actions/panActions";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { CheckCircle, ArrowLeft } from "lucide-react";

const PanVerificationPage = () => {
  const { user } = useUser();

  const [panId, setPanId] = useState("");
  const [name, setName] = useState("");
  const [receiverEmail, setReceiverEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!user) {
    return <RedirectToSignIn />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.primaryEmailAddress?.emailAddress) {
      toast.error("User email not found. Please sign in again.");
      return <RedirectToSignIn />;
    }

    if (!receiverEmail) {
      toast.error("Please enter receiver's email.");
      return;
    }

    setLoading(true);
    try {
      const res = await createPanVerify(
        name,
        panId,
        user.primaryEmailAddress.emailAddress,
        receiverEmail
      );
      if (res.success) {
        setSuccess(true);
        setPanId("");
        setName("");
        setReceiverEmail("");
      } else {
        toast.error(res.message || "Failed to verify PAN.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    setSuccess(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
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
              <p className="text-xs text-gray-500">
                Logged in as: {user?.primaryEmailAddress?.emailAddress}
              </p>
            </CardFooter>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <h2 className="text-lg font-semibold">Verification Successful!</h2>
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
    </div>
  );
};

export default PanVerificationPage;
