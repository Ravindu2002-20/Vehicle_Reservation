import { Car, User, Phone, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface Vehicle {
  id: string;
  vehicleNumber: string;
  type: string;
  capacity: number;
  status: "available" | "in-use" | "maintenance";
}

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  telephone: string;
  availabilityStatus: "available" | "unavailable" | "on-leave";
}

const mockVehicles: Vehicle[] = [
  { id: "V001", vehicleNumber: "CAB-1234", type: "Van", capacity: 12, status: "available" },
  { id: "V002", vehicleNumber: "CAB-5678", type: "Bus", capacity: 45, status: "in-use" },
  { id: "V003", vehicleNumber: "CAB-9012", type: "Sedan", capacity: 4, status: "available" },
  { id: "V004", vehicleNumber: "CAB-3456", type: "SUV", capacity: 7, status: "maintenance" },
  { id: "V005", vehicleNumber: "CAB-7890", type: "Van", capacity: 12, status: "available" },
  { id: "V006", vehicleNumber: "CAB-2468", type: "Mini Bus", capacity: 25, status: "in-use" },
];

const mockDrivers: Driver[] = [
  { id: "D001", name: "Robert Smith", licenseNumber: "DL-123456", telephone: "+1-555-0101", availabilityStatus: "available" },
  { id: "D002", name: "Jennifer Brown", licenseNumber: "DL-234567", telephone: "+1-555-0102", availabilityStatus: "unavailable" },
  { id: "D003", name: "David Wilson", licenseNumber: "DL-345678", telephone: "+1-555-0103", availabilityStatus: "available" },
  { id: "D004", name: "Lisa Anderson", licenseNumber: "DL-456789", telephone: "+1-555-0104", availabilityStatus: "on-leave" },
  { id: "D005", name: "Thomas Martinez", licenseNumber: "DL-567890", telephone: "+1-555-0105", availabilityStatus: "available" },
];

export function FleetStatusView({ currentPage }: { currentPage?: string }) {
  const getVehicleStatusBadge = (status: Vehicle["status"]) => {
    switch (status) {
      case "available":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Available
          </Badge>
        );
      case "in-use":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300">
            <Clock className="w-3 h-3 mr-1" />
            In Use
          </Badge>
        );
      case "maintenance":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Maintenance
          </Badge>
        );
    }
  };

  const getDriverStatusBadge = (status: Driver["availabilityStatus"]) => {
    switch (status) {
      case "available":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Available
          </Badge>
        );
      case "unavailable":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Unavailable
          </Badge>
        );
      case "on-leave":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300">
            <Clock className="w-3 h-3 mr-1" />
            On Leave
          </Badge>
        );
    }
  };

  const vehicleStats = {
    total: mockVehicles.length,
    available: mockVehicles.filter(v => v.status === "available").length,
    inUse: mockVehicles.filter(v => v.status === "in-use").length,
    maintenance: mockVehicles.filter(v => v.status === "maintenance").length,
  };

  const driverStats = {
    total: mockDrivers.length,
    available: mockDrivers.filter(d => d.availabilityStatus === "available").length,
    unavailable: mockDrivers.filter(d => d.availabilityStatus === "unavailable").length,
    onLeave: mockDrivers.filter(d => d.availabilityStatus === "on-leave").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Fleet Management</h1>
        <p className="text-gray-600 mt-2">View and manage university vehicles and drivers</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-lg border-0 border-l-4 border-t-2 border-t-orange-500 border-l-orange-500 rounded-xl hover:shadow-2xl hover:scale-[1.03] hover:brightness-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Vehicles</p>
                <p className="text-3xl font-bold text-orange-600">{vehicleStats.total}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Car className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 border-l-4 border-t-2 border-t-orange-500 border-l-emerald-500 rounded-xl hover:shadow-2xl hover:scale-[1.03] hover:brightness-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Available</p>
                <p className="text-3xl font-bold text-emerald-600">{vehicleStats.available}</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 border-l-4 border-t-2 border-t-orange-500 border-l-blue-500 rounded-xl hover:shadow-2xl hover:scale-[1.03] hover:brightness-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Drivers</p>
                <p className="text-3xl font-bold text-blue-600">{driverStats.available}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <User className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 border-l-4 border-t-2 border-t-orange-500 border-l-amber-500 rounded-xl hover:shadow-2xl hover:scale-[1.03] hover:brightness-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">In Maintenance</p>
                <p className="text-3xl font-bold text-amber-600">{vehicleStats.maintenance}</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed View */}
      <Card className="shadow-lg border-0 rounded-xl">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-t-2 border-t-orange-500 rounded-t-xl">
          <CardTitle className="text-orange-900">Fleet Details</CardTitle>
          <CardDescription>View vehicles and driver information</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="vehicles" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
              <TabsTrigger value="drivers">Drivers</TabsTrigger>
            </TabsList>

            <TabsContent value="vehicles">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-amber-50/50 hover:bg-amber-50/50">
                      <TableHead className="font-bold">Vehicle ID</TableHead>
                      <TableHead className="font-bold">Vehicle Number</TableHead>
                      <TableHead className="font-bold">Type</TableHead>
                      <TableHead className="font-bold">Capacity</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockVehicles.map((vehicle) => (
                      <TableRow key={vehicle.id} className="hover:bg-orange-50 transition-all duration-200 hover:scale-[1.005]">
                        <TableCell className="font-medium text-orange-600">{vehicle.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Car className="w-4 h-4 text-gray-500" />
                            {vehicle.vehicleNumber}
                          </div>
                        </TableCell>
                        <TableCell>{vehicle.type}</TableCell>
                        <TableCell>{vehicle.capacity} persons</TableCell>
                        <TableCell>{getVehicleStatusBadge(vehicle.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="drivers">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-amber-50/50 hover:bg-amber-50/50">
                      <TableHead className="font-bold">Driver ID</TableHead>
                      <TableHead className="font-bold">Name</TableHead>
                      <TableHead className="font-bold">License Number</TableHead>
                      <TableHead className="font-bold">Telephone</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockDrivers.map((driver) => (
                      <TableRow key={driver.id} className="hover:bg-orange-50 transition-all duration-200 hover:scale-[1.005]">
                        <TableCell className="font-medium text-orange-600">{driver.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            {driver.name}
                          </div>
                        </TableCell>
                        <TableCell>{driver.licenseNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            {driver.telephone}
                          </div>
                        </TableCell>
                        <TableCell>{getDriverStatusBadge(driver.availabilityStatus)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
