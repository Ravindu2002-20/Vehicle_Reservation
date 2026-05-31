"use client";

import { useState, useEffect } from "react";
import { FileCheck, Users, TrendingUp, Calendar, Clock, CheckCircle, XCircle, Car, User as UserIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { toast } from "sonner";

interface AdminStats {
  pendingApprovals: number;
  approvedToday: number;
  rejectedCount: number;
  totalUsers: number;
}

interface PendingRequest {
  id: number;
  requester: { full_name: string };
  department?: { department_name?: string };
  vehicle_nature: string;
  travel_date_from: string;
  approval_status: string;
}

export function FacultyAdminDashboard({ currentPage }: { currentPage?: string }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [statsRes, requestsRes] = await Promise.all([
        fetch("/api/stats?type=admin"),
        fetch("/api/vehicle-requests?status=pending"),
      ]);
      const statsData = await statsRes.json();
      const requestsData = await requestsRes.json();
      if (statsData.data) setStats(statsData.data);
      if (requestsData.data) setPendingRequests(requestsData.data);
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleApprove = async (requestId: number) => {
    try {
      const res = await fetch(`/api/vehicle-requests/${requestId}/approve`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Request #${requestId} approved successfully!`);
        fetchData();
      } else {
        toast.error(data.error || "Failed to approve");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      const res = await fetch(`/api/vehicle-requests/${requestId}/reject`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.error(`Request #${requestId} rejected`);
        fetchData();
      } else {
        toast.error(data.error || "Failed to reject");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Faculty Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage faculty vehicle reservations and approvals</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-lg border-0 border-l-4 border-t-2 border-t-orange-500 border-l-amber-500 rounded-xl hover:shadow-2xl hover:scale-[1.03] hover:brightness-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Approvals</p>
                <p className="text-3xl font-bold text-amber-600">{stats?.pendingApprovals || 0}</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 border-l-4 border-t-2 border-t-orange-500 border-l-emerald-500 rounded-xl hover:shadow-2xl hover:scale-[1.03] hover:brightness-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Approved Today</p>
                <p className="text-3xl font-bold text-emerald-600">{stats?.approvedToday || 0}</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 border-l-4 border-t-2 border-t-orange-500 border-l-red-500 rounded-xl hover:shadow-2xl hover:scale-[1.03] hover:brightness-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{stats?.rejectedCount || 0}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 border-l-4 border-t-2 border-t-orange-500 border-l-orange-500 rounded-xl hover:shadow-2xl hover:scale-[1.03] hover:brightness-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-orange-600">{stats?.totalUsers || 0}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Users className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approval Queue */}
      <Card className="shadow-lg border-0 rounded-xl hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-t-2 border-t-orange-500 rounded-t-xl">
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <FileCheck className="w-5 h-5" />
            Pending Approval Queue
          </CardTitle>
          <CardDescription>Review and approve student vehicle requests</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-amber-50/50 hover:bg-amber-50/50">
                  <TableHead className="font-bold">Request ID</TableHead>
                  <TableHead className="font-bold">Student Name</TableHead>
                  <TableHead className="font-bold">Vehicle Type</TableHead>
                  <TableHead className="font-bold">Date</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No pending requests
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingRequests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-orange-50 transition-all duration-200">
                      <TableCell className="font-medium text-orange-600">REQ-{request.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-gray-500" />
                          {request.requester?.full_name || "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-gray-500" />
                          {request.vehicle_nature}
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.travel_date_from
                          ? new Date(request.travel_date_from).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300">Pending</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 hover:scale-105 transition-all duration-200 text-white"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(request.id)}
                            className="hover:scale-105 transition-all duration-200"
                          >
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}