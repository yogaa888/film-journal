import { useEffect, useRef, useState } from 'react'
import TabBar, { type TabKey } from './components/TabBar'
import DetailPage from './pages/DetailPage'
import EditorPage from './pages/EditorPage'
import MePage from './pages/MePage'
import PlaylistsPage from './pages/PlaylistsPage'
import SearchPage from './pages/SearchPage'
import TimelinePage from './pages/TimelinePage'

type Route =
  | { kind: 'tab'; tab: TabKey }
  | { kind: 'new' }
  | { kind: 'edit'; id: string }
  | { kind: 'detail'; id: string }

function routeFromHash(): Route {
  const raw = window.location.hash.replace(/^#\/?/, '')
  const [head, param] = raw.split('/')
  if (head === 'new') return { kind: 'new' }
  if (head === 'edit' && param) return { kind: 'edit', id: decodeURIComponent(param) }
  if (head === 'detail' && param) return { kind: 'detail', id: decodeURIComponent(param) }
  const tab = TAB_KEYS.includes(head as TabKey) ? (head as TabKey) : 'timeline'
  return { kind: 'tab', tab }
}

function resetScroll() {
  window.scrollTo(0, 0)
}

const TAB_KEYS: TabKey[] = ['timeline', 'search', 'playlists', 'me']

export default function App() {
  const [route, setRoute] = useState<Route>(routeFromHash)
  const [toast, setToast] = useState('')
  const toastTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const onHashChange = () => {
      setRoute(routeFromHash())
      resetScroll()
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function showToast(message: string) {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2200)
  }

  function navigate(hash: string, next: Route) {
    window.location.hash = hash
    setRoute(next)
    resetScroll()
  }

  function goTo(tab: TabKey) {
    navigate(`#/${tab}`, { kind: 'tab', tab })
  }

  function openNew() {
    navigate('#/new', { kind: 'new' })
  }

  function openEdit(id: string) {
    navigate(`#/edit/${encodeURIComponent(id)}`, { kind: 'edit', id })
  }

  function openDetail(id: string) {
    navigate(`#/detail/${encodeURIComponent(id)}`, { kind: 'detail', id })
  }

  function backToTimeline(message?: string) {
    navigate('#/timeline', { kind: 'tab', tab: 'timeline' })
    if (message) showToast(message)
  }

  const isEditor = route.kind === 'new' || route.kind === 'edit'
  const isDetail = route.kind === 'detail'

  return (
    <div className={`app-shell${isEditor || isDetail ? ' no-tab-padding' : ''}`}>
      {route.kind === 'new' && (
        <EditorPage onDone={(message) => backToTimeline(message)} onCancel={() => backToTimeline()} />
      )}
      {route.kind === 'edit' && (
        <EditorPage
          id={route.id}
          onDone={(message) => backToTimeline(message)}
          onCancel={() => backToTimeline()}
        />
      )}
      {route.kind === 'detail' && (
        <DetailPage
          id={route.id}
          onBack={() => backToTimeline()}
          onEdit={() => openEdit(route.id)}
          onSelect={(id) => openDetail(id)}
        />
      )}
      {route.kind === 'tab' && route.tab === 'timeline' && (
        <TimelinePage onOpen={(record) => openDetail(record.id)} onNew={openNew} />
      )}
      {route.kind === 'tab' && route.tab === 'search' && (
        <SearchPage onOpen={(id) => openDetail(id)} />
      )}
      {route.kind === 'tab' && route.tab === 'playlists' && (
        <PlaylistsPage onOpen={(id) => openDetail(id)} />
      )}
      {route.kind === 'tab' && route.tab === 'me' && (
        <MePage onToast={showToast} />
      )}

      {route.kind === 'tab' && (
        <>
          {route.tab === 'timeline' && (
            <div className="fab-wrap">
              <button type="button" className="fab" onClick={openNew} aria-label="新增记录">+</button>
            </div>
          )}
          <TabBar active={route.tab} onChange={goTo} />
        </>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
