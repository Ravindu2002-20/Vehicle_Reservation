import { useMemo, useState } from "react";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Calendar, Car, ChevronDown, FileText, Filter, MapPin, MessageSquare, Search, XCircle, CheckCircle } from "lucide-react";

type ApprovalStatus = "approved" | "pending" | "rejected";
type AllocationStatus = "allocated" | "not-allocated" | "pending";

type Request = {
  id: string;
  requestDate: string;
  vehicleType: string;
  reservationDate: string;
  destination: string;
  approvalStatus: ApprovalStatus;
  allocationStatus: AllocationStatus;
  purpose: string;
};

type Complaint = {
  id: string;
  requestId: string;
  complaintDate: string;
  category: "delay" | "vehicle-quality" | "behavior" | "other";
  status: "open" | "in-review" | "resolved";
  message: string;
};

const mockRequests: Request[] = [
  {
    id: "REQ-2026-001",
    requestDate: "May 5, 2026",
    vehicleType: "SUV",
    reservationDate: "May 10, 2026",
    destination: "City Convention Center",
    approvalStatus: "approved",
    allocationStatus: "allocated",
    purpose: "Academic Conference",
  },
  {
    id: "REQ-2026-002",
    requestDate: "May 4, 2026",
    vehicleType: "Van",
    reservationDate: "May 12, 2026",
    destination: "Research Laboratory",
    approvalStatus: "pending",
    allocationStatus: "pending",
    purpose: "Research Field Trip",
  },
  {
    id: "REQ-2026-003",
    requestDate: "May 3, 2026",
    vehicleType: "Sedan",
    reservationDate: "May 8, 2026",
    destination: "Downtown Library",
    approvalStatus: "rejected",
    allocationStatus: "not-allocated",
    purpose: "Document Collection",
  },
  {
    id: "REQ-2026-004",
    requestDate: "May 2, 2026",
    vehicleType: "Bus",
    reservationDate: "May 15, 2026",
    destination: "State University Campus",
    approvalStatus: "approved",
    allocationStatus: "allocated",
    purpose: "Inter-University Sports Event",
  },
  {
    id: "REQ-2026-005",
    requestDate: "May 1, 2026",
    vehicleType: "Sedan",
    reservationDate: "May 7, 2026",
    destination: "Medical Center",
    approvalStatus: "approved",
    allocationStatus: "pending",
    purpose: "Medical Emergency Drill",
  },
  {
    id: "REQ-2026-006",
    requestDate: "April 30, 2026",
    vehicleType: "Van",
    reservationDate: "May 5, 2026",
    destination: "Museum of Science",
    approvalStatus: "pending",
    allocationStatus: "not-allocated",
    purpose: "Educational Tour",
  },
];

const mockComplaints: Complaint[] = [
  {
    id: "CMP-2026-001",
    requestId: "REQ-2026-002",
    complaintDate: "May 6, 2026",
    category: "delay",
    status: "open",
    message: "Vehicle pickup was delayed by ~45 minutes.",
  },
  {
    id: "CMP-2026-002",
    requestId: "REQ-2026-001",
    complaintDate: "May 10, 2026",
    category: "vehicle-quality",
    status: "in-review",
    message: "Seat condition not satisfactory; requested maintenance verification.",
  },
  {
    id: "CMP-2026-003",
    requestId: "REQ-2026-004",
    complaintDate: "May 16, 2026",
    category: "behavior",
    status: "resolved",
    message: "Driver communication issue resolved after discussion.",
  },
];

function getApprovalStatusBadge(status: ApprovalStatus) {
  switch (status) {
    case "approved":
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200">Approved</Badge>;
    case "pending":
      return <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200">Pending</Badge>;
    case "rejected":
      return <Badge className="bg-red-100 text-red-800 border-red-300 hover:bg-red-200">Rejected</Badge>;
  }
}

function getAllocationStatusBadge(status: AllocationStatus) {
  switch (status) {
    case "allocated":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200">Allocated</Badge>;
    case "pending":
      return <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200">Pending</Badge>;
    case "not-allocated":
      return <Badge className="bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200">Not Allocated</Badge>;
  }
}

function getComplaintStatusBadge(status: Complaint["status"]) {
  switch (status) {
    case "open":
      return <Badge className="bg-red-100 text-red-800 border-red-300 hover:bg-red-200">Open</Badge>;
    case "in-review":
      return <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200">In Review</Badge>;
    case "resolved":
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200">Resolved</Badge>;
  }
}

function categoryLabel(c: Complaint["category"]) {
  switch (c) {
    case "delay":
      return "Delay";
    case "vehicle-quality":
      return "Vehicle Quality";
    case "behavior":
      return "Driver Behavior";
    case "other":
      return "Other";
  }
}

