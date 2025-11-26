"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Plus, User, Trash2, CheckCircle2, Clock, FolderOpen, Edit2, Users } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Types
import { Tutor } from "@/types";

interface Student {
  id: string;
  name: string;
  parent_phone: string;
  standard_fee: string;
  batch_id?: string;
  status?: "PAID" | "PENDING";
  last_payment_month?: string;
}

interface Batch {
  id: string;
  name: string;
  description?: string;
  standard_fee?: string;
  student_count?: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Dialog States
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [isEditBatchDialogOpen, setIsEditBatchDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  // Form States
  const [newStudent, setNewStudent] = useState({
    name: "",
    parent_phone: "",
    standard_fee: "",
    batch_id: "",
  });

  const [newBatch, setNewBatch] = useState({
    name: "",
    description: "",
    standard_fee: "",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  // Load Data on Startup
  useEffect(() => {
    const storedTutor = localStorage.getItem("tutor");
    if (!storedTutor) {
      router.push("/login");
      return;
    }

    const tutorData = JSON.parse(storedTutor);
    setTutor(tutorData);
    fetchStudents(tutorData.id);
    fetchBatches(tutorData.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!tutor) return;
    
    const interval = setInterval(() => {
      fetchStudents(tutor.id);
      fetchBatches(tutor.id);
    }, 30000);

    return () => clearInterval(interval);
  }, [tutor]);

  // Fetch Students
  const fetchStudents = async (tutorId: string) => {
    try {
      const res = await axios.get(`${API_URL}/students/${tutorId}`);
      setStudents(res.data);
    } catch (error) {
      console.error("Failed to load students", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Batches
  const fetchBatches = async (tutorId: string) => {
    try {
      const res = await axios.get(`${API_URL}/batches/${tutorId}`);
      setBatches(res.data);
    } catch (error) {
      console.error("Failed to load batches", error);
    }
  };

  // Handle Add Student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutor) return;

    try {
      await axios.post(`${API_URL}/students/add`, {
        tutor_id: tutor.id,
        ...newStudent,
        batch_id: newStudent.batch_id || null,
      });

      fetchStudents(tutor.id);
      fetchBatches(tutor.id);
      setIsStudentDialogOpen(false);
      setNewStudent({ name: "", parent_phone: "", standard_fee: "", batch_id: "" });
    } catch (error) {
      alert("Failed to add student");
    }
  };

  // Handle Add Batch
  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutor) return;

    try {
      await axios.post(`${API_URL}/batches/create`, {
        tutor_id: tutor.id,
        ...newBatch,
      });

      fetchBatches(tutor.id);
      setIsBatchDialogOpen(false);
      setNewBatch({ name: "", description: "", standard_fee: "" });
    } catch (error) {
      alert("Failed to create batch");
    }
  };

  // Handle Edit Batch
  const handleEditBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;

    try {
      await axios.put(`${API_URL}/batches/${editingBatch.id}`, {
        name: newBatch.name,
        description: newBatch.description,
        standard_fee: newBatch.standard_fee,
      });

      fetchBatches(tutor!.id);
      setIsEditBatchDialogOpen(false);
      setEditingBatch(null);
      setNewBatch({ name: "", description: "", standard_fee: "" });
    } catch (error) {
      alert("Failed to update batch");
    }
  };

  // Handle Delete Batch
  const handleDeleteBatch = async (batchId: string, batchName: string) => {
    try {
      await axios.delete(`${API_URL}/batches/${batchId}`);
      fetchBatches(tutor!.id);
      fetchStudents(tutor!.id);
    } catch (error) {
      alert(`Failed to delete ${batchName}`);
    }
  };

  // Handle Delete Student
  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    try {
      await axios.delete(`${API_URL}/students/${studentId}`);
      fetchStudents(tutor!.id);
      fetchBatches(tutor!.id);
    } catch (error) {
      alert(`Failed to delete ${studentName}`);
    }
  };

  // Handle Request Payment
  const handleRequestPayment = (student: Student) => {
    if (!tutor) return;

    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      sid: student.id,
      tid: tutor.id,
      am: student.standard_fee,
      pn: tutor.business_name,
      tn: `Fee for ${student.name}`,
    });

    const paymentPageLink = `${baseUrl}/pay?${params.toString()}`;
    const messageText = encodeURIComponent(
      `*Fees Due for ${student.name}: ₹${student.standard_fee}*\\n\\nClick below to pay securely:\\n${paymentPageLink}\\n\\n*Receipt will be sent automatically after payment.*`
    );

