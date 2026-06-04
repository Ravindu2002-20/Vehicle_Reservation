import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const email = "dean@test.com";
const supabaseId = "803239c4-6743-4d64-a9f7-bdaf0008756d";

async function main() {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  const existingAdmin = await prisma.admin.findUnique({ where: { email } });

  if (existingUser) {
    console.log(`Found existing Prisma User row for ${email} (id=${existingUser.id}).`);
    if (!existingUser.supabase_id) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { supabase_id: supabaseId },
      });
      console.log(`Linked supabase_id ${supabaseId} to Prisma User #${existingUser.id}.`);
    } else if (existingUser.supabase_id !== supabaseId) {
      console.warn(
        `Existing Prisma User has a different supabase_id (${existingUser.supabase_id}). Skipping update.`
      );
    }
    return;
  }

  if (existingAdmin) {
    console.log(`Found existing Prisma Admin row for ${email} (id=${existingAdmin.id}).`);
    if (!existingAdmin.supabase_id) {
      await prisma.admin.update({
        where: { id: existingAdmin.id },
        data: { supabase_id: supabaseId },
      });
      console.log(`Linked supabase_id ${supabaseId} to Prisma Admin #${existingAdmin.id}.`);
    } else if (existingAdmin.supabase_id !== supabaseId) {
      console.warn(
        `Existing Prisma Admin has a different supabase_id (${existingAdmin.supabase_id}). Skipping update.`
      );
    }
    return;
  }

  console.log(`No Prisma User/Admin row found for ${email}. Creating an Admin row.`);

  const admin = await prisma.admin.create({
    data: {
      email,
      supabase_id: supabaseId,
      full_name: "Dean Test User",
      admin_role: "dean",
      telephone: "",
    },
  });

  console.log(`Created Prisma Admin row for ${email} with id=${admin.id}.`);
}

main()
  .catch((error) => {
    console.error("Failed to ensure test user:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
