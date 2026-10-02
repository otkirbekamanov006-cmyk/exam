import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const emptyItemForm = {
  category_id: '',
  type: 'lost',
  title: '',
  description: '',
  location: '',
  event_date: '',
  secret_question: '',
  secret_answer: '',
}

const emptyAuthForm = { full_name: '', email: '', phone: '', password: '' }

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Request failed')
  }

  return data
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('topildi_token') || '')
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('topildi_user')
    return stored ? JSON.parse(stored) : null
  })
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState(emptyAuthForm)
  const [itemForm, setItemForm] = useState(emptyItemForm)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [claimItem, setClaimItem] = useState(null)
  const [claimForm, setClaimForm] = useState({ answer: '', message: '' })

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const typeMatch = typeFilter === 'all' || item.type === typeFilter
      const categoryMatch = categoryFilter === 'all' || String(item.category_id) === String(categoryFilter)
      return typeMatch && categoryMatch
    })
  }, [items, typeFilter, categoryFilter])

  useEffect(() => {
    loadCategories()
    loadItems()
  }, [])

  useEffect(() => {
    if (token) {
      loadMe()
    }
  }, [token])

  const loadCategories = async () => {
    try {
      const result = await apiRequest('/api/categories')
      setCategories(result.data || [])
    } catch (error) {
      console.error(error)
    }
  }

  const loadItems = async () => {
    setLoading(true)
    try {
      const result = await apiRequest('/api/items')
      setItems(result.data || [])
    } catch (error) {
      console.error(error)
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadMe = async () => {
    try {
      const result = await apiRequest('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setCurrentUser(result.user)
      localStorage.setItem('topildi_user', JSON.stringify(result.user))
    } catch (error) {
      logout()
    }
  }

  const logout = () => {
    setToken('')
    setCurrentUser(null)
    localStorage.removeItem('topildi_token')
    localStorage.removeItem('topildi_user')
  }

  const handleAuthChange = (event) => {
    const { name, value } = event.target
    setAuthForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login'
      const payload = authMode === 'register'
        ? {
            full_name: authForm.full_name,
            email: authForm.email,
            phone: authForm.phone,
            password: authForm.password,
          }
        : {
            email: authForm.email,
            password: authForm.password,
          }

      const result = await apiRequest(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (authMode === 'login') {
        localStorage.setItem('topildi_token', result.token)
        setToken(result.token)
        setCurrentUser(result.user)
        localStorage.setItem('topildi_user', JSON.stringify(result.user))
        setMessage(result.message)
      } else {
        setMessage(result.message)
        setAuthMode('login')
        setAuthForm({ ...emptyAuthForm, email: authForm.email })
      }
    } catch (error) {
      setMessage(error.message)
    }
  }

  const handleItemChange = (event) => {
    const { name, value } = event.target
    setItemForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleItemSubmit = async (event) => {
    event.preventDefault()
    setMessage('')

    const formData = new FormData()
    Object.entries(itemForm).forEach(([key, value]) => {
      if (value !== '') formData.append(key, value)
    })

    selectedFiles.forEach((file) => {
      formData.append('images', file)
    })

    try {
      const result = await apiRequest('/api/items', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      setMessage('E’lon muvaffaqiyatli yaratildi')
      setItemForm(emptyItemForm)
      setSelectedFiles([])
      loadItems()
      if (result?.data) {
        setClaimItem(null)
      }
    } catch (error) {
      setMessage(error.message)
    }
  }

  const handleClaimSubmit = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      const result = await apiRequest(`/api/claims/items/${claimItem.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(claimForm),
      })

      setMessage('Da’vo muvaffaqiyatli yuborildi')
      setClaimForm({ answer: '', message: '' })
      setClaimItem(null)
      loadItems()
      console.log(result)
    } catch (error) {
      setMessage(error.message)
    }
  }

  const handleStatusUpdate = async (itemId, status) => {
    try {
      await apiRequest(`/api/items/${itemId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })
      setMessage('Status yangilandi')
      loadItems()
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">T</span>
          <span>Topildi</span>
        </div>
        <nav className="nav">
          <button type="button" className="nav-link active">Asosiy</button>
          <button type="button" className="nav-link">E’lonlar</button>
          <button type="button" className="nav-link">Yordam</button>
        </nav>
        {currentUser ? (
          <div className="user-box">
            <span>{currentUser.full_name}</span>
            <button type="button" className="ghost-button" onClick={logout}>Chiqish</button>
          </div>
        ) : (
          <button type="button" className="primary-button" onClick={() => setAuthMode('login')}>
            Kirish
          </button>
        )}
      </header>

      <main className="container">
        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow">Yo‘qolgan va topilgan buyumlar platformasi</span>
            <h1>Buyumlaringizni tez va xavfsiz qaytarib oling.</h1>
            <p>
              Topildi — bu e’lonlar orqali yo‘qolgan narsalarni topish va egasiga qaytarish uchun mo‘ljallangan platforma.
            </p>
            <div className="hero-actions">
              <button type="button" className="primary-button">E’lon qo‘shish</button>
              <button type="button" className="secondary-button">Ko‘rish</button>
            </div>
          </div>

          {!currentUser ? (
            <div className="auth-card">
              <div className="toggle-row">
                <button
                  type="button"
                  className={authMode === 'login' ? 'toggle active' : 'toggle'}
                  onClick={() => setAuthMode('login')}
                >
                  Kirish
                </button>
                <button
                  type="button"
                  className={authMode === 'register' ? 'toggle active' : 'toggle'}
                  onClick={() => setAuthMode('register')}
                >
                  Ro‘yxatdan o‘tish
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="auth-form">
                {authMode === 'register' && (
                  <>
                    <label>
                      To‘liq ism
                      <input name="full_name" value={authForm.full_name} onChange={handleAuthChange} required />
                    </label>
                    <label>
                      Telefon
                      <input name="phone" value={authForm.phone} onChange={handleAuthChange} required />
                    </label>
                  </>
                )}

                <label>
                  Email
                  <input type="email" name="email" value={authForm.email} onChange={handleAuthChange} required />
                </label>

                <label>
                  Parol
                  <input type="password" name="password" value={authForm.password} onChange={handleAuthChange} required />
                </label>

                <button type="submit" className="primary-button full-width">
                  {authMode === 'login' ? 'Kirish' : 'Ro‘yxatdan o‘tish'}
                </button>
              </form>
            </div>
          ) : (
            <div className="welcome-card">
              <h3>Xush kelibsiz, {currentUser.full_name}</h3>
              <p>Bu yerda yo‘qolgan buyumlaringizni topishingiz yoki topilgan narsalarni qaytarishingiz mumkin.</p>
              <div className="mini-stats">
                <div>
                  <strong>{items.length}</strong>
                  <span>E’lonlar</span>
                </div>
                <div>
                  <strong>{categories.length}</strong>
                  <span>Kategoriyalar</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {message && <div className="message-box">{message}</div>}

        <section className="filter-bar">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">Barcha tur</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">Barcha kategoriyalar</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </section>

        <section className="content-grid">
          <div className="items-column">
            {loading ? (
              <div className="loader">Yuklanmoqda...</div>
            ) : visibleItems.length === 0 ? (
              <div className="empty-state">Hech qanday e’lon yo‘q.</div>
            ) : (
              visibleItems.map((item) => (
                <article key={item.id} className="item-card">
                  <div className="item-media">
                    {item.images && item.images.length > 0 ? (
                      <img src={`${API_URL}/uploads/${item.images[0]}`} alt={item.title} />
                    ) : (
                      <div className="image-placeholder">No image</div>
                    )}
                  </div>

                  <div className="item-body">
                    <div className="item-header-row">
                      <span className={`badge ${item.type}`}>{item.type}</span>
                      <span className="status">{item.status}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <ul className="meta-list">
                      <li><strong>Location:</strong> {item.location}</li>
                      <li><strong>Date:</strong> {item.event_date}</li>
                      <li><strong>Category:</strong> {item.category_name || 'Unknown'}</li>
                    </ul>

                    <div className="card-actions">
                      {currentUser && currentUser.id !== item.user_id && (
                        <button type="button" className="primary-button" onClick={() => setClaimItem(item)}>
                          Da’vo qilish
                        </button>
                      )}

                      {(currentUser?.role === 'admin' || currentUser?.id === item.user_id) && (
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => handleStatusUpdate(item.id, item.status === 'active' ? 'returned' : 'closed')}
                        >
                          {item.status === 'active' ? 'Qaytarildi deb belgilash' : 'Yopish'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          {currentUser && (
            <aside className="side-panel">
              <div className="panel-box">
                <h3>E’lon qo‘shish</h3>
                <form onSubmit={handleItemSubmit} className="item-form">
                  <select name="type" value={itemForm.type} onChange={handleItemChange}>
                    <option value="lost">Lost</option>
                    <option value="found">Found</option>
                  </select>

                  <select name="category_id" value={itemForm.category_id} onChange={handleItemChange} required>
                    <option value="">Kategoriya tanlang</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>

                  <input name="title" value={itemForm.title} onChange={handleItemChange} placeholder="Sarlavha" required />
                  <textarea name="description" value={itemForm.description} onChange={handleItemChange} placeholder="Tavsif" required />
                  <input name="location" value={itemForm.location} onChange={handleItemChange} placeholder="Manzil" required />
                  <input type="date" name="event_date" value={itemForm.event_date} onChange={handleItemChange} required />
                  <input name="secret_question" value={itemForm.secret_question} onChange={handleItemChange} placeholder="Maxfiy savol" />
                  <input name="secret_answer" value={itemForm.secret_answer} onChange={handleItemChange} placeholder="Maxfiy javob" required />

                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => setSelectedFiles(Array.from(event.target.files))}
                  />

                  <button type="submit" className="primary-button full-width">Saqlash</button>
                </form>
              </div>

              {claimItem && (
                <div className="panel-box claim-box">
                  <h3>{claimItem.title} uchun da’vo</h3>
                  <form onSubmit={handleClaimSubmit} className="claim-form">
                    <input
                      value={claimForm.answer}
                      onChange={(e) => setClaimForm({ ...claimForm, answer: e.target.value })}
                      placeholder="Maxfiy javob"
                      required
                    />
                    <textarea
                      value={claimForm.message}
                      onChange={(e) => setClaimForm({ ...claimForm, message: e.target.value })}
                      placeholder="Qo‘shimcha ma’lumot"
                    />
                    <div className="card-actions">
                      <button type="submit" className="primary-button">Yuborish</button>
                      <button type="button" className="secondary-button" onClick={() => setClaimItem(null)}>Bekor qilish</button>
                    </div>
                  </form>
                </div>
              )}
            </aside>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
