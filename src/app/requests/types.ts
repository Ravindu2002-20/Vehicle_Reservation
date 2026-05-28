export type VehicleRequest = {
  id: number;
  request_type: string;
  vehicle_nature: string;
  number_of_persons: number;
  travel_date_from: string;
  travel_date_to: string;
  purpose: string;
  places_to_visit: string | null;
  approval_status: string;

  // detail fields (some may be null depending on backend include)
  required_time_from?: string;
  required_time_to?: string;
  travel_route?: string | null;
  special_notes?: string | null;
  allocation_status?: string;
};

