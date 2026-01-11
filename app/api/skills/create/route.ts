import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import {
  createSkillFromTemplate,
  getAvailableTemplates,
  previewSkillCreation,
} from '@/lib/skills/package'
import { importSkill } from '@/lib/skills/package/importer'

// Get available templates
export async function GET() {
  try {
    const templates = getAvailableTemplates()

    return NextResponse.json({
      success: true,
      templates: templates.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        icon: t.icon,
        variables: t.variables,
      })),
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// Create a new skill from template
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
    const { templateId, variables, preview, autoInstall } = body

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'templateId is required' },
        { status: 400 }
      )
    }

    // Preview mode - just show what would be created
    if (preview) {
      const previewResult = previewSkillCreation({ templateId, variables })
      return NextResponse.json({
        success: previewResult.errors.length === 0,
        preview: true,
        files: previewResult.files,
        manifest: previewResult.manifest,
        errors: previewResult.errors,
      })
    }

    // Create the skill package
    const createResult = createSkillFromTemplate({ templateId, variables })

    if (!createResult.success || !createResult.package) {
      return NextResponse.json(
        {
          success: false,
          errors: createResult.errors,
          warnings: createResult.warnings,
        },
        { status: 400 }
      )
    }

    // Import the created package into the database
    const importResult = await importSkill(
      {
        source: 'file',
        fileContent: JSON.stringify(createResult.package),
        autoInstall: autoInstall !== false,
      },
      session.id
    )

    if (!importResult.success) {
      return NextResponse.json(
        {
          success: false,
          errors: importResult.errors,
          warnings: [...createResult.warnings, ...importResult.warnings],
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      skill: importResult.skill,
      package: createResult.package,
      warnings: [...createResult.warnings, ...importResult.warnings],
    })
  } catch (error: any) {
    console.error('Create skill error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
