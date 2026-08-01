import React from 'react'

const links = [
  { label: 'Timetable', href: '#plan' },
  { label: 'Syllabus & Topics', href: '#subjects' },
  { label: 'Progress & Mastery', href: '#progress' },
  { label: 'AI Assistant', href: '#assistant' },
  { label: 'Settings', href: '#settings' }
]

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-linen/10 bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 md:px-10 lg:px-16">
        <a href="#plan" className="font-display text-base sm:text-lg text-linen font-bold flex items-center gap-2">
          <span>⚡ Study Planner</span>
        </a>
        <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-linen/70">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1 whitespace-nowrap hover:bg-surface hover:text-marigold transition"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
}
