import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { ApplicationFilters } from "@/features/applications/lib/application-filters";

export async function getApplications(filters?: ApplicationFilters) {
  const where: Prisma.ApplicationWhereInput = {};
  const search = filters?.q?.trim();

  if (search) {
    where.OR = [
      {
        company: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        roleTitle: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (filters?.status && filters.status !== "ALL") {
    where.status = filters.status;
  }

  return prisma.application.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getApplicationById(id: string) {
  return prisma.application.findUnique({
    where: { id },
    include: {
      statusHistory: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}
