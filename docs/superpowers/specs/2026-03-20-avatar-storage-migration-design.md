# Avatar Storage Migration Design

**Date:** 2026-03-20
**Status:** Approved

## Problem

Avatars are currently stored as base64 strings in `localStorage` and in the `profiles.avatar_url` Supabase column. This risks localStorage quota errors for large images and bloats the database with binary data.

## Goals

- Store avatar files in Supabase Storage for authenticated users
- Keep the existing base64/localStorage flow unchanged for unauthenticated (demo) users
- Compress images client-side before upload to keep storage costs low and uploads fast
- Clean up any legacy base64 values already stored in the database

## Non-Goals

- Migration of existing base64 avatars (silently dropped — users re-upload)
- Auth-gating the upload button for unauthenticated users
- Solving the localStorage quota risk for unauthenticated/demo users (out of scope; base64 path is unchanged)

---

## Design

### Supabase Storage Setup (manual, pre-deploy)

1. Create bucket `avatars` with **public** read access — public read is granted at bucket level, not via object-level RLS
2. Add RLS policy on `storage.objects` for write access:
   - Authenticated users can INSERT/UPDATE where `(storage.foldername(name))[1] = auth.uid()::text`

### File Naming

Always `{userId}/avatar.jpg` — each upload overwrites the previous, no orphaned files. The `x-upsert: true` header must be sent on upload so re-uploads succeed without a 400 error.

### Data Flow — Authenticated Users

1. User selects a file via the avatar input
2. Validate: reject if `file.type` does not start with `image/`, or if `file.size > 10MB` (show error toast, abort before loading into memory)
3. Load image into `new Image()` — wrap in a Promise; resolve on `onload`, **reject on `onerror`** (error toast, abort)
4. Draw to canvas using **fit-within** scaling (max 800×800px, no cropping, canvas dimensions set to scaled size), export as JPEG blob at 80% quality — wrap `canvas.toBlob()` in a Promise; if blob is `null`, throw (compression failure → error toast, abort)
5. Upload blob via `uploadAvatar(userId, blob)` in `supabase.js` — returns clean public URL (no cache-buster). `SUPABASE_URL` has no trailing slash; URL is constructed as `SUPABASE_URL + '/storage/v1/object/public/avatars/' + path`
6. On success (ordered to keep local and remote in sync):
   - Set `profil.avatar = url` (clean URL)
   - Call `saveProfileToSupabase(profil)` first — if this fails, throw (error toast, local unchanged)
   - Call `saveProfile_local(profil)` to update in-memory cache and localStorage
   - Call `showAvatarImage(url + '?t=' + Date.now())` to display with cache-buster for immediate refresh
7. On any failure: error toast, abort — local cache and Supabase remain unchanged

**Known limitation:** on subsequent renders (tab switch, page reload), `showAvatarImage` is called with the clean URL (no cache-buster), so a re-uploaded avatar may briefly show the cached old version. This is acceptable for now.

**URL path note:** The upload endpoint is `/storage/v1/object/{bucket}/{path}` (no `public`); the public read URL is `/storage/v1/object/public/{bucket}/{path}`. This asymmetry is correct Supabase Storage behavior.

### Data Flow — Unauthenticated Users

No change. Base64 read via `FileReader`, stored in `profil.avatar` in localStorage only.

### Legacy Cleanup

In `fetchProfileFromSupabase()`: only runs when `isAuthenticated()` is true. If `row.avatar_url` starts with `data:`:
1. Set `p.avatar = ''` on the local profile object
2. Call `saveProfile_local(p)` immediately (updates in-memory cache even if network call fails)
3. Fire-and-forget `upsertProfil({ id: getUserId(), avatar_url: '' })` — this is a **raw DB payload** (column name `avatar_url`, not the JS field name `avatar`); swallow errors. Local cache is already clean so this is idempotent.

---

## Code Changes

### `supabase.js`

Add one new exported function:

```js
export async function uploadAvatar(userId, blob) {
  var path = userId + '/avatar.jpg';
  var res = await fetch(SUPABASE_URL + '/storage/v1/object/avatars/' + path, {
    method: 'PUT',
    headers: headers({ 'Content-Type': 'image/jpeg', 'x-upsert': 'true' }),
    body: blob
  });
  if (!res.ok) throw new Error('uploadAvatar failed: ' + res.status);
  return SUPABASE_URL + '/storage/v1/object/public/avatars/' + path;
}
```

### `profile.js`

1. Import `uploadAvatar` from `supabase.js`
2. `uploadImage(input)` — add authenticated branch (entire branch wrapped in try/catch):
   - Check `file.type.startsWith('image/')` and `file.size <= 10 * 1024 * 1024`; show error toast and abort if invalid
   - Wrap `new Image()` load in a Promise — resolve on `onload`, reject on `onerror`
   - Draw to canvas using **fit-within** scaling (max 800×800, no cropping, preserve aspect ratio — set canvas dimensions to the scaled size, not always 800×800)
   - Wrap `canvas.toBlob(..., 'image/jpeg', 0.8)` in a Promise; if blob is `null`, throw
   - Call `uploadAvatar(getUserId(), blob)` → clean URL
   - Set `profil.avatar = url` (clean URL, mutate before any save calls)
   - Call `saveProfileToSupabase(profil)` first; on failure, throw
   - Call `saveProfile_local(profil)`, then `showAvatarImage(url + '?t=' + Date.now())`
   - Catch: show error toast, abort without touching stored profile
   - Unauthenticated path unchanged
3. `fetchProfileFromSupabase()` — after mapping row to JS object, if `isAuthenticated()` and `p.avatar` starts with `data:`:
   - Set `p.avatar = ''`
   - Call `saveProfile_local(p)` immediately
   - Fire-and-forget `upsertProfil({ id: getUserId(), avatar_url: '' })` (raw DB payload), swallow errors

### `app.html`

No changes required.

---

## Error Handling

| Scenario | Behavior |
|---|---|
| File is not an image type | Error toast, abort before loading into memory |
| File exceeds 10MB | Error toast, abort before loading into memory |
| Image fails to load (`onerror`) | Error toast, abort |
| `canvas.toBlob()` returns null | Error toast, abort |
| Supabase profile save fails after Storage upload | Error toast, local cache unchanged |
| Upload fails (network/Storage error) | Error toast, existing avatar unchanged |
| Legacy base64 detected on fetch | Local cache cleared immediately; Supabase write attempted (failure swallowed) |
| User not authenticated | Existing base64 flow, no Storage call |

---

## Testing Checklist

- [ ] Authenticated user uploads an image — avatar appears, clean public URL stored in `profiles.avatar_url`
- [ ] Re-upload overwrites previous avatar (no 400 error, no duplicate files in Storage)
- [ ] Large image (> 2MB) is compressed before upload; result is well under original size
- [ ] Upload failure shows error toast, existing avatar unchanged
- [ ] Unauthenticated user uploads an image — base64 stored locally, no Storage call
- [ ] User with legacy base64 `avatar_url` — cleared on next login/fetch; clean URL written to Supabase
- [ ] Avatar persists across sessions (loaded from Supabase URL on login)
- [ ] Non-image file upload shows error toast, no upload attempted
- [ ] File > 10MB shows error toast, no upload attempted
- [ ] Avatar displayed immediately after upload (cache-buster prevents stale image)
