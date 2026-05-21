/* Thin client for /api/policies. Designed to be safe to call from anywhere:
 * - When the API responds 200, we're in "cloud" mode and uploads become
 *   visible to every visitor of the deployment.
 * - When the API is missing or returns 503 (no BLOB_READ_WRITE_TOKEN), we
 *   stay in "local" mode and the existing localStorage flow keeps working.
 *
 * The first ping result is cached for the rest of the session so we don't
 * spam the server on every render. */

(function () {
  'use strict';

  var ENDPOINT = '/api/policies';

  /* Tri-state: null = unknown, true/false = decided. */
  var _available = null;
  var _pingPromise = null;
  var _subscribers = [];

  function _notify() {
    _subscribers.slice().forEach(function (fn) {
      try { fn({ available: _available }); } catch (_) { /* swallow */ }
    });
  }

  /* Single-flight: the first caller triggers the probe, every concurrent
   * caller awaits the same promise. */
  function ping() {
    if (_available !== null) return Promise.resolve(_available);
    if (_pingPromise) return _pingPromise;
    _pingPromise = fetch(ENDPOINT, { method: 'GET', cache: 'no-store' })
      .then(function (r) {
        if (!r) { _available = false; return false; }
        if (r.status === 503) { _available = false; return false; }
        if (!r.ok)            { _available = false; return false; }
        return r.json().then(function (j) {
          _available = !!(j && j.available !== false);
          return _available;
        }, function () { _available = false; return false; });
      })
      .catch(function () { _available = false; return false; })
      .then(function (v) { _pingPromise = null; _notify(); return v; });
    return _pingPromise;
  }

  function isAvailable() { return _available === true; }

  function subscribe(fn) {
    if (typeof fn === 'function') _subscribers.push(fn);
    return function () {
      _subscribers = _subscribers.filter(function (x) { return x !== fn; });
    };
  }

  function list() {
    return fetch(ENDPOINT, { method: 'GET', cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) return [];
        return r.json().then(function (j) { return (j && j.policies) || []; }, function () { return []; });
      })
      .catch(function () { return []; });
  }

  function upload(meta, base64, mimeType) {
    var body = JSON.stringify({ meta: meta || {}, base64: base64 || null, mimeType: mimeType || null });
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    }).then(function (r) {
      return r.json().then(function (j) { return { status: r.status, json: j }; },
                            function ()  { return { status: r.status, json: null }; });
    }).then(function (res) {
      if (res.status >= 200 && res.status < 300 && res.json && res.json.policy) {
        return { ok: true, policy: res.json.policy };
      }
      var err = (res.json && res.json.error) || {};
      return { ok: false, error: err.message || ('Upload failed (' + res.status + ')'), code: err.code || ('HTTP_' + res.status) };
    }, function (e) {
      return { ok: false, error: e && e.message ? e.message : 'Network error', code: 'NETWORK_ERROR' };
    });
  }

  function remove(id) {
    if (!id) return Promise.resolve({ ok: false, error: 'id required' });
    return fetch(ENDPOINT + '/' + encodeURIComponent(id), { method: 'DELETE', cache: 'no-store' })
      .then(function (r) {
        return r.json().then(function (j) { return { status: r.status, json: j }; },
                              function ()  { return { status: r.status, json: null }; });
      })
      .then(function (res) {
        if (res.status >= 200 && res.status < 300) return { ok: true };
        var err = (res.json && res.json.error) || {};
        return { ok: false, error: err.message || ('Delete failed (' + res.status + ')'), code: err.code || ('HTTP_' + res.status) };
      }, function (e) {
        return { ok: false, error: e && e.message ? e.message : 'Network error', code: 'NETWORK_ERROR' };
      });
  }

  window.CloudPolicies = {
    ENDPOINT:    ENDPOINT,
    ping:        ping,
    isAvailable: isAvailable,
    subscribe:   subscribe,
    list:        list,
    upload:      upload,
    remove:      remove
  };
})();