export function SeniorOfficerDashboard({ currentPage }: { currentPage?: string }) {
  const [requestSearch, setRequestSearch] = useState("");
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>("all");
  const [complaintSearch, setComplaintSearch] = useState("");
  const [complaintStatusFilter, setComplaintStatusFilter] = useState<string>("all");
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);

  const filteredRequests = useMemo(() => {
    const q = requestSearch.trim().toLowerCase();
    return mockRequests.filter((req) => {
      const matchesSearch =
        req.id.toLowerCase().includes(q) ||
        req.vehicleType.toLowerCase().includes(q) ||
        req.destination.toLowerCase().includes(q) ||
        req.purpose.toLowerCase().includes(q);
      const matchesStatus = requestStatusFilter === "all" || req.approvalStatus === requestStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requestSearch, requestStatusFilter]);

  const filteredComplaints = useMemo(() => {
    const q = complaintSearch.trim().toLowerCase();
    return mockComplaints.filter((c) => {
      const matchesSearch =
        c.id.toLowerCase().includes(q) ||
        c.requestId.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q);
      const matchesStatus = complaintStatusFilter === "all" || c.status === complaintStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [complaintSearch, complaintStatusFilter]);

  const statusCounts = useMemo(() => {
    return {
      all: mockRequests.length,
      approved: mockRequests.filter((r) => r.approvalStatus === "approved").length,
      pending: mockRequests.filter((r) => r.approvalStatus === "pending").length,
      rejected: mockRequests.filter((r) => r.approvalStatus === "rejected").length,
      complaintsOpen: mockComplaints.filter((c) => c.status === "open").length,
      complaintsReview: mockComplaints.filter((c) => c.status === "in-review").length,
      complaintsResolved: mockComplaints.filter((c) => c.status === "resolved").length,
    };
  }, []);

  const handleResolve = (complaintId: string) => {
    // Demo action
    // eslint-disable-next-line no-alert
    alert(`Resolved complaint ${complaintId} (demo)`);
  };

  const handleMarkReview = (complaintId: string) => {
    // Demo action
    // eslint-disable-next-line no-alert
    alert(`Marked complaint ${complaintId} for review (demo)`);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-800">Senior Officer Dashboard</h1>
        <p className="text-gray-600">Monitor vehicle reservation requests, complaints, and request history</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-l-4 border-t-2 border-t-orange-500 border-l-orange-500 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-800">{statusCounts.all}</p>
              </div>
              <FileText className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-l-4 border-t-2 border-t-orange-500 border-l-emerald-500 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open Complaints</p>
                <p className="text-2xl font-bold text-red-600">{statusCounts.complaintsOpen}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-l-4 border-t-2 border-t-orange-500 border-l-amber-500 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Review</p>
                <p className="text-2xl font-bold text-amber-600">{statusCounts.complaintsReview}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-l-4 border-t-2 border-t-orange-500 border-l-green-500 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-emerald-600">{statusCounts.complaintsResolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Requests */}
      <Card className="shadow-lg border-0 rounded-xl hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-t-2 border-t-orange-500 rounded-t-xl">
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <Filter className="w-5 h-5" />
            View Vehicle Reservation Requests
          </CardTitle>
          <CardDescription>Search and filter reservation requests (expand for purpose details)</CardDescription>
        </CardHeader>
        <CardContent className="p-4 bg-amber-50/30">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search requests by ID, vehicle type, destination, or purpose..."
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                className="pl-10 hover:border-orange-400 focus:ring-orange-500 transition-all duration-200"
              />
            </div>
            <Select value={requestStatusFilter} onValueChange={setRequestStatusFilter}>
              <SelectTrigger className="w-full md:w-56 hover:border-orange-400 focus:ring-orange-500 transition-all duration-200">
                <SelectValue placeholder="Filter by approval status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Approval Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-amber-50/50 hover:bg-amber-50/50">
                  <TableHead className="font-bold">Request ID</TableHead>
                  <TableHead className="font-bold">Request Date</TableHead>
                  <TableHead className="font-bold">Vehicle</TableHead>
                  <TableHead className="font-bold">Reservation Date</TableHead>
                  <TableHead className="font-bold">Destination</TableHead>
                  <TableHead className="font-bold">Approval</TableHead>
                  <TableHead className="font-bold">Allocation</TableHead>
                  <TableHead className="font-bold text-center">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <>
                    <TableRow
                      key={request.id}
                      className="hover:bg-orange-50 transition-all duration-200 cursor-pointer hover:scale-[1.005]"
                      onClick={() => setExpandedRequestId(expandedRequestId === request.id ? null : request.id)}
                    >
                      <TableCell className="font-medium text-orange-600">{request.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          {request.requestDate}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-gray-500" />
                          {request.vehicleType}
                        </div>
                      </TableCell>
                      <TableCell>{request.reservationDate}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          {request.destination}
                        </div>
                      </TableCell>
                      <TableCell>{getApprovalStatusBadge(request.approvalStatus)}</TableCell>
                      <TableCell>{getAllocationStatusBadge(request.allocationStatus)}</TableCell>
                      <TableCell className="text-center">
                        <button className="hover:bg-orange-100 p-2 rounded transition-colors" onClick={(e) => e.stopPropagation()}>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedRequestId === request.id ? "rotate-180" : ""}`} />
                        </button>
                      </TableCell>
                    </TableRow>
                    {expandedRequestId === request.id && (
                      <TableRow className="bg-orange-50">
                        <TableCell colSpan={8} className="p-4">
                          <div className="bg-white rounded-lg p-4 shadow-inner border-l-4 border-orange-500">
                            <h4 className="font-semibold text-gray-800 mb-2">Purpose</h4>
                            <p className="text-gray-700">{request.purpose}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}

                {filteredRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="p-6 text-center text-gray-500">
                      No requests match your filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-0 rounded-xl hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-t-2 border-t-orange-500 rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <MessageSquare className="w-5 h-5" />
              Complaints
            </CardTitle>
            <CardDescription>Complaints raised per reservation request</CardDescription>
          </CardHeader>
          <CardContent className="p-4 bg-amber-50/30">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search complaints by ID, request ID, category, message..."
                  value={complaintSearch}
                  onChange={(e) => setComplaintSearch(e.target.value)}
                  className="pl-10 hover:border-orange-400 focus:ring-orange-500 transition-all duration-200"
                />
              </div>
              <Select value={complaintStatusFilter} onValueChange={setComplaintStatusFilter}>
                <SelectTrigger className="w-full md:w-56 hover:border-orange-400 focus:ring-orange-500 transition-all duration-200">
                  <SelectValue placeholder="Filter by complaint status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Complaint Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-review">In Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-amber-50/50 hover:bg-amber-50/50">
                    <TableHead className="font-bold">Complaint ID</TableHead>
                    <TableHead className="font-bold">Request ID</TableHead>
                    <TableHead className="font-bold">Category</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold">Message</TableHead>
                    <TableHead className="font-bold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComplaints.map((c) => (
                    <TableRow key={c.id} className="hover:bg-orange-50 transition-all duration-200">
                      <TableCell className="font-medium text-orange-600">{c.id}</TableCell>
                      <TableCell>{c.requestId}</TableCell>
                      <TableCell className="text-gray-700">{categoryLabel(c.category)}</TableCell>
                      <TableCell>{getComplaintStatusBadge(c.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{c.message}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {c.status !== "resolved" ? (
                            <>
                              {c.status === "open" && (
                                <Button
                                  size="sm"
                                  className="bg-amber-600 hover:bg-amber-700 transition-all duration-200 text-white"
                                  onClick={() => handleMarkReview(c.id)}
                                >
                                  Mark Review
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-emerald-600 hover:bg-emerald-700 transition-all duration-200 text-white"
                                onClick={() => handleResolve(c.id)}
                              >
                                Resolve
                              </Button>
                            </>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Done</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredComplaints.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="p-6 text-center text-gray-500">
                        No complaints match your filter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Previous Requests (Senior Officer view) */}
        <Card className="shadow-lg border-0 rounded-xl hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-t-2 border-t-blue-500 rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <FileText className="w-5 h-5" />
              Previous Requests
            </CardTitle>
            <CardDescription>Browse the request history with purpose details</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50/60 hover:bg-blue-50/60">
                    <TableHead className="font-bold">Request ID</TableHead>
                    <TableHead className="font-bold">Reservation Date</TableHead>
                    <TableHead className="font-bold">Vehicle</TableHead>
                    <TableHead className="font-bold">Destination</TableHead>
                    <TableHead className="font-bold">Approval</TableHead>
                    <TableHead className="font-bold text-center">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRequests.map((r) => (
                    <>
                      <TableRow
                        key={r.id}
                        className="hover:bg-blue-50/80 transition-all duration-200 cursor-pointer"
                        onClick={() => setExpandedRequestId(expandedRequestId === r.id ? null : r.id)}
                      >
                        <TableCell className="font-medium text-blue-700">{r.id}</TableCell>
                        <TableCell>{r.reservationDate}</TableCell>
                        <TableCell className="text-gray-700">{r.vehicleType}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            {r.destination}
                          </div>
                        </TableCell>
                        <TableCell>{getApprovalStatusBadge(r.approvalStatus)}</TableCell>
                        <TableCell className="text-center">
                          <ChevronDown className={`w-4 h-4 inline-block transition-transform duration-200 ${expandedRequestId === r.id ? "rotate-180" : ""}`} />
                        </TableCell>
                      </TableRow>
                      {expandedRequestId === r.id && (
                        <TableRow className="bg-blue-50/40">
                          <TableCell colSpan={6} className="p-4">
                            <div className="bg-white rounded-lg p-4 shadow-inner border-l-4 border-blue-500">
                              <h4 className="font-semibold text-gray-800 mb-2">Purpose</h4>
                              <p className="text-gray-700">{r.purpose}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

