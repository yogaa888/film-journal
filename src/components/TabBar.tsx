import type { ReactNode } from 'react'

export type TabKey = 'timeline' | 'search' | 'playlists' | 'me'

const ITEMS: { key: TabKey; label: string; icon: ReactNode }[] = [
  {
    key: 'timeline',
    label: '时间线',
    icon: <path d="M4 6h16M4 12h16M4 18h10" />,
  },
  {
    key: 'search',
    label: '搜索',
    icon: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" /></>,
  },
  {
    key: 'playlists',
    label: '片单',
    icon: <path d="M6 3.5h12v17l-6-4.2-6 4.2z" />,
  },
  {
    key: 'me',
    label: '我的',
    icon: <><circle cx="12" cy="8" r="3.6" /><path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6" /></>,
  },
]

export default function TabBar({
  active,
  onChange,
}: {
  active: TabKey
  onChange: (key: TabKey) => void
}) {
  return (
    <nav className="tab-bar" aria-label="主导航">
      {ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`tab-item${active === item.key ? ' is-active' : ''}`}
          onClick={() => onChange(item.key)}
          aria-current={active === item.key ? 'page' : undefined}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {item.icon}
          </svg>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
