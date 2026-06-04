"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  FileCheck,
  Calendar,
  Activity,
  Clock,
} from "lucide-react";

import ApproverInbox from "./ApproverInbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";

type DepartmentStat = {
  dept: string;
  requests: number;
  pending: number;
  approved: number;
};

type ActivityStat = {
  student: string;
  type: string;
  time: string;
  status: "approved" | "pending";
};

export function AdminDeputyDashboard() {
  const [facultyStudents, setFacultyStudents] = useState<number>(0);
  const [monthlyRequests, setMonthlyRequests] = useState<number>(0);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [activeToday, setActiveToday] = useState<number>(0);

  const [departments, setDepartments] = useState<DepartmentStat[]>([]);
  const [activities, setActivities] = useState<ActivityStat[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<
    { day: string; count: number; highlight: boolean }[]
  >([]);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/stats?type=admin");
        const data = await res.json();

        const stats = data?.data;

        setFacultyStudents(stats?.facultyStudents ?? 0);
        setMonthlyRequests(stats?.monthlyRequests ?? 0);
        setPendingRequests(stats?.pendingApprovals ?? 0);
        setActiveToday(stats?.activeToday ?? 0);
      } catch {
        setFacultyStudents(0);
        setMonthlyRequests(0);
        setPendingRequests(0);
        setActiveToday(0);
      }
    }

    async function loadFacultyData() {
      try {
        const res = await fetch("/api/stats/faculty");
        const data = await res.json();
        setDepartments(data?.data ?? []);
      } catch {
        setDepartments([]);
      }
    }

    async function loadActivity() {
      // OPTIONAL: replace with real API later
      setActivities([
        { student: "Sarah Johnson", type: "Van", time: "30 min ago", status: "pending" },
        { student: "Mike Chen", type: "Sedan", time: "1 hour ago", status: "approved" },
        { student: "Emma Davis", type: "SUV", time: "2 hours ago", status: "approved" },
        { student: "Alex Smith", type: "Bus", time: "3 hours ago", status: "pending" },
      ]);
    }

    async function loadSchedule() {
      // OPTIONAL: replace with API later
      setWeeklySchedule([
        { day: "Monday", count: 6, highlight: true },
        { day: "Tuesday", count: 4, highlight: false },
        { day: "Wednesday", count: 8, highlight: false },
        { day: "Thursday", count: 5, highlight: false },
        { day: "Friday", count: 9, highlight: false },
      ]);
    }

    loadStats();
    loadFacultyData();
    loadActivity();
    loadSchedule();
  }, []);

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          General Deputy Registrar Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Manage faculty-level vehicle operations and requests
        </p>
      </div>

      {/* PENDING APPROVALS */}
      <div className="pt-4">
        <ApproverInbox role="GENERAL_DEPUTY" />
      </div>

      {/* FACULTY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <Card className="border-l-4 border-l-teal-500">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Faculty Students</p>
            <p className="text-3xl font-bold text-teal-600">
              {facultyStudents}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">This Month</p>
            <p className="text-3xl font-bold text-rose-600">
              {monthlyRequests}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Pending Review</p>
            <p className="text-3xl font-bold text-amber-600">
              {pendingRequests}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-500">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Active Today</p>
            <p className="text-3xl font-bold text-violet-600">
              {activeToday}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DEPARTMENT BREAKDOWN */}
      <Card>
        <CardHeader className="bg-teal-50">
          <CardTitle className="flex items-center gap-2 text-teal-900">
            <Building2 className="w-5 h-5" />
            Department Breakdown
          </CardTitle>
          <CardDescription>
            Reservation activity by department
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {departments.map((dept, i) => (
              <div
                key={i}
                className="p-4 border rounded-lg bg-teal-50/30"
              >
                <h4 className="font-semibold mb-3">
                  {dept.dept}
                </h4>

                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Total Requests</span>
                    <b>{dept.requests}</b>
                  </div>

                  <div className="flex justify-between">
                    <span>Approved</span>
                    <b className="text-green-600">
                      {dept.approved}
                    </b>
                  </div>

                  <div className="flex justify-between">
                    <span>Pending</span>
                    <b className="text-yellow-600">
                      {dept.pending}
                    </b>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* BOTTOM GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ACTIVITY */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {activities.map((a, i) => (
              <div
                key={i}
                className="flex justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{a.student}</p>
                  <p className="text-sm text-gray-500">
                    {a.type} • {a.time}
                  </p>
                </div>

                <Badge
                  className={
                    a.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {a.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* WEEKLY SCHEDULE */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Weekly Schedule
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {weeklySchedule.map((d, i) => (
              <div
                key={i}
                className={`flex justify-between p-3 rounded-lg ${
                  d.highlight ? "bg-purple-100" : "bg-gray-50"
                }`}
              >
                <span>{d.day}</span>
                <Badge>{d.count} reservations</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}