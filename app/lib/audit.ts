import { prisma } from "./prisma";

export async function auditLog(params: {
  userId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? undefined,
      summary: params.summary ?? undefined,
    },
  });
}
