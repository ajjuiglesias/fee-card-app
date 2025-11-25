"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    business_name: "",
    upi_id: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // NOTE: Ensure your Backend is running on Port 5000
      // Use the environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const url = `${API_URL}/tutors/register`;
      
      // We are reusing the register endpoint. 
      // Logic: If user exists, backend throws error -> We treat as Login for MVP.
      const res = await axios.post(url, formData);

      if (res.status === 201) {
        // Success: Save to LocalStorage
        localStorage.setItem("tutor", JSON.stringify(res.data.tutor));
        router.push("/dashboard");
      }
    } catch (err: any) {
      if (err.response && err.response.data.error.includes("already registered")) {
        // Mock Login: In real app, you would verify OTP here.
        // For now, we assume if they know the phone, they can enter.
        alert("Phone already registered! Logging you in...");
        router.push("/dashboard");
      } else {
        setError(err.response?.data?.error || "Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {isRegistering ? "Tutor Registration" : "Welcome Back"}
          </CardTitle>
          <CardDescription className="text-center">
            {isRegistering
              ? "Create your digital fee collection account"
              : "Login to manage your students and fees"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    placeholder="e.g. Amit Kumar"
                    required
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_name">Tuition Name</Label>
                  <Input
                    id="business_name"
                    name="business_name"
                    placeholder="e.g. Amit Physics Classes"
                    required
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upi_id">UPI ID (For Payments)</Label>
                  <Input
                    id="upi_id"
                    name="upi_id"
                    placeholder="e.g. amit@oksbi"
                    required
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Mobile Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="9876543210"
                required
                className="text-lg"
                onChange={handleChange}
              />
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Processing..." : isRegistering ? "Create Account" : "Login"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="link"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-gray-600"
          >
            {isRegistering
              ? "Already have an account? Login"
              : "New to Digital Fee Card? Register"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}