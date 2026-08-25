import React, { useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import styles from './App.module.css';

type Profile = {
  username: string;
  fullname: string;
  interests?: string | null;
  likes?: string | null;
  dislikes?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  youtube?: string | null;
};

type Message = {
  id: number;
  content: string;
  createdAt: string;
  authorUsername: string;
  authorFullname: string;
};

function formatLocalTime(timestamp: string) {
  // SQLite CURRENT_TIMESTAMP is UTC but omits the ISO 8601 timezone suffix.
  const isoTimestamp = timestamp.includes('T') ? timestamp : timestamp.replace(' ', 'T');
  const utcTimestamp = /(?:Z|[+-]\d{2}:?\d{2})$/.test(isoTimestamp) ? isoTimestamp : `${isoTimestamp}Z`;
  return new Date(utcTimestamp).toLocaleString();
}

function AccountActions() {
  const { user, login, logout } = useAuth();

  return (
    <div className={styles.accountActions}>
      {user ? (
        <>
          <Link to="/me">{user.fullname}</Link>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={logout}>Logout</button>
        </>
      ) : (
        <button className={`${styles.btn} ${styles.btnWarn}`} onClick={login}>Login via SSO UI</button>
      )}
    </div>
  );
}

function Header() {
  return (
    <header className={styles.header}>
      <Link className={styles.navBrand} to="/messages">UI SSO Message Board</Link>
      <nav className={styles.pillNav} aria-label="Primary navigation">
        <NavLink to="/messages" className={({ isActive }) => `${styles.pillItem} ${isActive ? styles.pillItemActive : ''}`}>
          Messages
        </NavLink>
        <NavLink to="/users" className={({ isActive }) => `${styles.pillItem} ${isActive ? styles.pillItemActive : ''}`}>
          Users
        </NavLink>
      </nav>
      <AccountActions />
    </header>
  );
}

function UsersPage() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);

  const load = (value = '') => fetch(`/api/users?q=${encodeURIComponent(value)}`)
    .then((response) => response.json())
    .then((data) => setUsers(data.users));

  useEffect(() => { void load(); }, []);

  return (
    <main className={styles.container}>
      <h1>Users</h1>
      <p className={styles.description}>Public profiles created by SSO UI-authenticated users.</p>

      <form className={styles.searchBar} onSubmit={(event) => { event.preventDefault(); void load(query); }}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, username, or interest…" />
        <button className={`${styles.btn} ${styles.btnPrimary}`}>Search</button>
      </form>

      {users.length ? users.map((user) => (
        <article className={`${styles.card} ${styles.profileCard}`} key={user.username}>
          <h2><Link to={`/profile/${encodeURIComponent(user.username)}`}>{user.fullname}</Link></h2>
          <p>@{user.username}</p>
          {user.interests && <p><strong>Interests:</strong> {user.interests}</p>}
        </article>
      )) : <p>No users found.</p>}
    </main>
  );
}

function MessagesPage() {
  const { user, login } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => fetch('/api/messages')
    .then((response) => response.json())
    .then((data) => setMessages(data.messages));

  useEffect(() => { void load(); }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content.trim() }),
    });

    if (response.ok) {
      setContent('');
      await load();
    }
    setSubmitting(false);
  };

  return (
    <main className={styles.container}>
      <h1 className={styles.boardTitle}>Messages</h1>

      {user ? (
        <form className={styles.postInputCard} onSubmit={submit}>
          <textarea
            className={styles.postTextarea}
            rows={3}
            maxLength={1000}
            placeholder="Share something with the campus…"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            disabled={submitting}
          />
          <div className={styles.alignRight}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={submitting || !content.trim()}>
              {submitting ? 'Posting…' : 'Post message'}
            </button>
          </div>
        </form>
      ) : (
        <div className={`${styles.postInputCard} ${styles.centered}`}>
          <p className={styles.bottomGap}>Log in with your SSO UI account to post a message.</p>
          <button className={`${styles.btn} ${styles.btnWarn}`} onClick={login}>Login via SSO UI</button>
        </div>
      )}

      {messages.length ? messages.map((message) => (
        <article className={styles.postCard} key={message.id}>
          <div className={styles.postHeader}>
            <Link className={styles.postAuthor} to={`/profile/${encodeURIComponent(message.authorUsername)}`}>
              {message.authorFullname}
            </Link>
            <time dateTime={`${message.createdAt.replace(' ', 'T')}Z`}>{formatLocalTime(message.createdAt)}</time>
          </div>
          <div className={styles.postContent}>{message.content}</div>
        </article>
      )) : <p>No messages yet. Be the first to post.</p>}
    </main>
  );
}

