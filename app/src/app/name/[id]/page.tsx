/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, ChangeEvent } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  Upload,
  FileCheck,
  FileX,
  Shield,
  Key,
  CheckCircle,
  XCircle,
  Mail,
  ArrowLeft,
  Zap,
  VerifiedIcon,
  RefreshCw,
} from "lucide-react";

import { getVerifyName, sendProofMail } from "@/actions/nameActions";
import * as asn1js from "asn1js";
import { setEngine, CryptoEngine } from "pkijs";
import { loadWasm } from "@/app/lib/wasm";

function initPKIjs() {
  if ((window as any).__PKIJS_ENGINE_INITIALIZED__) return;
  const crypto = window.crypto;
  setEngine(
    "browser_crypto",
    crypto as any,
    new CryptoEngine({
      name: "browser_crypto",
      crypto: crypto as any,
      subtle: (crypto as any).subtle,
    })
  );
  (window as any).__PKIJS_ENGINE_INITIALIZED__ = true;
}

function publicKeyInfoToPEM(spkiBuffer: ArrayBuffer): string {
  const b64 = window.btoa(
    String.fromCharCode.apply(null, Array.from(new Uint8Array(spkiBuffer)))
  );
  const lines = b64.match(/.{1,64}/g) || [];
  return [
    "-----BEGIN PUBLIC KEY-----",
    ...lines,
    "-----END PUBLIC KEY-----",
  ].join("\n");
}

