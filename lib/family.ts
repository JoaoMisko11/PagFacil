import { db } from "@/lib/db"
import { unstable_cache } from "next/cache"

/**
 * Retorna os IDs de todos os usuários da mesma família.
 * Se o usuário não tem família, retorna apenas o próprio ID.
 */
export async function getFamilyUserIds(userId: string): Promise<string[]> {
  return getCachedFamilyUserIds(userId)
}

const getCachedFamilyUserIds = unstable_cache(
  async (userId: string): Promise<string[]> => {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { familyId: true },
    })

    if (!user?.familyId) return [userId]

    const familyMembers = await db.user.findMany({
      where: { familyId: user.familyId },
      select: { id: true },
    })

    return familyMembers.map((m) => m.id)
  },
  ["family-user-ids"],
  { revalidate: 60, tags: ["family"] }
)
