import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function insertApplication(data: Prisma.ApplicationCreateInput) {
  return prisma.application.create({ data });
}

export async function updateApplicationRecord(
  id: string,
  data: Prisma.ApplicationUpdateInput,
) {
  return prisma.application.update({
    where: { id },
    data,
  });
}

export async function deleteApplicationRecord(id: string) {
  return prisma.application.delete({
    where: { id },
  });
}

export async function insertApplicationStatusHistory(
  data: Prisma.ApplicationStatusHistoryUncheckedCreateInput,
) {
  return prisma.applicationStatusHistory.create({
    data,
  });
}
