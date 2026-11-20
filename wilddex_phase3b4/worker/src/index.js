const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_FILE_BYTES + 128 * 1024;

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

// Reject oversized uploads *while reading*, even if Content-Length is missing.
async function boundedFormData(request) {
  if (!request.body) throw new Error('empty-body');
  const lengthHeader = request.headers.get('content-length');
  if (lengthHeader && Number(lengthHeader) > MAX_REQUEST_BYTES) throw new Error('too-large');
  const reader = request.body.getReader();
  const parts = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_REQUEST_BYTES) throw new Error('too-large');
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return new Response(new Blob(parts), {
    headers: { 'Content-Type': request.headers.get('content-type') || '' },
  }).formData();
}

async function supportedImage(file) {
  if (!(file instanceof File)) return false;
  if (!['image/jpeg', 'image/png'].includes(file.type)) return false;
  if (file.size < 8 || file.size > MAX_FILE_BYTES) return false;
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const jpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const png = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47 && header[4] === 0x0d && header[5] === 0x0a && header[6] === 0x1a && header[7] === 0x0a;
  return file.type === 'image/jpeg' ? jpeg : png;
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (request.method === 'GET' && pathname === '/health') {
      return json({ ok: true, service: 'wilddex-api' });
    }
    if (pathname !== '/identify/plant') return json({ error: 'Endpoint not found.' }, 404);
    if (request.method !== 'POST') return json({ error: 'Use POST for identification.' }, 405);

    // Fail closed if the developer forgot to configure a limiter or the API key.
    if (!env.PLANTNET_API_KEY || !env.GUEST_LIMIT || !env.TRAFFIC_LIMIT) {
      return json({ error: 'Service is not configured.' }, 503);
    }

    // Guest access: no client-side shared secret. These limits deter casual abuse,
    // but are not global daily quotas or a substitute for bot protection.
    const ip = request.headers.get('CF-Connecting-IP') || 'missing-ip';
    const individual = await env.GUEST_LIMIT.limit({ key: `guest:${ip}` });
    if (!individual.success) return json({ error: 'Too many requests. Please wait a minute.' }, 429);
    const traffic = await env.TRAFFIC_LIMIT.limit({ key: 'all-guests' });
    if (!traffic.success) return json({ error: 'Service is busy. Try again shortly.' }, 429);

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('multipart/form-data;')) {
      return json({ error: 'Send an image as multipart form data.' }, 415);
    }

    let form;
    try {
      form = await boundedFormData(request);
    } catch (error) {
      if (error instanceof Error && error.message === 'too-large') return json({ error: 'Upload exceeds 8 MB.' }, 413);
      return json({ error: 'Invalid image upload.' }, 400);
    }

    const photo = form.get('image');
    if (!(photo instanceof File) || !(await supportedImage(photo))) {
      return json({ error: 'Choose a valid JPEG or PNG image under 8 MB.' }, 415);
    }

    const payload = new FormData();
    payload.append('images', photo, photo.name || 'plant.jpg');
    payload.append('organs', 'auto');
    const upstream = new URL('https://my-api.plantnet.org/v2/identify/all');
    upstream.searchParams.set('api-key', env.PLANTNET_API_KEY);
    upstream.searchParams.set('lang', 'en');
    upstream.searchParams.set('nb-results', '5');

    let response;
    try {
      response = await fetch(upstream, {
        method: 'POST',
        body: payload,
        signal: AbortSignal.timeout(25000),
      });
    } catch {
      return json({ error: 'Plant identification timed out or could not be reached.' }, 502);
    }

    if (response.status === 429) return json({ error: 'Plant identification quota reached.' }, 429);
    if (response.status === 404 || response.status === 422) return json({ suggestions: [], bestMatch: null }, 200);
    if (!response.ok) return json({ error: 'Plant identification service unavailable.' }, 502);

    let result;
    try { result = await response.json(); }
    catch { return json({ error: 'Invalid response from identification service.' }, 502); }

    return json({
      bestMatch: result.bestMatch ?? null,
      remainingRequests: result.remainingIdentificationRequests ?? null,
      suggestions: (Array.isArray(result.results) ? result.results : []).slice(0, 5).map((match) => ({
        scientificName: match.species?.scientificNameWithoutAuthor ?? match.species?.scientificName ?? 'Unknown species',
        commonNames: Array.isArray(match.species?.commonNames) ? match.species.commonNames : [],
        family: match.species?.family?.scientificNameWithoutAuthor ?? match.species?.family?.scientificName ?? null,
        score: typeof match.score === 'number' ? match.score : 0,
      })),
    });
  },
};
