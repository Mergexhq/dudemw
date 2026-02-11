import DynamicHomepage from '@/domains/homepage/components/DynamicHomepage'
import { generateOrganizationSchema, generateWebsiteSchema } from "@/lib/utils/seo"

export default function HomePage() {
  const organizationSchema = generateOrganizationSchema()
  const websiteSchema = generateWebsiteSchema()

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      
      {/* Dynamic Homepage Content - Shows products even without campaigns */}
      <DynamicHomepage />
    </>
  )
}
