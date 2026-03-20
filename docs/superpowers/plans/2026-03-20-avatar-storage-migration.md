# Avatar Storage Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move authenticated-user avatar uploads from base64-in-localStorage to Supabase Storage, storing only a public URL in the profile.

**Architecture:** `uploadAvatar()` is added to `supabase.js` (raw fetch to Storage REST API). `uploadImage()` in `profile.js` gains an authenticated branch that validates, compresses via canvas, uploads, then saves the URL. Unauthenticated users keep the existing base64 flow unchanged.

**Tech Stack:** Vanilla JS ES modules, Supabase Storage REST API, HTMLCanvasElement

---

## File Map

| File | Change |
|------|--------|
| `js/supabase.js` | Add `uploadAvatar(userId, blob)` |
| `js/profile.js` | Update `uploadImage()` and `fetchProfileFromSupabase()` |
| `CLAUDE.md` | Mark avatar storage debt as ✅ resolved |

---

## Task 1: Supabase Storage bucket + RLS (manual setup)

**Files:** None — done in Supabase dashboard

- [ ] **Step 1: Create the avatars bucket**

  In Supabase dashboard → Storage → New bucket:
  - Name: `avatars`
  - Public bucket: ✅ enabled (grants public read at bucket level — no SELECT RLS needed)

- [ ] **Step 2: Add write RLS policy**

  In Storage → Policies → `storage.objects` → New policy → For full customization:

  - Policy name: `Authenticated users can upload own avatar`
  - Allowed operations: `INSERT`, `UPDATE`
  - Target roles: `authenticated`
  - USING expression (leave blank)
  - WITH CHECK expression:
    ```sql
    (storage.foldername(name))[1] = auth.uid()::text
    ```

  This ensures a user with ID `abc-123` can only upload to `abc-123/avatar.jpg`.

- [ ] **Step 3: Verify bucket exists and is public**

  In Storage → `avatars` bucket — confirm the lock icon shows "Public". Upload a test file manually and confirm the public URL resolves in the browser.

---

## Task 2: Add `uploadAvatar()` to supabase.js

**Files:**
- Modify: `js/supabase.js`

- [ ] **Step 1: Add the function at the end of the Profile section**

  Open `js/supabase.js`. After `upsertProfil`, add:

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

  Note the URL asymmetry: upload path omits `/public/`, returned public URL includes it. Both are correct Supabase Storage behavior.

- [ ] **Step 2: Verify in browser console (manual smoke test)**

  Open the app while logged in. In the browser console:

  ```js
  import('/js/supabase.js').then(m => console.log(typeof m.uploadAvatar));
  ```

  Expected output: `"function"`

- [ ] **Step 3: Commit**

  ```bash
  git add js/supabase.js
  git commit -m "feat: add uploadAvatar() to supabase.js for Storage upload"
  ```

---

## Task 3: Update `uploadImage()` in profile.js

**Files:**
- Modify: `js/profile.js`

This is the main change. The existing unauthenticated (base64) path stays at the bottom of the function, untouched. A new authenticated branch runs first and returns early.

- [ ] **Step 1: Add `uploadAvatar` import**

  In `js/profile.js`, update the import from `supabase.js`:

  ```js
  import { fetchProfil, upsertProfil, uploadAvatar } from './supabase.js';
  ```

- [ ] **Step 2: Replace `uploadImage()` with the new implementation**

  The current `uploadImage()` function is at line ~149 in `profile.js`. Replace the entire function:

  ```js
  export async function uploadImage(input) {
    if (!input.files || !input.files[0]) return;
    var file = input.files[0];

    // Authenticated path: compress + upload to Supabase Storage
    if (isAuthenticated()) {
      if (!file.type.startsWith('image/')) {
        showToast(t('toast_avatar_invalid_type'), 'error');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast(t('toast_avatar_too_large'), 'error');
        return;
      }
      try {
        // Load image (async)
        var img = await new Promise(function(resolve, reject) {
          var image = new Image();
          var url = URL.createObjectURL(file);
          image.onload = function() { URL.revokeObjectURL(url); resolve(image); };
          image.onerror = function() { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
          image.src = url;
        });

        // Compress via canvas (fit-within 800x800, no cropping)
        var MAX = 800;
        var scale = Math.min(1, MAX / img.width, MAX / img.height);
        var canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

        // Export as JPEG blob (async)
        var blob = await new Promise(function(resolve) {
          canvas.toBlob(resolve, 'image/jpeg', 0.8);
        });
        if (!blob) throw new Error('Canvas toBlob returned null');

        // Upload to Storage
        var url = await uploadAvatar(getUserId(), blob);

        // Persist: Supabase first, then local cache
        var profil = getProfile();
        profil.avatar = url;
        await saveProfileToSupabase(profil);
        saveProfile_local(profil);
        showAvatarImage(url + '?t=' + Date.now());
      } catch (err) {
        console.warn('Avatar upload failed:', err);
        showToast(t('toast_avatar_upload_failed'), 'error');
      }
      return;
    }

    // Unauthenticated path: base64 in localStorage (unchanged)
    var reader = new FileReader();
    reader.onload = function(e) {
      var base64 = e.target.result;
      var profil = getProfile();
      profil.avatar = base64;
      saveProfile_local(profil);
      showAvatarImage(base64);
    };
    reader.readAsDataURL(file);
  }
  ```

- [ ] **Step 3: Add the three new i18n keys to `js/i18n.js`**

  Open `js/i18n.js`. In the `TEKST` object, add to both `no` and `en` branches:

  ```js
  // in no:
  toast_avatar_invalid_type: 'Filen må være et bilde',
  toast_avatar_too_large:    'Bildet er for stort (maks 10 MB)',
  toast_avatar_upload_failed: 'Opplasting feilet – prøv igjen',

  // in en:
  toast_avatar_invalid_type: 'File must be an image',
  toast_avatar_too_large:    'Image is too large (max 10 MB)',
  toast_avatar_upload_failed: 'Upload failed – please try again',
  ```

