import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import {
  importSkill,
  previewImport,
  checkImportCompatibility,
  validatePackage,
} from '@/lib/skills/package'

// Preview/validate an import
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const sourceUrl = url.searchParams.get('url')

    if (!sourceUrl) {
      return NextResponse.json(
        { success: false, error: 'url parameter is required' },
        { status: 400 }
      )
    }

    const preview = await previewImport({
      source: 'url',
      url: sourceUrl,
    })

    if (!preview.valid) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          errors: preview.errors,
          warnings: preview.warnings,
        },
        { status: 400 }
      )
    }

    // Check compatibility
    const compatibility = await checkImportCompatibility(preview.manifest!)

    return NextResponse.json({
      success: true,
      valid: true,
      manifest: preview.manifest,
      files: preview.files,
      compatibility,
      warnings: [...preview.warnings, ...compatibility.warnings],
    })
  } catch (error: any) {
    console.error('Preview import error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// Import a skill
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
    const { source, url, fileContent, autoInstall } = body

    if (!source) {
      return NextResponse.json(
        { success: false, error: 'source is required (url or file)' },
        { status: 400 }
      )
    }

    if (source === 'url' && !url) {
      return NextResponse.json(
        { success: false, error: 'url is required for URL source' },
        { status: 400 }
      )
    }

    if (source === 'file' && !fileContent) {
      return NextResponse.json(
        { success: false, error: 'fileContent is required for file source' },
        { status: 400 }
      )
    }

    const result = await importSkill(
      {
        source,
        url,
        fileContent,
        autoInstall: autoInstall !== false,
      },
      session.id
    )

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          errors: result.errors,
          warnings: result.warnings,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      skill: result.skill,
      warnings: result.warnings,
    })
  } catch (error: any) {
    console.error('Import skill error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
