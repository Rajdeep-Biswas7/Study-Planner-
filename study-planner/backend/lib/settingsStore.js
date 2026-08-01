// Your editable timetable + daily goal, persisted to disk (unlike the rest
// of the app state, which is in-memory and resets on server restart).
// This is the ONLY file the frontend's Settings panel talks to indirectly
// (via routes/settings.js) — edit DEFAULT_SETTINGS below to change the
// starting point, or just edit it from the website itself.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const settingsPath = path.join(__dirname, '..', 'data', 'settings.json')

const DEFAULT_SETTINGS = {
  dailyGoalMinutes: 360, // the "6-hour challenge" — change freely
  lightGoalMinutes: 120, // reduced target on festival/light days
  rolloverCapMinutes: 180, // max minutes a shortfall can push into tomorrow
  slots: {
    normal: [
      { startTime: '06:30', endTime: '08:00', minutes: 90 },
      { startTime: '17:00', endTime: '18:30', minutes: 90 },
      { startTime: '19:00', endTime: '20:30', minutes: 90 },
      { startTime: '21:00', endTime: '22:00', minutes: 60 }
    ],
    light: [
      { startTime: '07:00', endTime: '08:00', minutes: 60 },
      { startTime: '20:00', endTime: '21:00', minutes: 60 }
    ]
  }
}

export function loadSettings() {
  if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(settingsPath, JSON.stringify(DEFAULT_SETTINGS, null, 2))
    return structuredClone(DEFAULT_SETTINGS)
  }
  return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
}

export function saveSettings(next) {
  fs.writeFileSync(settingsPath, JSON.stringify(next, null, 2))
  return next
}
