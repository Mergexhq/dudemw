import { prisma } from '@/lib/db'
import HeroClient from "./HeroClient"

export default async function Hero() {
  const banners = await prisma.banners.findMany({
    where: { placement: 'homepage-carousel', status: 'active' },
    orderBy: { position: 'asc' },
  })

  if (!banners || banners.length === 0) {
    return null
  }

  return <HeroClient banners={banners as any} />
}
