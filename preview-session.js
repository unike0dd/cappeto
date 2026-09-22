(function () {
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

  function parsePreviewSettings(storage) {
    const raw = storage.getItem('cappeto_preview_settings') || storage.getItem('cappeto_preview_customer_settings');
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  function clearPreviewSessionState(storage = globalThis.sessionStorage) {
    if (!storage || typeof storage.getItem !== 'function') return false;
    for (const key of PREVIEW_SESSION_KEYS) {
      storage.removeItem(key);
    }
    return true;
  }

  function clearPreviewSessionOnlyData(storage = globalThis.sessionStorage) {
    return clearPreviewSessionState(storage);
  }

  function persistRememberedEmail(storage = globalThis.sessionStorage, email, checked) {
    if (!storage || typeof storage.getItem !== 'function') return false;
    const normalized = typeof email === 'string' ? email.trim() : '';
    if (checked && normalized) {
      storage.setItem('cappeto_remembered_email', normalized);
      return true;
    }
    storage.removeItem('cappeto_remembered_email');
    return true;
  }

  function restoreRememberedEmail(storage = globalThis.sessionStorage) {
    if (!storage || typeof storage.getItem !== 'function') return '';
    return storage.getItem('cappeto_remembered_email') || '';
  }

  function readPreviewSessionProfile(storage = globalThis.sessionStorage) {
    const raw = storage.getItem('cappeto_preview_profile') || storage.getItem('cappeto_preview_customer_profile');
    if (raw) {
      try {
        const profile = JSON.parse(raw);
        if (profile && typeof profile === 'object') {
          return {
            name: profile.name || '',
            address: profile.address || '',
            phone: profile.phone || '',
            altEmail: profile.altEmail || '',
            settings: profile.settings && typeof profile.settings === 'object' ? profile.settings : parsePreviewSettings(storage)
          };
        }
      } catch {
        // fall through to the fallback below
      }
    }

    return {
      name: storage.getItem('cappeto_preview_profile_name') || '',
      address: storage.getItem('cappeto_preview_profile_address') || '',
      phone: storage.getItem('cappeto_preview_profile_phone') || '',
      altEmail: storage.getItem('cappeto_preview_profile_alt_email') || '',
      settings: parsePreviewSettings(storage)
    };
  }

  function writePreviewSessionProfile(profile = {}, storage = globalThis.sessionStorage) {
    if (!storage || typeof storage.getItem !== 'function') {
      return { name: '', address: '', phone: '', altEmail: '', settings: {} };
    }

    const next = {
      name: profile.name || '',
      address: profile.address || '',
      phone: profile.phone || '',
      altEmail: profile.altEmail || '',
      settings: profile.settings && typeof profile.settings === 'object' ? profile.settings : {}
    };

    clearPreviewSessionState(storage);
    storage.setItem('cappeto_preview_profile', JSON.stringify(next));
    storage.setItem('cappeto_preview_profile_name', next.name);
    storage.setItem('cappeto_preview_profile_address', next.address);
    storage.setItem('cappeto_preview_profile_phone', next.phone);
    storage.setItem('cappeto_preview_profile_alt_email', next.altEmail);
    storage.setItem('cappeto_preview_settings', JSON.stringify(next.settings));
    storage.setItem('cappeto_preview_customer_profile', JSON.stringify(next));
    storage.setItem('cappeto_preview_customer_settings', JSON.stringify(next.settings));
    return next;
  }

  function startPreviewSession(storage = globalThis.sessionStorage, previewUser = null) {
    if (!storage || typeof storage.getItem !== 'function') return null;
    const user = previewUser || { id: 'preview-owner', role: 'owner', displayName: 'Preview owner', preview: true };
    clearPreviewSessionState(storage);
    const profile = writePreviewSessionProfile({
      name: user.displayName || 'Preview owner',
      address: '',
      phone: '',
      altEmail: '',
      settings: { sessionOnly: true, nonProduction: true }
    }, storage);
    storage.setItem('cappeto_preview_session', JSON.stringify({ active: true, startedAt: new Date().toISOString(), user, profile }));
    return user;
  }

  const api = {
    PREVIEW_SESSION_KEYS,
    clearPreviewSessionState,
    clearPreviewSessionOnlyData,
    persistRememberedEmail,
    restoreRememberedEmail,
    readPreviewSessionProfile,
    writePreviewSessionProfile,
    startPreviewSession
  };

  if (typeof window !== 'undefined') {
    window.CAPPETO_PREVIEW_SESSION = api;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.CAPPETO_PREVIEW_SESSION = api;
  }
}());