function ProfilePage() {
  const { username = '' } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${encodeURIComponent(username)}`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setProfile(data.user))
      .catch(() => setMissing(true));
  }, [username]);

  if (missing) return <main className={styles.container}><p>User not found.</p></main>;
  if (!profile) return <main className={styles.container}>Loading…</main>;

  const social = (label: string, handle?: string | null, base?: string) => handle ? (
    <p><strong>{label}:</strong> {base ? <a target="_blank" rel="noreferrer" href={`${base}${handle.replace('@', '')}`}>{handle}</a> : handle}</p>
  ) : null;

  return (
    <main className={styles.container}>
      <p className={styles.backLink}><Link to="/users">← Back to users</Link></p>
      <article className={styles.card}>
        <h1>{profile.fullname}</h1>
        <p className={styles.muted}>@{profile.username}</p>
        <div className={styles.formGroup}><strong className={styles.infoLabel}>Interests</strong><div>{profile.interests || <em>Not specified</em>}</div></div>
        <div className={styles.formGroup}><strong className={styles.infoLabel}>Likes</strong><div>{profile.likes || <em>Not specified</em>}</div></div>
        <div className={styles.formGroup}><strong className={styles.infoLabel}>Dislikes</strong><div>{profile.dislikes || <em>Not specified</em>}</div></div>
        <h3 className={styles.socialTitle}>Social media</h3>
        {social('Instagram', profile.instagram, 'https://instagram.com/')}
        {social('Twitter/X', profile.twitter, 'https://twitter.com/')}
        {social('YouTube', profile.youtube)}
        {!profile.instagram && !profile.twitter && !profile.youtube && <p><em>No social media linked.</em></p>}
      </article>
    </main>
  );
}

function MePage() {
  const { user, login, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) fetch(`/api/users/${encodeURIComponent(user.username)}`).then((response) => response.json()).then((data) => setProfile(data.user));
  }, [user]);

  if (loading) return <main className={styles.container}>Loading…</main>;
  if (!user) return (
    <main className={`${styles.container} ${styles.centerMessage}`}>
      <h1>Sign in required</h1>
      <p className={styles.bottomGap}>Use your SSO UI account to edit your profile.</p>
      <button className={`${styles.btn} ${styles.btnWarn}`} onClick={login}>Login via SSO UI</button>
    </main>
  );
  if (!profile) return <main className={styles.container}>Loading…</main>;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    fetch('/api/users/me', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) })
      .then((response) => response.json())
      .then((data) => {
        setProfile(data.user);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      });
  };

  const field = (name: keyof Profile, label: string, multiline = false) => (
    <div className={styles.formGroup}>
      <label>{label}</label>
      {multiline ? <textarea name={name} defaultValue={profile[name] || ''} rows={3} /> : <input name={name} defaultValue={profile[name] || ''} />}
    </div>
  );

  return (
    <main className={styles.container}>
      <h1>My profile</h1>
      {saved && <p className={styles.saved}>✓ Profile saved.</p>}
      <form onSubmit={submit} className={styles.card}>
        {field('fullname', 'Full name')}
        {field('interests', 'Interests')}
        {field('likes', 'Likes', true)}
        {field('dislikes', 'Dislikes', true)}
        <h3 className={styles.sectionTitle}>Social media</h3>
        {field('instagram', 'Instagram username')}
        {field('twitter', 'Twitter/X username')}
        {field('youtube', 'YouTube handle')}
        <div className={styles.saveButton}><button className={`${styles.btn} ${styles.btnPrimary}`}>Save profile</button></div>
      </form>
    </main>
  );
}

function AppLayout() {
  return (
    <div className={styles.appShell}>
      <Header />
      <div className={styles.mainContent}>
        <Routes>
          <Route path="/" element={<Navigate to="/messages" replace />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/me" element={<MePage />} />
          <Route path="*" element={<Navigate to="/messages" replace />} />
        </Routes>
      </div>
      <footer className={styles.footer}>
        <span>Taruna Prasetya</span>
        <span aria-hidden="true"> · </span>
        <a href="https://github.com/outrowed/ui-sso-message-board/blob/main/LICENSE" target="_blank" rel="noreferrer">MIT</a>
        <span aria-hidden="true"> · </span>
        <a href="https://github.com/outrowed/ui-sso-message-board" target="_blank" rel="noreferrer">View source on GitHub</a>
      </footer>
    </div>
  );
}

export default function App() {
  return <BrowserRouter><AuthProvider><AppLayout /></AuthProvider></BrowserRouter>;
}
