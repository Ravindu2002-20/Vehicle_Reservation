import { VehicleReservationForm } from "./VehicleReservationForm";
import { MessagesPage } from "./MessagesPage";
import { PreviousRequestsPage } from "./PreviousRequestsPage";
import { AccountDetailsPage } from "./AccountDetailsPage";
import { WelcomeBanner } from "./WelcomeBanner";
import type { StudentPage } from "../UniversityDashboard";

interface StudentDashboardProps {
  currentPage: StudentPage;
}

export function StudentDashboard({ currentPage }: StudentDashboardProps) {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Show welcome banner only on main pages */}
      {(currentPage === "reservation-form" || currentPage === "messages" || currentPage === "previous-requests") && (
        <WelcomeBanner />
      )}

      {currentPage === "reservation-form" && <VehicleReservationForm />}
      {currentPage === "messages" && <MessagesPage />}
      {currentPage === "previous-requests" && <PreviousRequestsPage />}
      {currentPage === "account-details" && <AccountDetailsPage />}
    </div>
  );
}