- [ ] **Step 4: Manual test — authenticated upload**

  1. Log in to the app
  2. Go to Profile tab
  3. Tap the avatar area and select a photo
  4. Expected: avatar updates immediately, no error toast
  5. Open Supabase dashboard → Storage → `avatars` → verify `{userId}/avatar.jpg` exists
  6. Open Supabase → Table Editor → `profiles` → verify `avatar_url` is a public URL (not base64)

- [ ] **Step 5: Manual test — re-upload overwrites**

  1. Upload a second image
  2. Expected: avatar updates, no 400 error in console, only one file in Storage for this user

- [ ] **Step 6: Manual test — validation**

  1. Try uploading a non-image file (e.g., a `.txt` or `.pdf`)
  2. Expected: error toast "File must be an image", no upload
  3. Try a valid image but > 10MB (use browser devtools to fake file.size if needed)
  4. Expected: error toast "Image is too large"

- [ ] **Step 7: Manual test — avatar persists across sessions**

  1. Upload an avatar while logged in
  2. Log out, then log back in
  3. Expected: avatar is still shown (loaded from the Supabase Storage URL via `fetchProfileFromSupabase`)

- [ ] **Step 8: Manual test — unauthenticated user**

  1. Log out (or open in incognito)
  2. Tap avatar and select an image
  3. Expected: avatar shows, no Storage call (check Network tab — no request to `/storage/`)

- [ ] **Step 9: Commit**

  ```bash
  git add js/profile.js js/i18n.js
  git commit -m "feat: upload avatar to Supabase Storage for authenticated users"
  ```

---

## Task 4: Legacy base64 cleanup in `fetchProfileFromSupabase()`

**Files:**
- Modify: `js/profile.js`

- [ ] **Step 1: Add legacy cleanup after mapping the row**

  In `fetchProfileFromSupabase()`, after building the `p` object and before `saveProfile_local(p)`, add:

  ```js
  // Legacy cleanup: clear base64 avatars stored before Storage migration
  if (isAuthenticated() && p.avatar && p.avatar.startsWith('data:')) {
    p.avatar = '';
    saveProfile_local(p);
    upsertProfil({ id: getUserId(), avatar_url: '' }).catch(function() {});
  }
  ```

  The full updated function should look like:

  ```js
  export async function fetchProfileFromSupabase() {
    try {
      var row = await fetchProfil(getUserId());
      if (row) {
        var p = {
          name: row.name || '',
          club: row.club || '',
          position: row.position || '',
          teams: row.team || [],
          favoriteTeam: row.favorite_team || '',
          tournaments: row.tournaments || [],
          favoriteTournament: row.favorite_tournament || '',
          avatar: row.avatar_url || ''
        };
        // Legacy cleanup: clear base64 avatars stored before Storage migration.
        // saveProfile_local inside the if-block fires immediately (so cache is clean
        // even if the upsertProfil network call below fails). The saveProfile_local
        // outside the if-block is the normal-path save — both are intentional.
        if (isAuthenticated() && p.avatar && p.avatar.startsWith('data:')) {
          p.avatar = '';
          saveProfile_local(p);
          upsertProfil({ id: getUserId(), avatar_url: '' }).catch(function() {});
        }
        saveProfile_local(p);
        return p;
      }
    } catch(e) { console.warn('fetchProfileFromSupabase failed, using local cache:', e); }
    return getProfile();
  }
  ```

  Note: `upsertProfil` must be imported — it's already imported in `profile.js`, so no import change needed.

- [ ] **Step 2: Manual test — legacy cleanup**

  Simulate a legacy profile in the browser console:

  ```js
  // While logged in, manually set a base64 avatar_url in Supabase
  // (Use Supabase Table Editor: update profiles set avatar_url = 'data:image/jpeg;base64,/9j/...' where id = '<your-user-id>')
  // Then reload the app and check:
  // 1. No base64 is shown (avatar shows placeholder)
  // 2. profiles.avatar_url is now '' in Supabase
  ```

  If setting a real base64 in the DB is impractical, verify by checking that the cleanup code path runs (add a `console.log` temporarily).

- [ ] **Step 3: Commit**

  ```bash
  git add js/profile.js
  git commit -m "feat: clear legacy base64 avatar_url on profile fetch"
  ```

---

## Task 5: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Mark avatar debt as resolved**

  Find this line in `CLAUDE.md`:

  ```
  | `uploadImage()` lagrer base64 i localStorage – risiko for quota-feil ved store bilder | 🟠 Høy | Flytt til Supabase Storage i Fase 5 (auth er nå på plass) |
  ```

  Replace with:

  ```
  | `uploadImage()` lagrer base64 i localStorage – risiko for quota-feil ved store bilder | ✅ Ferdig | Supabase Storage for autentiserte brukere; uautentiserte beholder base64-flyt |
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add CLAUDE.md
  git commit -m "docs: mark avatar storage migration as complete in CLAUDE.md"
  ```

---

## Task 6: Push and verify on production

- [ ] **Step 1: Push to GitHub**

  ```bash
  git push
  ```

- [ ] **Step 2: Wait for Vercel deploy**

  Check https://vercel.com/fdevices-projects/fotball for deployment status (typically ~30 seconds).

- [ ] **Step 3: Smoke test on live URL**

  1. Open https://athlyticsport.app
  2. Log in
  3. Upload an avatar
  4. Verify avatar appears and `avatar_url` in Supabase is a Storage URL
