import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import styles from './App.module.css';

type Profile = { username: string; fullname: string; interests?: string | null; likes?: string | null; dislikes?: string | null; instagram?: string | null; twitter?: string | null; youtube?: string | null };
type Post = { id: number; content: string; createdAt: string; authorUsername: string; authorFullname: string };

function Nav({ go }: { go: (path: string) => void }) {
  const { user, login, logout } = useAuth();
  return (
    <nav className={styles.nav}>
      <a className={styles.navBrand} href="/" onClick={(e) => { e.preventDefault(); go('/'); }}>
        UI Message Board & Directory
      </a>
      <span>
        {user ? (
          <>
            <a href="/me" onClick={(e) => { e.preventDefault(); go('/me'); }}>{user.fullname}</a>{' · '}
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={logout}>Logout</button>
          </>
        ) : (
          <button className={`${styles.btn} ${styles.btnWarn}`} onClick={login}>Login via SSO UI</button>
        )}
      </span>
    </nav>
  );
}

function Directory({ go }: { go: (path: string) => void }) {
  const [q, setQ] = useState(''); 
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const load = (query = '') => fetch(`/api/profiles/directory?q=${encodeURIComponent(query)}`).then(r => r.json()).then(d => setProfiles(d.profiles));
  useEffect(() => { load(); }, []);

  return (
    <div className={styles.container}>
      <h1>Student Directory</h1>
      <p className={styles.description}>Public profiles created by SSO UI-authenticated users.</p>
      
      <form className={styles.searchBar} onSubmit={(e) => { e.preventDefault(); load(q); }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, NPM, or interest..."/>
        <button className={`${styles.btn} ${styles.btnPrimary}`}>Search</button>
      </form>

      {profiles.length ? profiles.map(p => (
        <article className={`${styles.card} ${styles.profileCard}`} key={p.username}>
          <h2>
            <a href={`/profile/${encodeURIComponent(p.username)}`} onClick={e => {e.preventDefault(); go(`/profile/${p.username}`)}}>
              {p.fullname}
            </a>
          </h2>
          <p>@{p.username}</p>
          {p.interests && <p><strong>Interests:</strong> {p.interests}</p>}
        </article>
      )) : <p>No profiles found.</p>}
    </div>
  );
}

function MessageBoard({ go }: { go: (path: string) => void }) {
  const { user, login } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => fetch('/api/posts').then(r => r.json()).then(d => setPosts(d.posts));
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content.trim() })
    });
    setContent('');
    setLoading(false);
    load();
  };

  return (
    <div className={styles.container}>
      <div className={styles.directoryLink}>
        <a href="/directory" onClick={(e) => { e.preventDefault(); go('/directory'); }}>
          🔍 Browse Student Directory
        </a>
      </div>

      <h2 className={styles.boardTitle}>Public Message Board</h2>

      {user ? (
        <form className={styles.postInputCard} onSubmit={submit}>
          <textarea 
            className={styles.postTextarea} 
            rows={3} 
            placeholder="Share something with the campus..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
          />
          <div className={styles.alignRight}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={loading || !content.trim()}>
              {loading ? 'Posting...' : 'Post Message'}
            </button>
          </div>
        </form>
      ) : (
        <div className={`${styles.postInputCard} ${styles.centered}`}>
          <p className={styles.bottomGap}>Log in with your SSO UI account to post a message.</p>
          <button className={`${styles.btn} ${styles.btnWarn}`} onClick={login}>Login via SSO UI</button>
        </div>
      )}

      <div>
        {posts.length ? posts.map(post => (
          <article className={styles.postCard} key={post.id}>
            <div className={styles.postHeader}>
              <span className={styles.postAuthor}>
                <a href={`/profile/${encodeURIComponent(post.authorUsername)}`} onClick={(e) => { e.preventDefault(); go(`/profile/${post.authorUsername}`); }}>
                  {post.authorFullname}
                </a>
              </span>
              <span>{new Date(post.createdAt).toLocaleString('en-GB')}</span>
            </div>
            <div className={styles.postContent}>{post.content}</div>
          </article>
        )) : <p>No messages yet. Be the first to post!</p>}
      </div>
    </div>
  );
}

