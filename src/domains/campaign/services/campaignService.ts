import { Campaign } from '../types'
import { getHomepageSectionsAction } from '@/lib/actions/homepage'

export async function getActiveCampaign(): Promise<Campaign | null> {
  try {
    const result = await getHomepageSectionsAction()

    if (!result.success || !result.data || result.data.length === 0) {
      return null
    }

    const sections = result.data

    // Transform homepage_sections to Campaign format
    const campaign: Campaign = {
      id: 'homepage-active',
      name: 'Active Homepage Campaign',
      description: 'Current active homepage layout from admin',
      status: 'active',
      sections: sections.map((section: any) => ({
        id: section.id,
        type: (section.content_type as 'hero' | 'product-grid' | 'banner' | 'category-grid' | 'testimonials') || 'banner',
        title: section.title || '',
        subtitle: '', // No subtitle field in database
        enabled: section.is_active || false,
        order: section.sort_order || 0,
        config: {} // No config field in database
      })),
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    }

    return campaign
  } catch (error) {
    console.error('Error in getActiveCampaign:', error)
    return null
  }
}

export async function getAllCampaigns(): Promise<Campaign[]> {
  try {
    const activeCampaign = await getActiveCampaign()
    return activeCampaign ? [activeCampaign] : []
  } catch (error) {
    console.error('Error in getAllCampaigns:', error)
    return []
  }
}
