import { Building2, Users, FileCheck, Calendar, Activity, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

export function FacultyDeputyDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Faculty Deputy Registrar Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage faculty-level vehicle operations and requests</p>
      </div>

      {/* Faculty Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-lg border-0 border-l-4 border-l-teal-500 hover:shadow-xl transition-all duration-200 hover:scale-102">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Faculty Students</p>
                <p className="text-3xl font-bold text-teal-600">342</p>
              </div>
              <div className="bg-teal-100 p-3 rounded-full">
                <Users className="w-8 h-8 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 border-l-4 border-l-rose-500 hover:shadow-xl transition-all duration-200 hover:scale-102">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">This Month</p>
                <p className="text-3xl font-bold text-rose-600">78</p>
              </div>
              <div className="bg-rose-100 p-3 rounded-full">
                <FileCheck className="w-8 h-8 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 border-l-4 border-l-amber-500 hover:shadow-xl transition-all duration-200 hover:scale-102">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Review</p>
                <p className="text-3xl font-bold text-amber-600">5</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 border-l-4 border-l-violet-500 hover:shadow-xl transition-all duration-200 hover:scale-102">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Today</p>
                <p className="text-3xl font-bold text-violet-600">12</p>
              </div>
              <div className="bg-violet-100 p-3 rounded-full">
                <Activity className="w-8 h-8 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b">
          <CardTitle className="flex items-center gap-2 text-teal-900">
            <Building2 className="w-5 h-5" />
            Department Breakdown
          </CardTitle>
          <CardDescription>Reservation activity by department</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { dept: "Faculty of Applied Sciences", requests: 28, pending: 2, approved: 24 },
              { dept: "Faculty of medicine", requests: 22, pending: 1, approved: 20 },
              { dept: "Faculty of Business studies", requests: 18, pending: 2, approved: 15 },

            ].map((dept, i) => (
              <div key={i} className="p-4 bg-gradient-to-br from-teal-50 to-white rounded-lg border border-teal-100 hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-gray-800 mb-3">{dept.dept}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Requests</span>
                    <span className="font-bold text-teal-600">{dept.requests}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Approved</span>
                    <span className="font-bold text-green-600">{dept.approved}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pending</span>
                    <span className="font-bold text-yellow-600">{dept.pending}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest reservation requests</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[
                { student: "Sarah Johnson", type: "Van", time: "30 min ago", status: "pending" },
                { student: "Mike Chen", type: "Sedan", time: "1 hour ago", status: "approved" },
                { student: "Emma Davis", type: "SUV", time: "2 hours ago", status: "approved" },
                { student: "Alex Smith", type: "Bus", time: "3 hours ago", status: "pending" },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{activity.student}</p>
                    <p className="text-sm text-gray-500">{activity.type} • {activity.time}</p>
                  </div>
                  <Badge className={activity.status === "approved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Calendar className="w-5 h-5" />
              Weekly Schedule
            </CardTitle>
            <CardDescription>Upcoming reservations this week</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[
                { day: "Monday", count: 6, highlight: true },
                { day: "Tuesday", count: 4, highlight: false },
                { day: "Wednesday", count: 8, highlight: false },
                { day: "Thursday", count: 5, highlight: false },
                { day: "Friday", count: 9, highlight: false },
              ].map((day, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${day.highlight ? "bg-purple-100" : "bg-gray-50"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${day.highlight ? "bg-purple-600" : "bg-gray-400"}`} />
                    <span className="font-medium text-gray-800">{day.day}</span>
                  </div>
                  <Badge className="bg-purple-600 text-white">{day.count} reservations</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
