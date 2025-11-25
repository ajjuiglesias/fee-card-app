"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Plus, User, CheckCircle2, Clock } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Types
import { Tutor } from "@/types";

interface Student {
  id: string;
  name: string;
  parent_phone: string;
  standard_fee: string;
  // We will add 'status' logic later, assuming 'PENDING' for now
  status?: "PAID" | "PENDING";
}

export default function Dashboard() {
  const router = useRouter();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State for Adding Student
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    parent_phone: "",
    standard_fee: "",
  });

  // 1. Load Data on Startup
  useEffect(() => {
    const storedTutor = localStorage.getItem("tutor");
    if (!storedTutor) {
      router.push("/login"); // Kick them out if not logged in
      return;
    }

    const tutorData = JSON.parse(storedTutor);
    setTutor(tutorData);
    fetchStudents(tutorData.id);
  }, [router]);

  // 2. Fetch Students from Backend
  const fetchStudents = async (tutorId: string) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/students/${tutorId}`
      );
      setStudents(res.data);
    } catch (error) {
      console.error("Failed to load students", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Add Student Submit
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutor) return;

    try {
      await axios.post(`http://localhost:5000/api/students/add`, {
        tutor_id: tutor.id,
        ...newStudent,
      });
      
      // Refresh list and close popup
      fetchStudents(tutor.id);
      setIsDialogOpen(false);
      setNewStudent({ name: "", parent_phone: "", standard_fee: "" }); // Reset form
    } catch (error) {
      alert("Failed to add student");
    }
  };

  if (isLoading) return <div className="p-10 text-center">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div>
            <h1 className="text-xl font-bold text-gray-800">My Students</h1>
            <p className="text-sm text-gray-500">{tutor?.business_name}</p>
          </div>
          
          {/* Add Student Button (Opens Modal) */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 rounded-full h-10 w-10 p-0">
                <Plus className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddStudent} className="space-y-4 mt-2">
                <div>
                  <Label>Student Name</Label>
                  <Input 
                    required 
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                    placeholder="Rahul Kumar" 
                  />
                </div>
                <div>
                  <Label>Parent's WhatsApp</Label>
                  <Input 
                    required 
                    type="tel"
                    value={newStudent.parent_phone}
                    onChange={(e) => setNewStudent({...newStudent, parent_phone: e.target.value})}
                    placeholder="9876543210" 
                  />
                </div>
                <div>
                  <Label>Monthly Fee (₹)</Label>
                  <Input 
                    required 
                    type="number"
                    value={newStudent.standard_fee}
                    onChange={(e) => setNewStudent({...newStudent, standard_fee: e.target.value})}
                    placeholder="500" 
                  />
                </div>
                <Button type="submit" className="w-full">Save Student</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Student List */}
      <div className="max-w-md mx-auto p-4 space-y-3">
        {students.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <User className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No students yet.</p>
            <p className="text-sm">Click the + button to add one.</p>
          </div>
        ) : (
          students.map((student) => (
            <Card key={student.id} className="overflow-hidden shadow-sm hover:shadow-md transition">
              <CardContent className="p-4 flex items-center justify-between">
  <div className="flex items-center gap-3">
    <Avatar>
      <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
        {student.name.charAt(0)}
      </AvatarFallback>
    </Avatar>
    <div>
      <h3 className="font-semibold text-gray-800">{student.name}</h3>
      <p className="text-xs text-gray-500">Fee: ₹{student.standard_fee}</p>
    </div>
  </div>

  <div className="flex gap-2">
    {/* 
       For this MVP, we will simulate the flow:
       Clicking this button creates a PAID invoice for "November" immediately
       and opens the receipt.
    */}
    <Button 
      size="sm" 
      variant="outline" 
      className="text-green-600 border-green-200 hover:bg-green-50"
      onClick={async () => {
        if(!confirm(`Mark ${student.name} as PAID for this month?`)) return;
        
        try {
          // 1. Create Invoice
          const res1 = await axios.post('http://localhost:5000/api/invoices/create', {
            student_id: student.id,
            tutor_id: tutor?.id,
            month_name: "November 2025", // Hardcoded for demo
            amount: student.standard_fee
          });
          
          const invoiceId = res1.data.invoice.id;

          // 2. Mark Paid
          await axios.put(`http://localhost:5000/api/invoices/${invoiceId}/pay`);

          // 3. Open Receipt in New Tab
          window.open(`http://localhost:5000/api/invoices/${invoiceId}/receipt`, '_blank');
          
        } catch (err: any) {
           alert(err.response?.data?.error || "Error marking paid");
        }
      }}
    >
      Mark Paid
    </Button>
  </div>
</CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}