import { useMemo, useState } from 'react'

export default function TemplatesPanel({
  templates,
  onCreateTemplate,
  onSaveTemplate,
  saving,
}) {
  const [newTemplateName, setNewTemplateName] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [editorState, setEditorState] = useState({
    name: '',
    accentColor: '#5ECFCF',
    backgroundColor: '#0A1F1F',
  })

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === selectedTemplateId) || null,
    [templates, selectedTemplateId]
  )

  function hydrateTemplate(template) {
    setSelectedTemplateId(template.id)
    setEditorState({
      name: template.name || '',
      accentColor: template.page_data?.settings?.accentColor || '#5ECFCF',
      backgroundColor: template.page_data?.settings?.background?.value || '#0A1F1F',
    })
  }

  function handleCreate() {
    const trimmed = newTemplateName.trim()
    if (!trimmed) return
    onCreateTemplate(trimmed)
    setNewTemplateName('')
  }

  function handleSave() {
    if (!selectedTemplate) return

    const nextPageData = {
      ...(selectedTemplate.page_data || {}),
      settings: {
        ...(selectedTemplate.page_data?.settings || {}),
        accentColor: editorState.accentColor,
        background: {
          ...(selectedTemplate.page_data?.settings?.background || { type: 'color' }),
          type: 'color',
          value: editorState.backgroundColor,
        },
      },
    }

    onSaveTemplate(selectedTemplate.id, {
      name: editorState.name,
      page_data: nextPageData,
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="surface-card p-6">
        <div className="eyebrow mb-4">Admin templates</div>
        <h2 className="display mb-6 text-3xl font-bold">Content Templates</h2>

        <div className="grid gap-4">
          <div className="grid gap-3">
            <input
              type="text"
              className="field"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="New template name"
            />
            <button type="button" className="btn btn-primary" onClick={handleCreate}>
              Create Template
            </button>
          </div>

          <div className="divider my-2" />

          <div className="grid gap-3">
            {templates.length ? (
              templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => hydrateTemplate(template)}
                  className={`rounded-[18px] border p-4 text-left transition ${
                    selectedTemplateId === template.id
                      ? 'border-[rgba(94,207,207,0.3)] bg-[rgba(94,207,207,0.08)]'
                      : 'border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)]'
                  }`}
                >
                  <div className="font-semibold">{template.name}</div>
                  <div className="mt-1 text-sm text-white/55">
                    {template.id}
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4 text-sm text-white/55">
                No templates yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="surface-card p-6">
        <div className="eyebrow mb-4">Template editor</div>
        <h2 className="display mb-6 text-3xl font-bold">
          {selectedTemplate ? 'Edit Template' : 'Select a template'}
        </h2>

        {!selectedTemplate ? (
          <p className="muted">
            Pick a template from the left, or create a new one first.
          </p>
        ) : (
          <div className="grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-medium">Template Name</label>
              <input
                type="text"
                className="field"
                value={editorState.name}
                onChange={(e) =>
                  setEditorState((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Accent Color</label>
              <input
                type="text"
                className="field"
                value={editorState.accentColor}
                onChange={(e) =>
                  setEditorState((prev) => ({ ...prev, accentColor: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Background Color</label>
              <input
                type="text"
                className="field"
                value={editorState.backgroundColor}
                onChange={(e) =>
                  setEditorState((prev) => ({ ...prev, backgroundColor: e.target.value }))
                }
              />
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Template'}
            </button>

            <div className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-5">
              <div className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-[#5ECFCF]">
                Next step
              </div>
              <p className="text-sm leading-7 text-white/62">
                This step sets up template storage and locked rendering. After this,
                we can add template assignment to QR codes and a richer admin template builder.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
