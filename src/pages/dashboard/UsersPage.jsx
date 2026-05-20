import { useState, useMemo } from 'react'
import { useAuth } from '../../lib/authContext.jsx'
import { useUsers, useToggleUserBlock } from '../../hooks/useUsers.js'
import UserRow from '../../features/users/UserRow.jsx'
import CreateUserModal from '../../features/users/CreateUserModal.jsx'
import EditUserModal from '../../features/users/EditUserModal.jsx'
import ConfirmBlockModal from '../../features/users/ConfirmBlockModal.jsx'

// ─── Inline styles ────────────────────────────────────────────────────────────

const pageStyle = {
  maxWidth: '1100px',
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '20px',
  flexWrap: 'wrap',
  gap: '12px',
}

const searchStyle = {
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  width: '260px',
  outline: 'none',
}

const addBtnStyle = {
  padding: '8px 18px',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '14px',
}

const thStyle = {
  padding: '10px 16px',
  borderBottom: '2px solid #e5e7eb',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase',
  color: '#6b7280',
  whiteSpace: 'nowrap',
}

// ─── Skeleton rows ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  const cellStyle = {
    padding: '14px 16px',
    borderBottom: '1px solid #e5e7eb',
  }
  const barStyle = {
    height: '14px',
    background: '#e5e7eb',
    borderRadius: '4px',
    animation: 'pulse 1.5s ease-in-out infinite',
  }
  return (
    <tr>
      {[120, 160, 80, 70, 90, 140].map((w, i) => (
        <td key={i} style={cellStyle}>
          <div style={{ ...barStyle, width: w }} />
        </td>
      ))}
    </tr>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────────

function UsersPage() {
  const { user: currentUser } = useAuth()
  const { data: users = [], isLoading, isError, error, refetch, isFetching } = useUsers()
  const { mutateAsync: toggleBlock, isPending: isBlockPending } = useToggleUserBlock()

  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState(null)   // UserDoc | null
  const [blockTarget, setBlockTarget] = useState(null) // UserDoc | null

  // Локальная фильтрация — без дополнительных запросов к Firestore
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        (u.displayName ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q),
    )
  }, [users, search])

  async function handleConfirmBlock() {
    if (!blockTarget) return
    try {
      await toggleBlock({ uid: blockTarget.uid, disabled: !blockTarget.disabled })
    } finally {
      setBlockTarget(null)
    }
  }

  // ── Render states ──────────────────────────────────────────────────────────

  return (
    <div data-testid="users-page" style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>
          Пользователи
        </h1>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            data-testid="users-search"
            type="search"
            placeholder="Поиск по имени или email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={searchStyle}
          />
          <button
            data-testid="users-add-button"
            type="button"
            onClick={() => setShowCreate(true)}
            style={addBtnStyle}
          >
            + Добавить сотрудника
          </button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div
          data-testid="users-error"
          style={{
            padding: '16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b',
            marginBottom: '16px',
          }}
        >
          <p style={{ margin: '0 0 8px' }}>
            Не удалось загрузить список сотрудников:{' '}
            {error?.message ?? 'Неизвестная ошибка'}
          </p>
          <button
            data-testid="users-retry"
            type="button"
            onClick={() => refetch()}
            style={{
              padding: '6px 14px',
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Повторить
          </button>
        </div>
      )}

      {/* Table */}
      <div
        data-testid="users-table"
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={thStyle}>Имя</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Роль</th>
              <th style={thStyle}>Статус</th>
              <th style={thStyle}>Добавлен</th>
              <th style={thStyle}>Действия</th>
            </tr>
          </thead>

          {/* Skeleton tbody during initial loading */}
          {(isLoading || isFetching) && !users.length && (
            <tbody data-testid="users-skeleton">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </tbody>
          )}

          {/* Empty state tbody */}
          {!isLoading && !isError && filtered.length === 0 && (
            <tbody>
              <tr>
                <td
                  data-testid="users-empty"
                  colSpan={6}
                  style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    color: '#6b7280',
                  }}
                >
                  {search
                    ? 'Сотрудники не найдены. Попробуйте изменить запрос.'
                    : 'Сотрудников пока нет.'}
                  {!search && (
                    <>
                      {' '}
                      <button
                        type="button"
                        onClick={() => setShowCreate(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563eb',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          fontSize: '14px',
                          padding: 0,
                        }}
                      >
                        Добавить первого сотрудника
                      </button>
                    </>
                  )}
                </td>
              </tr>
            </tbody>
          )}

          {/* Data rows tbody */}
          <tbody>
            {filtered.map((u) => (
              <UserRow
                key={u.uid}
                user={u}
                currentUid={currentUser?.uid}
                onEdit={setEditTarget}
                onToggleBlock={setBlockTarget}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateUserModal onClose={() => setShowCreate(false)} />
      )}

      {editTarget && (
        <EditUserModal
          user={editTarget}
          currentUid={currentUser?.uid}
          onClose={() => setEditTarget(null)}
        />
      )}

      {blockTarget && (
        <ConfirmBlockModal
          user={blockTarget}
          onConfirm={handleConfirmBlock}
          onCancel={() => setBlockTarget(null)}
          isPending={isBlockPending}
        />
      )}
    </div>
  )
}

export default UsersPage
