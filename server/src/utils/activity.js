import { prisma } from '../lib/prisma.js'

export async function logActivity(type, text) {
  await prisma.activityLog.create({
    data: {
      type,
      text,
    },
  })
}

export const mapActivity = (item) => ({
  id: item.id,
  type: item.type,
  text: item.text,
  timestamp: item.createdAt,
})
