import { useState, useSyncExternalStore } from 'react'
import RecordCard from '../components/RecordCard'
import { getSnapshot, subscribe, upsertPlaylist, removePlaylist } from '../data/store'

export default function PlaylistsPage({
  onOpen,
}: {
  onOpen: (id: string) => void
}) {
  const data = useSyncExternalStore(subscribe, getSnapshot)
  const [newName, setNewName] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [choosing, setChoosing] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)

  function createPlaylist() {
    const name = newName.trim()
    if (!name) return
    const playlist = upsertPlaylist({ name })
    setNewName('')
    setExpanded(playlist.id)
  }

  function toggleRecord(playlistId: string, recordId: string) {
    const playlist = data.playlists.find((item) => item.id === playlistId)
    if (!playlist) return
    const recordIds = playlist.recordIds.includes(recordId)
      ? playlist.recordIds.filter((id) => id !== recordId)
      : [...playlist.recordIds, recordId]
    upsertPlaylist({ ...playlist, recordIds })
  }

  const choosingPlaylist = data.playlists.find((item) => item.id === choosing)

  return (
    <main className="page">
      <header className="app-header">
        <div className="brand serif">片单</div>
        <div className="brand-sub">PLAYLISTS</div>
      </header>

      <div className="playlist-create">
        <input
          type="text"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') createPlaylist() }}
          placeholder="给新片单起个名字"
        />
        <button type="button" onClick={createPlaylist}>新建</button>
      </div>

      {data.playlists.length === 0 ? (
        <div className="empty-state">还没有片单。建一个收藏夹，把想反复看的片放进去。</div>
      ) : (
        <div className="playlist-list">
          {data.playlists.map((playlist) => {
            const items = playlist.recordIds
              .map((id) => data.records.find((record) => record.id === id))
              .filter((record) => record !== undefined)
            const isExpanded = expanded === playlist.id
            return (
              <div className="playlist-card" key={playlist.id}>
                <div className="playlist-head">
                  <button type="button" className="playlist-toggle" onClick={() => setExpanded(isExpanded ? null : playlist.id)}>
                    <span className="playlist-name serif">{playlist.name}</span>
                    <span className="playlist-count">{items.length} 部 {isExpanded ? '· 收起' : '· 展开'}</span>
                  </button>
                  <button type="button" className="playlist-add" onClick={() => setChoosing(playlist.id)}>+ 加片</button>
                </div>

                {isExpanded && (
                  <div className="playlist-body">
                    {items.length === 0 ? (
                      <div className="playlist-empty">这个片单还是空的。</div>
                    ) : (
                      <div className="record-list">
                        {items.map((record) => (
                          <RecordCard key={record!.id} record={record!} onClick={(item) => onOpen(item.id)} />
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      className="playlist-delete"
                      onClick={() => {
                        if (confirmingDelete === playlist.id) {
                          removePlaylist(playlist.id)
                          setConfirmingDelete(null)
                          setExpanded(null)
                        } else {
                          setConfirmingDelete(playlist.id)
                        }
                      }}
                    >
                      {confirmingDelete === playlist.id ? '确认删除这个片单？' : '删除片单'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {choosingPlaylist && (
        <div className="sheet-backdrop" onClick={() => setChoosing(null)}>
          <div className="sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-header">
              <span className="serif">加入「{choosingPlaylist.name}」</span>
              <button type="button" onClick={() => setChoosing(null)} aria-label="关闭">×</button>
            </div>
            <div className="sheet-body">
              {data.records.length === 0 ? (
                <div className="empty-state">还没有记录可以加。</div>
              ) : (
                data.records.map((record) => {
                  const selected = choosingPlaylist.recordIds.includes(record.id)
                  return (
                    <button key={record.id} type="button" className={`picker-item${selected ? ' is-selected' : ''}`} onClick={() => toggleRecord(choosingPlaylist.id, record.id)}>
                      <img src={record.posterUrl} alt="" />
                      <span className="picker-title serif">{record.title}</span>
                      <span className="picker-mark">{selected ? '✓' : '+'}</span>
                    </button>
                  )
                })
              )}
            </div>
            <div className="sheet-footer">
              <button type="button" className="primary-button" onClick={() => setChoosing(null)}>完成</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
