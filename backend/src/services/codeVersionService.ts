import prisma from "../utils/prisma.js";

export const codeVersionService = {
  /**
   * Create a new code version for a project
   * Note: sourceCode is NOT stored - only passed to AI for analysis
   */
  async create(projectId: string, versionLabel?: string) {
    return prisma.codeVersion.create({
      data: {
        projectId,
        versionLabel,
      },
    });
  },

  /**
   * Get all versions for a project
   */
  async findByProject(projectId: string) {
    return prisma.codeVersion.findMany({
      where: { projectId },
      include: {
        analysis: {
          include: {
            issues: true,
          },
        },
      },
      orderBy: { uploadedAt: "desc" },
    });
  },

  /**
   * Get a single version by ID with full analysis details
   */
  async findById(id: string) {
    return prisma.codeVersion.findUnique({
      where: { id },
      include: {
        project: true,
        analysis: {
          include: {
            issues: {
              include: {
                snippet: true,
              },
            },
          },
        },
      },
    });
  },

  /**
   * Verify version belongs to a project owned by user
   */
  async verifyOwnership(versionId: string, ownerId: string) {
    const version = await prisma.codeVersion.findUnique({
      where: { id: versionId },
      include: {
        project: true,
      },
    });

    return version && version.project.ownerId === ownerId ? version : null;
  },
};
