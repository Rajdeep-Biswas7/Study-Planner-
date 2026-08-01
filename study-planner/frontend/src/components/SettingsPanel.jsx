import { useEffect, useState } from 'react'

const API_BASE = '/api'

function minutesBetween(start, end) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return Math.max(0, eh * 60 + em - (sh * 60 + sm))
}

function SlotRow({ slot, onChange, onRemove, subjectOptions }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <input
        type="time"
        value={slot.startTime}
        onChange={(e) => onChange({ ...slot, startTime: e.target.value })}
        className="rounded-lg border border-linen/15 bg-ink px-2 py-1 text-linen"
      />
      <span className="text-linen/40">to</span>
      <input
        type="time"
        value={slot.endTime}
        onChange={(e) => onChange({ ...slot, endTime: e.target.value })}
        className="rounded-lg border border-linen/15 bg-ink px-2 py-1 text-linen"
      />
      <select
        value={slot.subjectId || ''}
        onChange={(e) => onChange({ ...slot, subjectId: e.target.value, subjectName: subjectOptions.find((s) => s.id === e.target.value)?.name || '' })}
        className="rounded-lg border border-linen/15 bg-ink px-2 py-1 text-linen"
      >
        <option value="">Default subject</option>
        {subjectOptions.map((subject) => (
          <option key={subject.id} value={subject.id}>{subject.name}</option>
        ))}
      </select>
      <button onClick={onRemove} className="text-rollover text-xs hover:underline ml-auto">
        Remove
      </button>
    </div>
  )
}

export default function SettingsPanel() {
  const [settings, setSettings] = useState(null)
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/settings`)
      .then((r) => r.json())
      .then(setSettings)
  }, [])

  function updateSlot(type, index, next) {
    const slots = { ...settings.slots }
    slots[type] = slots[type].map((s, i) =>
      i === index ? { ...next, minutes: minutesBetween(next.startTime, next.endTime) } : s
    )
    setSettings({ ...settings, slots })
  }

  function removeSlot(type, index) {
    const slots = { ...settings.slots }
    slots[type] = slots[type].filter((_, i) => i !== index)
    setSettings({ ...settings, slots })
  }

  function addSlot(type) {
    const slots = { ...settings.slots }
    slots[type] = [...slots[type], { startTime: '18:00', endTime: '19:00', minutes: 60 }]
    setSettings({ ...settings, slots })
  }

  async function save() {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
    const updated = await res.json()
    setSettings(updated)
    setSaved(true)
    window.dispatchEvent(new Event('schedule:updated'))
    setTimeout(() => setSaved(false), 1500)
  }

  if (!settings) return null

  return (
    <section id="settings" className="px-6 md:px-16 py-6 max-w-3xl mx-auto">
      <button
        onClick={() => setOpen((o) => !o)}
        className="font-body text-sm text-linen/60 hover:text-marigold underline underline-offset-4"
      >
        {open ? 'Hide timetable settings' : 'Edit my timetable & daily goal'}
      </button>

      {open && (
        <div className="mt-4 rounded-xl border border-linen/10 bg-surface px-6 py-5 space-y-6">
          <div>
            <label className="text-sm text-linen/60 block mb-1">
              Daily study goal (the "challenge")
            </label>
            <input
              type="number"
              min="30"
              step="30"
              value={settings.dailyGoalMinutes}
              onChange={(e) => setSettings({ ...settings, dailyGoalMinutes: Number(e.target.value) })}
              className="rounded-lg border border-linen/15 bg-ink px-3 py-2 text-sm text-linen w-32"
            />
            <span className="text-linen/40 text-sm ml-2">minutes (360 = 6 hours)</span>
          </div>

          <div className="rounded-xl border border-linen/10 bg-ink/40 p-4">
            <p className="text-sm text-linen/60 mb-3">Edit subject names</p>
            <div className="space-y-2">
              {settings.subjectNames?.map((subject, index) => (
                <div key={subject.id || index} className="flex items-center gap-2">
                  <input
                    value={subject.name}
                    onChange={(e) => {
                      const next = [...(settings.subjectNames || [])]
                      next[index] = { ...subject, name: e.target.value }
                      setSettings({ ...settings, subjectNames: next })
                    }}
                    className="flex-1 rounded-lg border border-linen/15 bg-ink px-3 py-2 text-sm text-linen"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-linen/60 mb-2">Normal day time blocks</p>
            <div className="space-y-2">
              {settings.slots.normal.map((slot, i) => (
                <SlotRow
                  key={i}
                  slot={slot}
                  onChange={(s) => updateSlot('normal', i, s)}
                  onRemove={() => removeSlot('normal', i)}
                  subjectOptions={settings.subjectNames || []}
                />
              ))}
            </div>
            <button onClick={() => addSlot('normal')} className="mt-2 text-marigold text-sm hover:underline">
              + Add block
            </button>
          </div>

          <div>
            <p className="text-sm text-linen/60 mb-2">Light / festival day time blocks</p>
            <div className="space-y-2">
              {settings.slots.light.map((slot, i) => (
                <SlotRow
                  key={i}
                  slot={slot}
                  onChange={(s) => updateSlot('light', i, s)}
                  onRemove={() => removeSlot('light', i)}
                  subjectOptions={settings.subjectNames || []}
                />
              ))}
            </div>
            <button onClick={() => addSlot('light')} className="mt-2 text-marigold text-sm hover:underline">
              + Add block
            </button>
          </div>

          <button
            onClick={save}
            className="rounded-full bg-marigold px-5 py-2 text-sm font-medium text-ink hover:opacity-90"
          >
            {saved ? 'Saved' : 'Save changes'}
          </button>
          <p className="text-xs text-linen/40">
            Today's schedule refreshes immediately after you save these changes.
          </p>
        </div>
      )}
    </section>
  )
}
