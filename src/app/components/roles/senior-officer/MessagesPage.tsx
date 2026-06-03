"use client";

import SeniorOfficerLayout from "./SeniorOfficerLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";

// Reuse existing student/messages flow later.
// For now, keep a placeholder that won't break role isolation.
export default function MessagesPage() {
  return (
    <SeniorOfficerLayout title="Messages" subtitle="View and manage messages">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-orange-900">Messages</CardTitle>
          <CardDescription>Messages UI integration will be completed in later steps.</CardDescription>
        </CardHeader>
        <CardContent className="text-gray-600">
          This page is intentionally minimal for Step 3. Ensure backend routes for senior-officer message visibility are added in Step 4.
        </CardContent>
      </Card>
    </SeniorOfficerLayout>
  );
}