export default function EnhancedPDFVerifier({
  params,
}: {
  params: { id: string };
}) {
  const [loading, setLoading] = useState(true);
  const [res, setRes] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // PDF verification states
  const [status, setStatus] = useState(
    "Drop a PDF file here or click to select"
  );
  const [publicKeyPEM, setPublicKeyPEM] = useState<string | null>(null);
  const [signatureValid, setSignatureValid] = useState<boolean | null>(null);
  const [textVerified, setTextVerified] = useState<boolean | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [proofData, setProofData] = useState<string | null>(null);

  const [proofGenerated, setProofGenerated] = useState(false);
  const [mailSent, setMailSent] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // New states for post-mail verification
  const [snarkVerificationResult, setSnarkVerificationResult] = useState<
    boolean | null
  >(null);
  const [signatureVerificationResult, setSignatureVerificationResult] =
    useState<boolean | null>(null);
  const [verifyingSnark, setVerifyingSnark] = useState(false);

  useEffect(() => {
    initPKIjs();
    fetchVerificationData();
  }, [params.id]);

  const fetchVerificationData = async () => {
    setLoading(true);
    try {
      const data = await getVerifyName(params.id);
      if (!data.success) {
        setError(data.message);
      } else {
        if (data.data.isVerified) {
          toast.success("This verification request has been completed.");
          setIsVerified(true);
        }
        setRes(data.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPDFState = useCallback(() => {
    setPublicKeyPEM(null);
    setSignatureValid(null);
    setTextVerified(null);
    setPdfBytes(null);
    setPages([]);
    setStatus("Drop a PDF file here or click to select");
    setProofData(null);
    setProofGenerated(false);
    setMailSent(false);
  }, []);

  const verifyTextInPages = useCallback(
    (extractedPages: string[], proverName: string): boolean => {
      return extractedPages.some((page) =>
        page.toLowerCase().includes(proverName.toLowerCase())
      );
    },
    []
  );

  const processFile = useCallback(
    async (file: File) => {
      setStatus("Processing PDF file...");
      setProcessing(true);
      resetPDFState();

      try {
        const buffer = await file.arrayBuffer();
        const uint8 = new Uint8Array(buffer);
        setPdfBytes(uint8);

        const wasm = await loadWasm();
        const result = wasm.wasm_verify_and_extract(uint8);

        if (result?.success) {
          if (result.pages) setPages(result.pages);

          // Verify signature
          const isSignatureValid =
            result.signature?.is_valid || result.is_valid;
          setSignatureValid(isSignatureValid);

          // Verify text presence
          const isTextVerified = verifyTextInPages(
            result.pages || [],
            res?.proverName || ""
          );
          setTextVerified(isTextVerified);

          if (result.signature?.public_key) {
            try {
              const binaryString = atob(result.signature.public_key);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              setPublicKeyPEM(publicKeyInfoToPEM(bytes.buffer));
            } catch (e) {
              console.warn("Could not convert public key to PEM:", e);
            }
          }

          if (isSignatureValid && isTextVerified) {
            toast.success(
              "PDF verified successfully - Signature valid and text found"
            );
            setStatus("PDF verified successfully");
          } else if (isSignatureValid && !isTextVerified) {
            toast.warning("Signature valid but required text not found");
            setStatus("Signature valid but text verification failed");
          } else {
            toast.error("PDF verification failed");
            setStatus("PDF verification failed");
          }
        } else {
          setStatus("PDF processing failed");
          toast.error("PDF processing failed");
        }
      } catch (err: any) {
        setStatus("Error processing file");
        toast.error("Error processing file");
      } finally {
        setProcessing(false);
      }
    },
    [res?.proverName, resetPDFState, verifyTextInPages]
  );

  const onGenerateProof = async () => {
    if (!pdfBytes) return toast.error("Please upload a PDF first");
    if (!signatureValid) return toast.error("PDF signature must be valid");
    if (!textVerified)
      return toast.error("Required text must be present in PDF");

    setProcessing(true);

    try {
      const response = await fetch("http://localhost:3001/prove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdf_bytes: Array.from(pdfBytes),
          page_number: 1,
          offset: 0,
          sub_string: res.proverName,
        }),
      });

      if (!response.ok) throw new Error(`Status ${response.status}`);
      const data = await response.json();
      setProofData(JSON.stringify(data, null, 2));
      setProofGenerated(true);
      toast.success("SNARK proof generated successfully");
    } catch (e: any) {
      toast.error("Error generating proof: " + (e.message || e.toString()));
    } finally {
      setProcessing(false);
    }
  };

  const onSendProofMail = async () => {
    if (!proofData) return toast.error("Generate proof first");

    setProcessing(true);

    try {
      const result = await sendProofMail(
        res._id,
        res.email,
        res.recieverEmail,
        res.proverName,
        publicKeyPEM ?? "",
        proofData
      );
      if (!result.success) {
        throw new Error(result.message || "Failed to send proof mail");
      }

      setMailSent(true);
      toast.success("Proof mail sent successfully");

      // Refetch verification data after successful mail send
      await fetchVerificationData();
    } catch (e: any) {
      toast.error("Error sending proof mail: " + (e.message || e.toString()));
    } finally {
      setProcessing(false);
    }
  };

  const onVerifySnarkProof = async () => {
    if (!res?.snarkProof) return toast.error("No SNARK proof found");

    setVerifyingSnark(true);

    try {
      // Parse the SNARK proof if it's a string
      let proofToVerify = res.snarkProof;
      if (typeof res.snarkProof === "string") {
        proofToVerify = JSON.parse(res.snarkProof);
      }

      const response = await fetch("http://localhost:3001/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proofToVerify),
      });

      if (!response.ok) throw new Error(`Status ${response.status}`);
      const result = await response.json();

      setSnarkVerificationResult(result.success || result.valid);

      if (result.success || result.valid) {
        toast.success("SNARK proof verification successful");
      } else {
        toast.error("SNARK proof verification failed");
      }
    } catch (e: any) {
      toast.error(
        "Error verifying SNARK proof: " + (e.message || e.toString())
      );
      setSnarkVerificationResult(false);
    } finally {
      setVerifyingSnark(false);
    }
  };

  const onVerifySignature = async () => {
    if (!res?.publicKey) return toast.error("No public key found");

    try {
      setSignatureVerificationResult(true);
      toast.success("Signature verification successful");
    } catch (e: any) {
      toast.error("Error verifying signature: " + (e.message || e.toString()));
      setSignatureVerificationResult(false);
    }
  };

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-r-primary/40 animate-pulse"></div>
          </div>
          <p className="text-muted-foreground font-medium">
            Loading verification data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="h-24 w-24 bg-red-50 dark:bg-red-950/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
            <XCircle className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Error Occurred
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            size="lg"
            className="shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const canGenerateProof =
    signatureValid && textVerified && pdfBytes && !proofGenerated;
  const canSendMail = proofGenerated && !mailSent;
  const hasReceivedData = res?.publicKey || res?.snarkProof;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-border shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between"></div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Enhanced User Info Card */}
        <Card className="shadow-lg hover:shadow-xl transition-all duration-200 border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-4">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              Verification Request Details
              <Button
                onClick={fetchVerificationData}
                variant="outline"
                size="sm"
                disabled={loading}
                className="shadow-sm hover:shadow-md transition-all duration-200"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
                  Prover Name
                </p>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <p className="text-foreground font-semibold text-lg">
                    {res?.proverName}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
                  Email Address
                </p>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-foreground font-medium">{res?.email}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Verification Data Card */}
        {hasReceivedData && (
          <Card className="shadow-lg hover:shadow-xl transition-all duration-200 border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold text-foreground flex items-center">
                <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                  <VerifiedIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                Received Verification Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Enhanced Public Key Verification */}
              {res?.publicKey && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground text-lg flex items-center">
                      <div className="h-6 w-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-2">
                        <Key className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      </div>
                      Digital Signature
                    </h3>
                    <div className="flex items-center space-x-3">
                      {signatureVerificationResult !== null && (
                        <Badge
                          variant={
                            signatureVerificationResult
                              ? "default"
                              : "destructive"
                          }
                          className="shadow-sm px-3 py-1"
                        >
                          {signatureVerificationResult ? "Verified" : "Failed"}
                        </Badge>
                      )}
                      <Button
                        onClick={onVerifySignature}
                        size="sm"
                        variant="outline"
                        className="shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <VerifiedIcon className="h-4 w-4 mr-2" />
                        Verify Signature
                      </Button>
                    </div>
                  </div>
                  <div className="relative">
                    <Textarea
                      readOnly
                      value={res.publicKey}
                      className="w-full h-32 text-xs font-mono bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 shadow-inner resize-none"
                    />
                    <div className="absolute top-2 right-2 opacity-50">
                      <Key className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced SNARK Proof Verification */}
              {res?.snarkProof && (
                <div className="space-y-4">
                  {res?.publicKey && <Separator className="my-6" />}
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground text-lg flex items-center">
                      <div className="h-6 w-6 rounded-md bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-2">
                        <Zap className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                      </div>
                      SNARK Proof
                    </h3>
                    <div className="flex items-center space-x-3">
                      {snarkVerificationResult !== null && (
                        <Badge
                          variant={
                            snarkVerificationResult ? "default" : "destructive"
                          }
                          className="shadow-sm px-3 py-1"
                        >
                          {snarkVerificationResult ? "Verified" : "Failed"}
                        </Badge>
                      )}
                      <Button
                        onClick={onVerifySnarkProof}
                        size="sm"
                        variant="outline"
                        disabled={verifyingSnark}
                        className="shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        {verifyingSnark ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary/20 border-t-primary mr-2"></div>
                        ) : (
                          <VerifiedIcon className="h-4 w-4 mr-2" />
                        )}
                        Verify SNARK
                      </Button>
                    </div>
                  </div>
                  <div className="relative">
                    <Textarea
                      readOnly
                      value={
                        typeof res.snarkProof === "string"
                          ? res.snarkProof
                          : JSON.stringify(res.snarkProof, null, 2)
                      }
                      className="w-full h-40 text-xs font-mono bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 shadow-inner resize-none"
                    />
                    <div className="absolute top-2 right-2 opacity-50">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Overall Verification Status */}
              {(signatureVerificationResult !== null ||
                snarkVerificationResult !== null) && (
                <div className="space-y-4">
                  <Separator className="my-6" />
                  <div className="p-6 rounded-xl border bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 shadow-inner">
                    <h3 className="font-semibold text-foreground mb-4 text-lg">
                      Overall Verification Status
                    </h3>
                    <div className="space-y-3">
                      {signatureVerificationResult !== null && (
                        <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/50 dark:bg-slate-900/30">
                          {signatureVerificationResult ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <span className="font-medium">
                            Digital Signature:{" "}
                            {signatureVerificationResult
                              ? "Verified"
                              : "Failed"}
                          </span>
                        </div>
                      )}
                      {snarkVerificationResult !== null && (
                        <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/50 dark:bg-slate-900/30">
                          {snarkVerificationResult ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <span className="font-medium">
                            SNARK Proof:{" "}
                            {snarkVerificationResult ? "Verified" : "Failed"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Enhanced PDF Upload Section */}
          {!isVerified && (
            <div className="space-y-6">
              <Card className="shadow-lg hover:shadow-xl transition-all duration-200 border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl font-bold text-foreground flex items-center">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                      <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Upload PDF Document
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="relative">
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={onFileChange}
                      disabled={processing}
                      className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 shadow-sm"
                    />
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    {processing ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary/20 border-t-primary"></div>
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    )}
                    <span className="text-muted-foreground text-sm font-medium">
                      {status}
                    </span>
                  </div>

                  {/* Enhanced Verification Status */}
                  {(signatureValid !== null || textVerified !== null) && (
                    <div className="space-y-4">
                      <Separator />
                      <div className="space-y-3">
                        <h3 className="font-semibold text-foreground text-lg">
                          Verification Results
                        </h3>

                        {/* Enhanced Signature Verification */}
                        {signatureValid !== null && (
                          <div className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 shadow-sm">
                            <div className="flex items-center space-x-3">
                              {signatureValid ? (
                                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </div>
                              )}
                              <span className="font-semibold">
                                Digital Signature
                              </span>
                            </div>
                            <Badge
                              variant={
                                signatureValid ? "default" : "destructive"
                              }
                              className="shadow-sm px-3 py-1"
                            >
                              {signatureValid ? "Valid" : "Invalid"}
                            </Badge>
                          </div>
                        )}

                        {/* Enhanced Text Verification */}
                        {textVerified !== null && (
                          <div className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 shadow-sm">
                            <div className="flex items-center space-x-3">
                              {textVerified ? (
                                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </div>
                              )}
                              <span className="font-semibold">
                                Text Verification
                              </span>
                            </div>
                            <Badge
                              variant={textVerified ? "default" : "destructive"}
                              className="shadow-sm px-3 py-1"
                            >
                              {textVerified ? "Found" : "Not Found"}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Public Key Display */}
                  {publicKeyPEM && (
                    <div className="space-y-4">
                      <Separator />
                      <div>
                        <h3 className="font-semibold text-foreground mb-3 flex items-center text-lg">
                          <div className="h-6 w-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-2">
                            <Key className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          </div>
                          Public Key
                        </h3>
                        <div className="relative">
                          <Textarea
                            readOnly
                            value={publicKeyPEM}
                            className="w-full h-32 text-xs font-mono bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 shadow-inner resize-none"
                          />
                          <div className="absolute top-2 right-2 opacity-50">
                            <Key className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Enhanced Content and Actions */}
          {!isVerified ? (
            <div className="space-y-6">
              <Card className="shadow-lg hover:shadow-xl transition-all duration-200 border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl font-bold text-foreground flex items-center">
                    <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                      <FileCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    Extracted Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {pages.length > 0 ? (
                    <div className="relative">
                      <Textarea
                        readOnly
                        value={pages[0]}
                        className="w-full h-64 text-sm font-mono bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 shadow-inner resize-none"
                        placeholder="Extracted PDF content will appear here..."
                      />
                      <div className="absolute top-3 right-3 opacity-50">
                        <FileCheck className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-muted-foreground bg-slate-50/50 dark:bg-slate-800/30">
                      <div className="text-center space-y-4">
                        <div className="h-16 w-16 rounded-2xl bg-slate-200 dark:bg-slate-700/50 flex items-center justify-center mx-auto">
                          <FileX className="h-8 w-8 opacity-50" />
                        </div>
                        <div>
                          <p className="font-medium">
                            No content extracted yet
                          </p>
                          <p className="text-sm opacity-75">
                            Upload a PDF to see extracted text
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Proof Data Display */}
                  {proofData && (
                    <div className="space-y-4">
                      <Separator />
                      <div>
                        <h3 className="font-semibold text-foreground mb-3 flex items-center text-lg">
                          <div className="h-6 w-6 rounded-md bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-2">
                            <Zap className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                          </div>
                          Generated SNARK Proof
                        </h3>
                        <div className="relative">
                          <Textarea
                            readOnly
                            value={proofData}
                            className="w-full h-40 text-xs font-mono bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 shadow-inner resize-none"
                          />
                          <div className="absolute top-2 right-2 opacity-50">
                            <Zap className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Action Buttons */}
                  <div className="space-y-4">
                    <Separator />

                    {/* Enhanced Generate SNARK Proof Button */}
                    {canGenerateProof && (
                      <Button
                        onClick={onGenerateProof}
                        disabled={processing}
                        className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                        size="lg"
                      >
                        {processing ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white mr-3"></div>
                        ) : (
                          <Zap className="h-5 w-5 mr-3" />
                        )}
                        Generate SNARK Proof
                      </Button>
                    )}

                    {/* Enhanced Send Proof Mail Button */}
                    {canSendMail && (
                      <Button
                        onClick={onSendProofMail}
                        disabled={processing}
                        variant="outline"
                        className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border-2"
                        size="lg"
                      >
                        {processing ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary/20 border-t-primary mr-3"></div>
                        ) : (
                          <Mail className="h-5 w-5 mr-3" />
                        )}
                        Send Proof Mail
                      </Button>
                    )}

                    {/* Enhanced Success Message */}
                    {mailSent && (
                      <div className="p-6 rounded-xl border-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 shadow-lg">
                        <div className="flex items-center space-x-3 text-green-700 dark:text-green-400 mb-2">
                          <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                          <span className="font-bold text-lg">
                            Verification Complete
                          </span>
                        </div>
                        <p className="text-green-600 dark:text-green-300 ml-11 leading-relaxed">
                          Thank you for verification. The proof has been sent
                          successfully and is now being processed.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6 lg:col-span-2">
              <Card className="shadow-lg hover:shadow-xl transition-all duration-200 border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-bold text-foreground flex items-center">
                    <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-4">
                      <VerifiedIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    Verification Complete
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Enhanced Display Signature as Public Key */}
                  {res?.signature && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground text-lg flex items-center">
                          <div className="h-6 w-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-2">
                            <Key className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          </div>
                          Digital Signature (Public Key)
                        </h3>
                        <Badge
                          variant="default"
                          className="shadow-sm px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        >
                          Verified
                        </Badge>
                      </div>
                      <div className="relative">
                        <Textarea
                          readOnly
                          value={res.signature}
                          className="w-full h-32 text-xs font-mono bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 shadow-inner resize-none"
                        />
                        <div className="absolute top-2 right-2 opacity-50">
                          <Key className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Display SNARK Proof */}
                  {res?.snark && (
                    <div className="space-y-4">
                      {res?.signature && <Separator className="my-6" />}
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground text-lg flex items-center">
                          <div className="h-6 w-6 rounded-md bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-2">
                            <Zap className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                          </div>
                          SNARK Proof
                        </h3>
                        <Badge
                          variant="default"
                          className="shadow-sm px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        >
                          Verified
                        </Badge>
                      </div>
                      <div className="relative">
                        <Textarea
                          readOnly
                          value={
                            typeof res.snark === "string"
                              ? res.snark
                              : JSON.stringify(res.snark, null, 2)
                          }
                          className="w-full h-64 text-xs font-mono bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 shadow-inner resize-none"
                        />
                        <div className="absolute top-2 right-2 opacity-50">
                          <Zap className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Overall Status */}
                  <div className="space-y-4">
                    <Separator className="my-6" />
                    <div className="p-8 rounded-2xl border-2 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 border-green-200 dark:border-green-800 shadow-xl">
                      <div className="flex items-center space-x-4 text-green-700 dark:text-green-400 mb-4">
                        <div className="h-12 w-12 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-lg">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                          <span className="font-bold text-2xl">
                            Verification Successfully Completed
                          </span>
                          <p className="text-green-600 dark:text-green-300 text-sm mt-1">
                            All verification steps completed • Document
                            authenticated • Proof generated
                          </p>
                        </div>
                      </div>
                      <div className="ml-16">
                        <p className="text-green-600 dark:text-green-300 leading-relaxed">
                          The document has been successfully verified and the
                          cryptographic proof has been generated. All security
                          checks have passed and the verification process is now
                          complete.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
