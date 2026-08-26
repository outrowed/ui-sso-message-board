import { mkdir, rename, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const avatarDirectory = resolve(import.meta.dirname, "../../db/avatars");
const avatarFile = (username: string) => resolve(avatarDirectory, `${encodeURIComponent(username)}.webp`);

export function avatarUrl(username: string): string | null {
  return existsSync(avatarFile(username)) ? `/api/avatars/${encodeURIComponent(username)}` : null;
}

export async function saveAvatar(username: string, image: Buffer): Promise<void> {
  await mkdir(avatarDirectory, { recursive: true });
  const destination = avatarFile(username);
  const temporary = `${destination}.tmp`;

  try {
    const metadata = await sharp(image, { animated: true }).metadata();
    const processor = sharp(image, { animated: true })
      .rotate()
      .resize(512, 512, { fit: "cover" });

    await (metadata.pages && metadata.pages > 1
      ? processor.webp({ quality: 85, loop: metadata.loop ?? 0 })
      : processor.webp({ quality: 85 }))
      .toFile(temporary);
    await rename(temporary, destination);
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
}

export function avatarPath(username: string): string {
  return avatarFile(username);
}
