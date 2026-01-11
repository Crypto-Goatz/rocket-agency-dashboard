import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { installSkill, installSkillFromUrl } from '@/lib/skills'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { skillId, sourceUrl, config } = body

    // Install from URL or by ID
    let result

    if (sourceUrl) {
      result = await installSkillFromUrl(session.id, sourceUrl, { config })
    } else if (skillId) {
      result = await installSkill(session.id, skillId, { config })
    } else {
      return NextResponse.json(
        { success: false, error: 'Either skillId or sourceUrl is required' },
        { status: 400 }
      )
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      installation: result.installation,
    })
  } catch (error: any) {
    console.error('Install skill error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
