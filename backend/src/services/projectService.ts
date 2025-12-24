import prisma from "../utils/prisma.js";

export const projectService = {
  /**
   * Create a new project for a user
   */
  async create(ownerId: string, name: string, description?: string) {
    return prisma.project.create({
      data: {
        ownerId,
        name,
        description,
      },
    });
  },

  /**
   * Get all projects for a user
   */
  async findByOwner(ownerId: string) {
    return prisma.project.findMany({
      where: { ownerId },
      include: {
        versions: {
          orderBy: { uploadedAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Get a single project by ID (with ownership check)
   */
  async findById(id: string, ownerId: string) {
    return prisma.project.findFirst({
      where: { id, ownerId },
      include: {
        versions: {
          orderBy: { uploadedAt: "desc" },
          include: {
            analysis: true,
          },
        },
        comparisons: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
  },

  /**
   * Delete a project (with ownership check)
   */
  async delete(id: string, ownerId: string) {
    // First verify ownership
    const project = await prisma.project.findFirst({
      where: { id, ownerId },
    });

    if (!project) return null;

    // Delete cascade is handled by Prisma relations
    return prisma.project.delete({
      where: { id },
    });
  },
};
