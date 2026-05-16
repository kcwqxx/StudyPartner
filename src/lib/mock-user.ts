import prisma from "./db";

const MOCK_USER_ID = "mock-user-001";

export async function getMockUserId(): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: MOCK_USER_ID },
  });
  if (user) return MOCK_USER_ID;

  await prisma.user.create({
    data: {
      id: MOCK_USER_ID,
      name: "Mock User",
      email: "user@example.com",
    },
  });

  // Create default settings
  await prisma.userModelSettings.create({
    data: {
      userId: MOCK_USER_ID,
    },
  });

  await prisma.agentSettings.create({
    data: {
      userId: MOCK_USER_ID,
    },
  });

  return MOCK_USER_ID;
}

export { MOCK_USER_ID };
