import { Building2, BarChart3, Car, Users, TrendingUp, Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

export function UniversityDeputyDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">University Deputy Registrar Dashboard</h1>
        <p className="text-gray-600 mt-2">University-wide vehicle management and oversight</p>
      </div>

      {/* University-Wide Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-lg border-0 border-l-4 border-t-2 border-t-orange-500 border-l-blue-500 rounded-xl hover:shadow-2xl hover:scale-[1.03] hover:brightness-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Faculties</p>
                <p className="text-3xl font-bold text-blue-600">8</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 border-l-4 border-t-2 border-t-orange-500 border-l-orange-500 rounded-xl hover:shadow-2xl hover:scale-[1.03] hover:brightness-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Vehicles</p>
                <p className="text-3xl font-bold text-orange-600">45</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Car className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 border-l-4 border-t-2 border-t-orange-500 border-l-amber-500 rounded-xl hover:shadow-2xl hover:scale-[1.03] hover:brightness-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Monthly Requests</p>
                <p className="text-3xl font-bold text-amber-600">284</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <TrendingUp className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 border-l-4 border-t-2 border-t-orange-500 border-l-emerald-500 rounded-xl hover:shadow-2xl hover:scale-[1.03] hover:brightness-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Users</p>
                <p className="text-3xl font-bold text-emerald-600">1,234</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full">
                <Users className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Faculty Performance */}
      <Card className="shadow-lg border-0 rounded-xl hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-t-2 border-t-orange-500 rounded-t-xl">
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <Award className="w-5 h-5" />
            Faculty Performance Overview
          </CardTitle>
          <CardDescription>Reservation statistics by faculty</CardDescription>
        </CardHeader>
        <CardContent className="p-6 bg-amber-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Faculty of Applied Sciences", requests: 78, vehicles: 12 },
              { name: "Faculty of medicine", requests: 65, vehicles: 10 },
              { name: "Faculty of Business studies", requests: 52, vehicles: 8 },
              { name: "Faculty of Applied Sciences", requests: 45, vehicles: 7 },
            ].map((faculty, i) => (

              <div key={i} className="p-4 bg-white rounded-lg border-l-4 border-orange-500 hover:shadow-md hover:scale-[1.02] transition-all duration-200">
                <h4 className="font-semibold text-gray-800 mb-3">{faculty.name}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Requests</span>
                    <span className="font-bold text-orange-600">{faculty.requests}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Vehicles</span>
                    <span className="font-bold text-orange-600">{faculty.vehicles}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-0 rounded-xl hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-t-2 border-t-orange-500 rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <BarChart3 className="w-5 h-5" />
              Vehicle Utilization
            </CardTitle>
            <CardDescription>Current month usage statistics</CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-amber-50/30">
            <div className="space-y-4">
              {["Sedans", "Vans", "SUVs", "Buses"].map((type, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{type}</span>
                    <span className="text-gray-600">{85 - i * 10}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-amber-600 to-orange-600 h-3 rounded-full transition-all duration-500 hover:brightness-110"
                      style={{ width: `${85 - i * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 rounded-xl hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-t-2 border-t-orange-500 rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <TrendingUp className="w-5 h-5" />
              System Metrics
            </CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-amber-50/30">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border-l-4 border-emerald-500 hover:shadow-md transition-shadow">
                <span className="text-sm font-medium text-gray-700">Average Approval Time</span>
                <span className="text-lg font-bold text-emerald-600">2.4 hours</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border-l-4 border-amber-500 hover:shadow-md transition-shadow">
                <span className="text-sm font-medium text-gray-700">Overall Satisfaction</span>
                <span className="text-lg font-bold text-amber-600">4.7/5.0</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border-l-4 border-orange-500 hover:shadow-md transition-shadow">
                <span className="text-sm font-medium text-gray-700">System Uptime</span>
                <span className="text-lg font-bold text-orange-600">99.9%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
