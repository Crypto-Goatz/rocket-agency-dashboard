import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { exportSkill, exportSkillAsJson } from '@/lib/skills/package'

// Export a skill as a package
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const url = new URL(request.url)
    const format = url.searchParams.get('format') || 'json'
    const download = url.searchParams.get('download') === 'true'
    const includeReadme = url.searchParams.get('readme') !== 'false'

    const result = await exportSkill(id, {
      format: format as 'json' | 'zip' | 'npm',
      includeReadme,
    })

    if (!result.success || !result.package) {
      return NextResponse.json(
        { success: false, errors: result.errors },
        { status: 400 }
      )
    }

    // If download requested, return as file
    if (download) {
      const json = JSON.stringify(result.package, null, 2)
      const filename = `${result.package.manifest.slug}-v${result.package.manifest.version}.skill.json`

      return new NextResponse(json, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      package: result.package,
    })
  } catch (error: any) {
    console.error('Export skill error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
