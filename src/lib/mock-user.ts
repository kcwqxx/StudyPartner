import prisma from "./db";

const MOCK_USER_ID = "mock-user-001";

export async function getMockUserId(): Promise<string> {
  // 使用 upsert 避免并发请求时的竞态条件
  await prisma.user.upsert({
    where: { id: MOCK_USER_ID },
    update: {},
    create: {
      id: MOCK_USER_ID,
      name: "Mock User",
      email: "user@example.com",
    },
  });

  // 同时确保默认设置存在（使用 upsert 避免冲突）
  await prisma.userModelSettings.upsert({
    where: { userId: MOCK_USER_ID },
    update: {},
    create: {
      userId: MOCK_USER_ID,
    },
  });

  await prisma.agentSettings.upsert({
    where: { userId: MOCK_USER_ID },
    update: {},
    create: {
      userId: MOCK_USER_ID,
    },
  });

  return MOCK_USER_ID;
}

export { MOCK_USER_ID };
