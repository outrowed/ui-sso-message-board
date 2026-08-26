import { avatarUrl } from "./avatars.js";
import { config } from "./config.js";
import type { User } from "./domain/user.js";

export type ProfileSource = "local" | "pmb.cs.ui.ac.id";

const PMB_MAJOR_NAMES: Record<string, string> = {
  ik: "Ilmu Komputer",
  si: "Sistem Informasi",
  ka: "Kecerdasan Buatan",
};

export function pmbMajorName(code?: string | null): string | null {
  if (!code) return null;
  return PMB_MAJOR_NAMES[code.toLowerCase()] || code;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function pmbGroupName(groupId?: string | null): string | null {
  if (!groupId) return null;
  const [house, ...groupParts] = groupId.split("-").filter(Boolean);
  if (!house || groupParts.length === 0) return groupId;
  return `House of ${titleCase(house)} / Group ${titleCase(groupParts.join("-"))}`;
}

interface PmbInterest {
  interest?: { nama_interest?: string; is_it?: boolean };
}

interface PmbProfileResponse {
  username: string;
  nama_lengkap: string;
  nama_panggilan?: string | null;
  tempat_lahir?: string | null;
  tanggal_lahir?: string | null;
  jenis_kelamin?: string | null;
  jurusan?: string | null;
  angkatan?: string | null;
  asal_sekolah?: string | null;
  id_line?: string | null;
  instagram?: string | null;
  bio?: string | null;
  foto_profil?: string | null;
  domicile?: string | null;
  kelompok_id?: string | null;
  role?: string | null;
  User_Interest?: PmbInterest[];
}

export interface PublicProfile extends User {
  avatarUrl: string | null;
  profileSource: ProfileSource;
  profileReadOnly: boolean;
  nickname?: string | null;
  birthplace?: string | null;
  birthdate?: string | null;
  gender?: string | null;
  major?: string | null;
  cohort?: string | null;
  school?: string | null;
  line?: string | null;
  bio?: string | null;
  domicile?: string | null;
  groupId?: string | null;
  role?: string | null;
  pmbInterests?: Array<{ name: string; isIt: boolean | null }>;
}

export async function publicProfile(user: User): Promise<PublicProfile> {
  if (!config.pmbProfilesEnabled) {
    return { ...user, avatarUrl: avatarUrl(user.username), profileSource: "local", profileReadOnly: false };
  }

  const response = await fetch(`${config.pmbApiBaseUrl}/api/profile/${encodeURIComponent(user.username)}`, {
    headers: { Authorization: `JWT ${config.pmbApiToken}` },
  });
  if (!response.ok) throw new Error(`PMB profile request failed with status ${response.status}`);
  const pmb = await response.json() as PmbProfileResponse;

  return {
    ...user,
    fullname: pmb.nama_lengkap || user.fullname,
    interests: pmb.User_Interest?.map((entry) => entry.interest?.nama_interest).filter(Boolean).join(", ") || null,
    likes: null,
    dislikes: null,
    instagram: pmb.instagram || null,
    twitter: null,
    youtube: null,
    avatarUrl: pmb.foto_profil || null,
    profileSource: "pmb.cs.ui.ac.id",
    profileReadOnly: true,
    nickname: pmb.nama_panggilan,
    birthplace: pmb.tempat_lahir,
    birthdate: null,
    gender: pmb.jenis_kelamin,
    major: pmbMajorName(pmb.jurusan),
    cohort: pmb.angkatan,
    school: pmb.asal_sekolah,
    line: pmb.id_line,
    bio: pmb.bio,
    domicile: pmb.domicile,
    groupId: pmbGroupName(pmb.kelompok_id),
    role: pmb.role,
    pmbInterests: pmb.User_Interest?.flatMap((entry) => entry.interest?.nama_interest ? [{ name: entry.interest.nama_interest, isIt: entry.interest.is_it ?? null }] : []) || [],
  };
}
