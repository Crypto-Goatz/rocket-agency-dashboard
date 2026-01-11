import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getUserSkills } from '@/lib/skills'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const skills = await getUserSkills(session.id)

    return NextResponse.json({
      success: true,
      skills,
      count: skills.length,
    })
  } catch (error: any) {
    console.error('Get installed skills error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
