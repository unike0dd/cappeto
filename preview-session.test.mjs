import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearPreviewSessionState,
  persistRememberedEmail,
  restoreRememberedEmail,
  readPreviewSessionProfile,
  startPreviewSession
} from './preview-session.mjs';

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    clear() {
      values.clear();
    }
  };
}

test('remembered email is isolated from preview session cleanup', () => {
  const storage = createStorage();
  storage.setItem('cappeto_preview_session', JSON.stringify({ active: true }));
  storage.setItem('cappeto_remembered_email', ' staff@example.com ');

  assert.equal(restoreRememberedEmail(storage), ' staff@example.com ');
  assert.equal(persistRememberedEmail(storage, '  staff@example.com  ', true), true);
  assert.equal(restoreRememberedEmail(storage), 'staff@example.com');

  assert.equal(clearPreviewSessionState(storage), true);
  assert.equal(storage.getItem('cappeto_preview_session'), null);
  assert.equal(storage.getItem('cappeto_remembered_email'), 'staff@example.com');
});

test('preview session profile and user state are created without leaking regular session data', () => {
  const storage = createStorage();
  storage.setItem('other_session_value', 'keep-me');

  const user = startPreviewSession(storage, { id: 'preview-owner', role: 'owner', preview: true, displayName: 'Preview owner' });

  assert.deepEqual(user, { id: 'preview-owner', role: 'owner', preview: true, displayName: 'Preview owner' });
  assert.equal(storage.getItem('other_session_value'), 'keep-me');
  assert.ok(storage.getItem('cappeto_preview_session'));

  const profile = readPreviewSessionProfile(storage);
  assert.equal(profile.name, 'Preview owner');
  assert.equal(profile.settings.sessionOnly, true);
});
