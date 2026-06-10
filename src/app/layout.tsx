import type { Metadata } from "next";
import "./globals.css";
import { NotificationsProvider } from "./components/notifications/notifications-context";

export const metadata: Metadata = {
  title: "Vehicle Reservation System",
  description: "University Vehicle Reservation Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NotificationsProvider>{children}</NotificationsProvider>
      </body>
    </html>
  );
}
