// client/src/app/pay/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import Script from "next/script";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Extract params
  const amount = searchParams.get("am");
  const studentId = searchParams.get("sid");
  const tutorId = searchParams.get("tid");
  const businessName = searchParams.get("pn"); // Display name
  
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const handlePay = async () => {
    if (!amount || !studentId || !tutorId) {
      alert("Invalid Payment Link");
      return;
    }

    // Check if Razorpay script is loaded
    if (!scriptLoaded || !(window as any).Razorpay) {
      alert("Payment system is loading. Please try again in a moment.");
      return;
    }

    setIsLoading(true);
    console.log("🔄 Initiating payment...", { amount, studentId, tutorId });

    try {
      // 1. Create Order
      console.log("📡 Creating order at:", `${API_URL}/payment/order`);
      const orderRes = await axios.post(`${API_URL}/payment/order`, {
        amount: amount,
        student_id: studentId,
        tutor_id: tutorId,
        month_name: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
      });

      console.log("✅ Order created:", orderRes.data);
      const { id: order_id, currency, key_id } = orderRes.data;

      // 2. Open Razorpay
      const options = {
        key: key_id, 
        amount: parseFloat(amount) * 100,
        currency: currency,
        name: businessName || "Fee Payment",
        description: "Monthly Tuition Fee",
        order_id: order_id,
        handler: async function (response: any) {
          // 3. Payment Success - Verify on Backend
          console.log("💳 Payment completed, verifying...", response);
          try {
             const verifyRes = await axios.post(`${API_URL}/payment/verify`, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            console.log("✅ Payment verified:", verifyRes.data);
            if (verifyRes.data.status === "success") {
              // Open WhatsApp with receipt
              if (verifyRes.data.whatsapp_url) {
                console.log("📱 Opening WhatsApp with receipt...");
                window.open(verifyRes.data.whatsapp_url, '_blank');
              }
              alert("Payment Successful! Receipt link has been sent to WhatsApp.");
            }
          } catch (err: any) {
            console.error("❌ Verification failed:", err);
            alert(`Payment verification failed: ${err.response?.data?.error || err.message}`);
          }
        },
        modal: {
          ondismiss: function() {
            console.log("⚠️ Payment cancelled by user");
            setIsLoading(false);
          }
        },
        prefill: {
          name: "Parent", // You could pass parent name in URL to prefill this
          contact: "",    // You could pass parent phone in URL to prefill this
        },
        theme: {
          color: "#2563eb",
        },
      };

      console.log("🚀 Opening Razorpay modal...");
      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
      
    } catch (err: any) {
      console.error("❌ Payment initiation failed:", err);
      const errorMessage = err.response?.data?.error || err.message || "Unknown error";
      alert(`Failed to initiate payment: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Load Razorpay SDK */}
      <Script 
        src="https://checkout.razorpay.com/v1/checkout.js" 
        onLoad={() => {
          console.log("✅ Razorpay script loaded");
          setScriptLoaded(true);
        }}
        onError={() => {
          console.error("❌ Failed to load Razorpay script");
          alert("Failed to load payment system. Please refresh the page.");
        }}
      />

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center border-b bg-white">
          <CardTitle className="text-xl text-gray-800">Fee Payment</CardTitle>
          <p className="text-sm text-gray-500">{businessName}</p>
        </CardHeader>
        <CardContent className="p-6 space-y-6 text-center">
          
          <div className="py-4">
            <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Amount Due</p>
            <p className="text-4xl font-bold text-blue-600 mt-1">₹{amount}</p>
          </div>

          <div className="bg-green-50 text-green-700 text-sm p-3 rounded-md flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Secure Payment via Razorpay
          </div>

          <Button 
            className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700" 
            onClick={handlePay}
            disabled={isLoading || !scriptLoaded}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Processing...
              </div>
            ) : !scriptLoaded ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : (
              `Pay ₹${amount}`
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <PaymentPageContent />
    </Suspense>
  );
}