/**
 * Seed script for Vehicle Reservation System.
 *
 * Creates test data including faculties, departments, users, admins, drivers, vehicles.
 * Also creates corresponding users in Supabase Auth with password "123".
 *
 * Run: npx tsx prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureSupabaseUser(email, password, userId, type) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    // If already exists → fetch existing user
    const { data: existing } = await supabase.auth.admin.listUsers();

    const found = existing?.users?.find((u: any) => u.email === email);
    if (found) return found.id;

    console.error(`Failed to create ${email}:`, error.message);
    return null;
  }

  return data.user.id; // ✅ THIS is Supabase Auth UUID
}

async function main() {
  console.log("=== Seeding Database ===\n");

  // ----- Faculty -----
  const faculty = await prisma.faculty.upsert({
    where: { name: "Faculty of Engineering" },
    update: {},
    create: { name: "Faculty of Engineering" },
  });
  console.log(`✓ Faculty: ${faculty.name}`);

  // ----- Departments -----
  const deptCSE = await prisma.department.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      department_name: "Computer Science & Engineering",
      faculty_id: faculty.id,
    },
  });

  const deptEE = await prisma.department.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      department_name: "Electrical Engineering",
      faculty_id: faculty.id,
    },
  });

  const deptME = await prisma.department.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      department_name: "Mechanical Engineering",
      faculty_id: faculty.id,
    },
  });
  console.log(`✓ Departments: ${deptCSE.department_name}, ${deptEE.department_name}, ${deptME.department_name}`);

  // ----- Users (students/lecturers/etc) -----
  const userData = [
    {
      full_name: "Student User",
      user_type: "student",
      reg_no: "EG/2020/1001",
      email: "student@test.com",
    },
    {
      full_name: "Lecturer User",
      user_type: "lecturer",
      reg_no: "EG/2015/2001",
      email: "lecturer@test.com",
    },
  ];

  const createdUsers: any[] = [];

for (const u of userData) {
  const supabaseId = await ensureSupabaseUser(u.email, "123", "user", u.user_type);

  if (!supabaseId) continue;

  const user = await prisma.user.upsert({
    where: { supabase_id: supabaseId },
    update: {},
    create: {
      supabase_id: supabaseId,
      full_name: u.full_name,
      user_type: u.user_type,
      registration_or_employee_no: u.reg_no,
      email: u.email,
      department_id: deptCSE.id,
    },
  });

  createdUsers.push(user);
  console.log(`✓ User linked: ${user.email}`);
}

  // ----- Admin Users -----
  const adminData = [
    {
      full_name: "Admin Deputy",
      admin_role: "admin-deputy",
      email: "admin@test.com",
      department_id: null,
      faculty_id: null,
    },
    {
      full_name: "University Deputy",
      admin_role: "university-deputy",
      email: "uni-deputy@test.com",
      department_id: null,
      faculty_id: null,
    },
        {
      full_name: "Dean User",
      admin_role: "dean",
      email: "dean@test.com",
      department_id: null,
      faculty_id: faculty.id,
    },
    {
      full_name: "Senior Officer",
      admin_role: "senior-officer",
      email: "officer@test.com",
      department_id: null,
      faculty_id: null,
    },
  ];

 const createdAdmins: any[] = [];

for (const a of adminData) {
  const supabaseId = await ensureSupabaseUser(a.email, "123", "admin", a.admin_role);

  if (!supabaseId) continue;

  const admin = await prisma.admin.upsert({
    where: { supabase_id: supabaseId },
    update: {},
    create: {
      supabase_id: supabaseId,
      full_name: a.full_name,
      admin_role: a.admin_role,
      email: a.email,
      department_id: a.department_id,
      faculty_id: a.faculty_id,
    },
  });

  createdAdmins.push(admin);
  console.log(`✓ Admin linked: ${admin.full_name}`);
}

  // ----- Drivers -----
  const driverData = [
    { full_name: "John Driver", license_number: "LIC-001" },
    { full_name: "Sarah Driver", license_number: "LIC-002" },
  ];

  for (const d of driverData) {
    await prisma.driver.upsert({
      where: { license_number: d.license_number },
      update: {},
      create: {
        full_name: d.full_name,
        license_number: d.license_number,
        availability_status: "available",
      },
    });
    console.log(`✓ Driver: ${d.full_name}`);
  }

  // ----- Vehicles -----
  const vehicleData = [
    { vehicle_number: "CAB-1001", vehicle_type: "car", capacity: 4 },
    { vehicle_number: "BUS-2001", vehicle_type: "bus", capacity: 30 },
    { vehicle_number: "VAN-3001", vehicle_type: "van", capacity: 8 },
  ];

  for (const v of vehicleData) {
    await prisma.vehicle.upsert({
      where: { vehicle_number: v.vehicle_number },
      update: {},
      create: {
        vehicle_number: v.vehicle_number,
        vehicle_type: v.vehicle_type,
        capacity: v.capacity,
        availability_status: "available",
      },
    });
    console.log(`✓ Vehicle: ${v.vehicle_number} (${v.vehicle_type})`);
  }

  // ----- Create Supabase Auth users & link via supabase_id -----
  console.log("\n=== Creating Supabase Auth accounts ===");

  for (const user of createdUsers) {
    const supabaseId = await ensureSupabaseUser(user.email, "123", user.id, "user");
    if (supabaseId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { supabase_id: supabaseId },
      });
    }
  }

  for (const admin of createdAdmins) {
    const supabaseId = await ensureSupabaseUser(admin.email, "123", admin.id, "admin");
    if (supabaseId) {
      await prisma.admin.update({
        where: { id: admin.id },
        data: { supabase_id: supabaseId },
      });
    }
  }

  console.log("\n=== Seeding Complete ===");
  console.log("\nTest accounts (all with password: 123):");
  console.log("  User:       student@test.com    (type: student)");
  console.log("  User:       lecturer@test.com    (type: lecturer)");
  console.log("  Admin:      dean@test.com        (role: dean)");
  console.log("  Admin:       officer@test.com     (role: senior-officer)");
  console.log("  Admin:      admin@test.com       (role: admin-deputy)");
  console.log("  Admin:      uni-deputy@test.com  (role: university-deputy)");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});