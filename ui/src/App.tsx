import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';

type Profile = { username: string; fullname: string; interests?: string | null; likes?: string | null; dislikes?: string | null; instagram?: string | null; twitter?: string | null; youtube?: string | null };

function Nav({ go }: { go: (path: string) => void }) {
  const { user, login, logout } = useAuth();
  return <nav className="nav"><a className="nav-brand" href="/" onClick={(e) => { e.preventDefault(); go('/'); }}>UI Profile Directory</a><span>{user ? <><a href="/me" onClick={(e) => { e.preventDefault(); go('/me'); }}>{user.fullname}</a>{' · '}<button className="btn btn-secondary" onClick={logout}>Logout</button></> : <button className="btn btn-warn" onClick={login}>Login via SSO UI</button>}</span></nav>;
}

function Directory({ go }: { go: (path: string) => void }) {
  const [q, setQ] = useState(''); const [profiles, setProfiles] = useState<Profile[]>([]);
  const load = (query = '') => fetch(`/api/profiles/directory?q=${encodeURIComponent(query)}`).then(r => r.json()).then(d => setProfiles(d.profiles));
  useEffect(() => { load(); }, []);
  return <main className="container"><h1>Student Directory</h1><p style={{marginBottom: 18}}>Public profiles created by SSO UI-authenticated users.</p><form className="search-bar" onSubmit={(e) => { e.preventDefault(); load(q); }}><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, NPM, or interest..."/><button className="btn btn-primary">Search</button></form>{profiles.length ? profiles.map(p => <article className="card profile-card" key={p.username}><h2><a href={`/profile/${encodeURIComponent(p.username)}`} onClick={e => {e.preventDefault(); go(`/profile/${p.username}`)}}>{p.fullname}</a></h2><p>@{p.username}</p>{p.interests && <p><strong>Interests:</strong> {p.interests}</p>}</article>) : <p>No profiles found.</p>}</main>;
}

function PublicProfile({ username, go }: { username: string; go: (path: string) => void }) {
  const [p, setP] = useState<Profile | null>(null); const [missing, setMissing] = useState(false);
  useEffect(() => { fetch(`/api/profiles/${encodeURIComponent(username)}`).then(r => r.ok ? r.json() : Promise.reject()).then(d => setP(d.profile)).catch(() => setMissing(true)); }, [username]);
  if (missing) return <main className="container"><p>Profile not found.</p></main>; if (!p) return <main className="container">Loading…</main>;
  const social = (label: string, handle?: string | null, base?: string) => handle ? <p><strong>{label}:</strong> {base ? <a target="_blank" href={`${base}${handle.replace('@','')}`}>{handle}</a> : handle}</p> : null;
  return <main className="container"><p><a href="/" onClick={e => {e.preventDefault(); go('/')}}>← Directory</a></p><article className="card"><h1>{p.fullname}</h1><p>@{p.username}</p><br/>{p.interests && <p><strong>Interests:</strong> {p.interests}</p>}{p.likes && <p><strong>Likes:</strong> {p.likes}</p>}{p.dislikes && <p><strong>Dislikes:</strong> {p.dislikes}</p>}<h3 style={{marginTop: 18}}>Social Media</h3>{social('Instagram',p.instagram,'https://instagram.com/')}{social('Twitter/X',p.twitter,'https://twitter.com/')}{social('YouTube',p.youtube)}</article></main>;
}

function MyProfile() {
 const { user, login, loading } = useAuth(); const [p, setP] = useState<Profile | null>(null); const [saved,setSaved]=useState(false);
 useEffect(() => { if(user) fetch(`/api/profiles/${encodeURIComponent(user.username)}`).then(r=>r.json()).then(d=>setP(d.profile)); },[user]);
 if(loading) return <main className="container">Loading…</main>; if(!user) return <main className="container center-message"><h1>Sign in required</h1><p>Use your SSO UI account to create or edit your profile.</p><br/><button className="btn btn-warn" onClick={login}>Login via SSO UI</button></main>; if(!p) return <main className="container">Loading…</main>;
 const submit=(e: React.FormEvent<HTMLFormElement>)=>{e.preventDefault(); const fields=Object.fromEntries(new FormData(e.currentTarget)); fetch('/api/profiles/me',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(fields)}).then(r=>r.json()).then(d=>{setP(d.profile);setSaved(true);});};
 const field=(name:keyof Profile,label:string,area=false)=><div className="form-group"><label>{label}</label>{area?<textarea name={name} defaultValue={p[name] || ''}/>:<input name={name} defaultValue={p[name] || ''}/>}</div>;
 return <main className="container"><h1>My Profile</h1>{saved&&<p style={{color:'green'}}>Saved.</p>}<form onSubmit={submit} className="card">{field('fullname','Full name')}{field('interests','Interests')}{field('likes','Likes',true)}{field('dislikes','Dislikes',true)}{field('instagram','Instagram username')}{field('twitter','Twitter/X username')}{field('youtube','YouTube handle')}<button className="btn btn-primary">Save profile</button></form></main>;
}

function Shell(){ const [path,setPath]=useState(location.pathname); const go=(next:string)=>{history.pushState({},'',next);setPath(next)}; useEffect(()=>{const h=()=>setPath(location.pathname);addEventListener('popstate',h);return()=>removeEventListener('popstate',h)},[]); const view=path==='/me'?<MyProfile/>:path.startsWith('/profile/')?<PublicProfile username={decodeURIComponent(path.slice(9))} go={go}/>:<Directory go={go}/>; return <><Nav go={go}/>{view}</>; }
export default function App(){ return <AuthProvider><Shell/></AuthProvider>; }
