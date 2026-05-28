import { Award, TrendingUp, Users, FileCheck, BarChart3, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

export function DeanDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dean's Dashboard</h1>
        <p className="text-gray-600 mt-2">Executive overview of faculty vehicle management</p>
      </div>

      {/* Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-lg border-0 border-l-4 border-l-emerald-600 hover:shadow-xl transition-all duration-200 hover:scale-102">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Approvals</p>
                <p className="text-3xl font-bold text-emerald-600">342</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full">
                <FileCheck className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">↑ 8% from last month</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 border-l-4 border-l-purple-600 hover:shadow-xl transition-all duration-200 hover:scale-102">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Faculty</p>
                <p className="text-3xl font-bold text-purple-600">156</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">94% engagement rate</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 border-l-4 border-l-orange-600 hover:shadow-xl transition-all duration-200 hover:scale-102">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Efficiency Score</p>
                <p className="text-3xl font-bold text-orange-600">4.8</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">↑ 0.3 points</p>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg border-0 lg:col-span-2">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <BarChart3 className="w-5 h-5" />
              Faculty Performance Metrics
            </CardTitle>
            <CardDescription>Quarterly overview across all departments</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {[
                { metric: "Request Processing Time", value: "2.4 hrs", target: "3.0 hrs", status: "excellent" },
                { metric: "Approval Rate", value: "87%", target: "80%", status: "excellent" },
                { metric: "Vehicle Utilization", value: "76%", target: "75%", status: "good" },
                { metric: "Student Satisfaction", value: "4.6/5.0", target: "4.5/5.0", status: "excellent" },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-gray-800">{item.metric}</span>
                      <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
                        {item.status === "excellent" ? "Exceeds Target" : "On Track"}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-blue-600">{item.value}</p>
                      <p className="text-xs text-gray-500">Target: {item.target}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        item.status === "excellent" ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-gradient-to-r from-blue-500 to-blue-600"
                      }`}
                      style={{ width: `${90 - i * 5}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Award className="w-5 h-5" />
              Top Performers
            </CardTitle>
            <CardDescription>Best departments this month</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[
                { rank: 1, dept: "Faculty of Applied Sciences", score: 98 },
                { rank: 2, dept: "Faculty of medicine", score: 95 },
                { rank: 3, dept: "Faculty of Business studies", score: 92 },

              ].map((dept) => (
                <div key={dept.rank} className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-white rounded-lg border border-purple-100">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-white ${
                    dept.rank === 1 ? "bg-yellow-500" : dept.rank === 2 ? "bg-gray-400" : "bg-orange-400"
                  }`}>
                    {dept.rank}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{dept.dept}</p>
                    <p className="text-sm text-gray-600">Score: {dept.score}/100</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar & Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Calendar className="w-5 h-5" />
              Strategic Milestones
            </CardTitle>
            <CardDescription>Upcoming important events</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[
                { event: "Quarterly Review Meeting", date: "May 15, 2026", type: "meeting" },
                { event: "Budget Planning Session", date: "May 20, 2026", type: "planning" },
                { event: "Faculty Performance Report", date: "May 25, 2026", type: "report" },
                { event: "End of Semester Review", date: "May 30, 2026", type: "review" },
              ].map((milestone, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors">
                  <div className={`mt-1 w-2 h-2 rounded-full ${
                    milestone.type === "meeting" ? "bg-blue-500" :
                    milestone.type === "planning" ? "bg-purple-500" :
                    milestone.type === "report" ? "bg-orange-500" : "bg-green-500"
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{milestone.event}</p>
                    <p className="text-sm text-gray-500">{milestone.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <FileCheck className="w-5 h-5" />
              Pending Reviews
            </CardTitle>
            <CardDescription>Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[
                { item: "New Vehicle Purchase Request", priority: "medium", due: "1 week" },
                { item: "Policy Update Review", priority: "medium", due: "2 weeks" },
                { item: "Department Expansion Plan", priority: "low", due: "1 month" },
              ].map((review, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{review.item}</p>
                    <p className="text-sm text-gray-500">Due in: {review.due}</p>
                  </div>
                  <Badge className={
                    review.priority === "high" ? "bg-red-100 text-red-800" :
                    review.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                    "bg-green-100 text-green-800"
                  }>
                    {review.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
