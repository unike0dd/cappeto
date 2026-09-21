const PREVIEW_SESSION_KEYS = Object.freeze([
  'cappeto_preview_session',
  'cappeto_preview_profile',
  'cappeto_preview_profile_name',
  'cappeto_preview_profile_address',
  'cappeto_preview_profile_phone',
  'cappeto_preview_profile_alt_email',
  'cappeto_preview_settings',
  'cappeto_preview_customer',
  'cappeto_preview_customer_profile',
  'cappeto_preview_customer_settings'
]);

function safeRead(storage, key) {
  if (!storage || typeof storage.getItem !== 'function') return null;
  const value = storage.getItem(key);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function clearPreviewSessionState(storage = globalThis.sessionStorage) {
  if (!storage) return false;
  for (const key of PREVIEW_SESSION_KEYS) {
    storage.removeItem(key);
  }
  return true;
}

export function persistRememberedEmail(storage = globalThis.sessionStorage, email, checked) {
  if (!storage || typeof storage.getItem !== 'function') return false;
  const normalized = typeof email === 'string' ? email.trim() : '';
  if (checked && normalized) {
    storage.setItem('cappeto_remembered_email', normalized);
    return true;
  }
  storage.removeItem('cappeto_remembered_email');
  return true;
}

export function restoreRememberedEmail(storage = globalThis.sessionStorage) {
  if (!storage || typeof storage.getItem !== 'function') return '';
  return storage.getItem('cappeto_remembered_email') || '';
}

export function writePreviewSessionProfile(profile = {}, storage = globalThis.sessionStorage) {
  if (!storage) return null;
  const normalized = {
    name: profile.name ?? '',
    address: profile.address ?? '',
    phone: profile.phone ?? '',
    altEmail: profile.altEmail ?? '',
    settings: profile.settings ?? {}
  };

  for (const key of PREVIEW_SESSION_KEYS) {
    storage.removeItem(key);
  }

  storage.setItem('cappeto_preview_profile', JSON.stringify(normalized));
  storage.setItem('cappeto_preview_profile_name', normalized.name);
  storage.setItem('cappeto_preview_profile_address', normalized.address);
  storage.setItem('cappeto_preview_profile_phone', normalized.phone);
  storage.setItem('cappeto_preview_profile_alt_email', normalized.altEmail);
  storage.setItem('cappeto_preview_settings', JSON.stringify(normalized.settings));
  storage.setItem('cappeto_preview_customer_profile', JSON.stringify(normalized));
  storage.setItem('cappeto_preview_customer_settings', JSON.stringify(normalized.settings));
  storage.setItem('cappeto_preview_session', JSON.stringify({ active: true, startedAt: new Date().toISOString() }));
  return normalized;
}

export function readPreviewSessionProfile(storage = globalThis.sessionStorage) {
  const profile = safeRead(storage, 'cappeto_preview_profile') ?? safeRead(storage, 'cappeto_preview_customer_profile');
  if (!profile || typeof profile !== 'object') {
    return {
      name: safeRead(storage, 'cappeto_preview_profile_name') ?? '',
      address: safeRead(storage, 'cappeto_preview_profile_address') ?? '',
      phone: safeRead(storage, 'cappeto_preview_profile_phone') ?? '',
      altEmail: safeRead(storage, 'cappeto_preview_profile_alt_email') ?? '',
      settings: safeRead(storage, 'cappeto_preview_settings') ?? safeRead(storage, 'cappeto_preview_customer_settings') ?? {}
    };
  }

  return {
    name: profile.name ?? safeRead(storage, 'cappeto_preview_profile_name') ?? '',
    address: profile.address ?? safeRead(storage, 'cappeto_preview_profile_address') ?? '',
    phone: profile.phone ?? safeRead(storage, 'cappeto_preview_profile_phone') ?? '',
    altEmail: profile.altEmail ?? safeRead(storage, 'cappeto_preview_profile_alt_email') ?? '',
    settings: profile.settings ?? safeRead(storage, 'cappeto_preview_settings') ?? safeRead(storage, 'cappeto_preview_customer_settings') ?? {}
  };
}

export function startPreviewSession(storage = globalThis.sessionStorage, previewUser = null) {
  const user = previewUser ?? { id: 'preview-owner', role: 'owner', preview: true, displayName: 'Preview owner' };
  const profile = {
    name: user.displayName || 'Preview owner',
    address: '',
    phone: '',
    altEmail: '',
    settings: { sessionOnly: true, nonProduction: true }
  };
  clearPreviewSessionState(storage);
  writePreviewSessionProfile(profile, storage);
  storage.setItem('cappeto_preview_session', JSON.stringify({ active: true, startedAt: new Date().toISOString(), user, profile }));
  return user;
}

if (typeof window !== 'undefined') {
  window.CAPPETO_PREVIEW_SESSION = {
    PREVIEW_SESSION_KEYS,
    clearPreviewSessionState,
    persistRememberedEmail,
    restoreRememberedEmail,
    writePreviewSessionProfile,
    readPreviewSessionProfile,
    startPreviewSession
  };
}