function PublicProfile({ username, go }: { username: string; go: (path: string) => void }) {
  const [p, setP] = useState<Profile | null>(null); 
  const [missing, setMissing] = useState(false);
  
  useEffect(() => { 
    fetch(`/api/profiles/${encodeURIComponent(username)}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setP(d.profile))
      .catch(() => setMissing(true)); 
  }, [username]);

  if (missing) return <div className={styles.container}><p>Profile not found.</p></div>; 
  if (!p) return <div className={styles.container}>Loading…</div>;
  
  const social = (label: string, handle?: string | null, base?: string) => handle ? <p><strong>{label}:</strong> {base ? <a target="_blank" href={`${base}${handle.replace('@','')}`}>{handle}</a> : handle}</p> : null;
  
  return (
    <div className={styles.container}>
      <p className={styles.backLink}>
        <a href="/" onClick={e => {e.preventDefault(); go('/')}}>← Back to Message Board</a>
      </p>
      <article className={styles.card}>
        <h1 style={{marginTop: 0, marginBottom: 5}}>{p.fullname}</h1>
        <p className={styles.muted}>@{p.username}</p>
        
        <div className={styles.formGroup}>
          <strong className={styles.infoLabel}>Interests</strong>
          <div>{p.interests || <em>Not specified</em>}</div>
        </div>
        
        <div className={styles.formGroup}>
          <strong className={styles.infoLabel}>Likes</strong>
          <div>{p.likes || <em>Not specified</em>}</div>
        </div>
        
        <div className={styles.formGroup}>
          <strong className={styles.infoLabel}>Dislikes</strong>
          <div>{p.dislikes || <em>Not specified</em>}</div>
        </div>
        
        <h3 className={styles.socialTitle}>Social Media</h3>
        {social('Instagram', p.instagram, 'https://instagram.com/')}
        {social('Twitter/X', p.twitter, 'https://twitter.com/')}
        {social('YouTube', p.youtube)}
        {!p.instagram && !p.twitter && !p.youtube && <p><em>No social media linked.</em></p>}
      </article>
    </div>
  );
}

function MyProfile() {
  const { user, login, loading } = useAuth(); 
  const [p, setP] = useState<Profile | null>(null); 
  const [saved, setSaved] = useState(false);
 
  useEffect(() => { 
    if(user) fetch(`/api/profiles/${encodeURIComponent(user.username)}`).then(r=>r.json()).then(d=>setP(d.profile)); 
  }, [user]);

  if(loading) return <div className={styles.container}>Loading…</div>; 
  if(!user) return (
    <div className={`${styles.container} ${styles.centerMessage}`}>
      <h1>Sign in required</h1>
      <p className={styles.bottomGap}>Use your SSO UI account to create or edit your profile.</p>
      <button className={`${styles.btn} ${styles.btnWarn}`} onClick={login}>Login via SSO UI</button>
    </div>
  ); 
  if(!p) return <div className={styles.container}>Loading…</div>;
 
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 
    const fields = Object.fromEntries(new FormData(e.currentTarget)); 
    fetch('/api/profiles/me',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(fields)})
      .then(r=>r.json()).then(d=>{setP(d.profile); setSaved(true); setTimeout(() => setSaved(false), 3000); });
  };
 
  const field = (name: keyof Profile, label: string, area = false) => (
    <div className={styles.formGroup}>
      <label>{label}</label>
      {area ? <textarea name={name} defaultValue={p[name] || ''} rows={3}/> : <input type="text" name={name} defaultValue={p[name] || ''}/>}
    </div>
  );

  return (
    <div className={styles.container}>
      <h1>My Profile</h1>
      {saved && <p className={styles.saved}>✓ Profile saved successfully.</p>}
      <form onSubmit={submit} className={styles.card}>
        {field('fullname', 'Full Name')}
        {field('interests', 'Interests (comma separated)')}
        {field('likes', 'Likes', true)}
        {field('dislikes', 'Dislikes', true)}
        <h3 className={styles.sectionTitle}>Social Media</h3>
        {field('instagram', 'Instagram Username')}
        {field('twitter', 'Twitter/X Username')}
        {field('youtube', 'YouTube Channel Handle')}
        <div className={styles.saveButton}>
          <button className={`${styles.btn} ${styles.btnPrimary}`}>Save Profile</button>
        </div>
      </form>
    </div>
  );
}

function Shell() { 
  const [path, setPath] = useState(location.pathname); 
  const go = (next: string) => { history.pushState({}, '', next); setPath(next); }; 
  
  useEffect(() => {
    const h = () => setPath(location.pathname);
    addEventListener('popstate', h);
    return () => removeEventListener('popstate', h);
  }, []); 

  const view = 
    path === '/me' ? <MyProfile /> : 
    path === '/directory' ? <Directory go={go} /> : 
    path.startsWith('/profile/') ? <PublicProfile username={decodeURIComponent(path.slice(9))} go={go}/> : 
    <MessageBoard go={go} />; 

  return (
    <>
      <Nav go={go}/>
      {view}
    </>
  ); 
}

export default function App() { 
  return <AuthProvider><Shell/></AuthProvider>; 
}