    const whatsappUrl = `https://wa.me/${student.parent_phone}?text=${messageText}`;
    window.open(whatsappUrl, "_blank");
  };

  // Handle Mark Paid
  const handleMarkPaid = async (student: Student) => {
    if (!confirm(`Mark ${student.name} as PAID for this month?`)) return;

    try {
      const res1 = await axios.post(`${API_URL}/invoices/create`, {
        student_id: student.id,
        tutor_id: tutor?.id,
        month_name: new Date().toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
        amount: student.standard_fee,
      });

      const invoiceId = res1.data.invoice.id;
      await axios.put(`${API_URL}/invoices/${invoiceId}/pay`);

      const receiptLink = `${API_URL}/invoices/${invoiceId}/receipt`;
      const message = `Hello! Fees for ${student.name} is received. Your receipt is ready! Download here: ${receiptLink}`;
      const whatsappUrl = `https://wa.me/${student.parent_phone}?text=${encodeURIComponent(message)}`;

      window.open(whatsappUrl, "_blank");
      fetchStudents(tutor!.id);
    } catch (err: any) {
      alert(err.response?.data?.error || "Error marking paid");
    }
  };

  // Open Edit Batch Dialog
  const openEditBatchDialog = (batch: Batch) => {
    setEditingBatch(batch);
    setNewBatch({
      name: batch.name,
      description: batch.description || "",
      standard_fee: batch.standard_fee || "",
    });
    setIsEditBatchDialogOpen(true);
  };

  // Filter students
  const filteredStudents = students.filter((student) => {
    if (activeTab === "paid") return student.status === "PAID";
    if (activeTab === "unpaid") return student.status === "PENDING" || !student.status;
    return true;
  });

  // Group students by batch
  const studentsByBatch = filteredStudents.reduce((acc, student) => {
    const batchId = student.batch_id || "no-batch";
    if (!acc[batchId]) acc[batchId] = [];
    acc[batchId].push(student);
    return acc;
  }, {} as Record<string, Student[]>);

  const paidCount = students.filter((s) => s.status === "PAID").length;
  const unpaidCount = students.filter((s) => s.status === "PENDING" || !s.status).length;

  if (isLoading) return <div className="p-10 text-center">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div>
            <h1 className="text-xl font-bold text-gray-800">My Students</h1>
            <p className="text-sm text-gray-500">{tutor?.business_name}</p>
          </div>

          <div className="flex gap-2">
            {/* Add Batch Button */}
            <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Add Batch
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Batch/Class</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddBatch} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Batch Name *</Label>
                    <Input
                      required
                      value={newBatch.name}
                      onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                      placeholder="Grade 10 - Physics"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newBatch.description}
                      onChange={(e) => setNewBatch({ ...newBatch, description: e.target.value })}
                      placeholder="Optional description"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Fee (₹)</Label>
                    <Input
                      type="number"
                      value={newBatch.standard_fee}
                      onChange={(e) => setNewBatch({ ...newBatch, standard_fee: e.target.value })}
                      placeholder="500 (optional)"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Batch
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Add Student Button */}
            <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-full h-10 w-10 p-0">
                  <Plus className="h-6 w-6" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddStudent} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Student Name *</Label>
                    <Input
                      required
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                      placeholder="Rahul Kumar"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parent's WhatsApp *</Label>
                    <Input
                      required
                      type="tel"
                      value={newStudent.parent_phone}
                      onChange={(e) => setNewStudent({ ...newStudent, parent_phone: e.target.value })}
                      placeholder="9876543210"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Batch/Class</Label>
                    <Select
                      value={newStudent.batch_id}
                      onValueChange={(value) => {
                        const selectedBatch = batches.find(b => b.id === value);
                        setNewStudent({
                          ...newStudent,
                          batch_id: value,
                          standard_fee: selectedBatch?.standard_fee || newStudent.standard_fee
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select batch (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Batch</SelectItem>
                        {batches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Monthly Fee (₹) *</Label>
                    <Input
                      required
                      type="number"
                      value={newStudent.standard_fee}
                      onChange={(e) => setNewStudent({ ...newStudent, standard_fee: e.target.value })}
                      placeholder="500"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Save Student
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Batches Overview */}
      {batches.length > 0 && (
        <div className="max-w-6xl mx-auto p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Batches/Classes
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {batches.map((batch) => (
              <Card key={batch.id} className="relative group">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-gray-800">{batch.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Users className="h-3 w-3" />
                        {batch.student_count} students
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => openEditBatchDialog(batch)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Batch?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will delete <strong>{batch.name}</strong>. Students in this batch will remain but won't be in any batch.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleDeleteBatch(batch.id, batch.name)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Edit Batch Dialog */}
      <Dialog open={isEditBatchDialogOpen} onOpenChange={setIsEditBatchDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditBatch} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Batch Name</Label>
              <Input
                required
                value={newBatch.name}
                onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newBatch.description}
                onChange={(e) => setNewBatch({ ...newBatch, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Default Fee (₹)</Label>
              <Input
                type="number"
                value={newBatch.standard_fee}
                onChange={(e) => setNewBatch({ ...newBatch, standard_fee: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full">
              Update Batch
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Filter Tabs */}
      <div className="max-w-6xl mx-auto px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All ({students.length})</TabsTrigger>
            <TabsTrigger value="unpaid">Unpaid ({unpaidCount})</TabsTrigger>
            <TabsTrigger value="paid">Paid ({paidCount})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredStudents.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">
                <User className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No students in this category.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Students grouped by batch */}
                {Object.entries(studentsByBatch).map(([batchId, batchStudents]) => {
                  const batch = batches.find(b => b.id === batchId);
                  const batchName = batch?.name || "No Batch";
                  
                  return (
                    <div key={batchId}>
                      <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        {batchName} ({batchStudents.length})
                      </h3>
                      <div className="space-y-3">
                        {batchStudents.map((student) => (
                          <Card key={student.id} className="overflow-hidden shadow-sm hover:shadow-md transition">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <Avatar>
                                    <AvatarFallback className="bg-gray-100 text-gray-700 font-bold">
                                      {student.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold text-gray-800">{student.name}</h3>
                                      {student.status === "PAID" ? (
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Paid
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                                          <Clock className="h-3 w-3 mr-1" />
                                          Pending
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      Fee: ₹{student.standard_fee}
                                      {student.last_payment_month && (
                                        <span className="ml-2">• Last paid: {student.last_payment_month}</span>
                                      )}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex gap-2 items-center">
                                  <Button
                                    size="sm"
                                    onClick={() => handleRequestPayment(student)}
                                  >
                                    Request Fee
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMarkPaid(student)}
                                  >
                                    Mark Paid
                                  </Button>
                                  
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="icon" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Student?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will permanently delete <strong>{student.name}</strong> and all their payment records.
                                          This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-red-600 hover:bg-red-700"
                                          onClick={() => handleDeleteStudent(student.id, student.name)}
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
