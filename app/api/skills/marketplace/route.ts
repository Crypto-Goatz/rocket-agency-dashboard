import { NextRequest, NextResponse } from 'next/server'
import { getMarketplaceSkills, getSkillCategories } from '@/lib/skills'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const category = url.searchParams.get('category') || undefined
    const search = url.searchParams.get('search') || undefined
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    const [skills, categories] = await Promise.all([
      getMarketplaceSkills({ category, search, limit, offset }),
      getSkillCategories(),
    ])

    return NextResponse.json({
      success: true,
      skills,
      categories,
      count: skills.length,
    })
  } catch (error: any) {
    console.error('Get marketplace skills error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
