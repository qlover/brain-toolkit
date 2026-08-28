/**
 * Captures a first-screen screenshot for a public page URL.
 *
 * Default provider: Microlink. Override with `PAM_SCREENSHOT_URL_TEMPLATE`
 * containing `{url}` (direct image URL) when you use thum.io / ScreenshotOne / etc.
 */

export type CapturedScreenshot = {
  bytes: Uint8Array;
  contentType: string;
};

function guessContentType(url: string, header?: string | null): string {
  const fromHeader = header?.split(';')[0]?.trim().toLowerCase();
  if (fromHeader?.startsWith('image/')) {
    return fromHeader;
  }
  if (url.includes('.png')) return 'image/png';
  if (url.includes('.webp')) return 'image/webp';
  return 'image/jpeg';
}

async function fetchImageBytes(imageUrl: string): Promise<CapturedScreenshot> {
  const response = await fetch(imageUrl, {
    headers: { Accept: 'image/*,*/*' },
    signal: AbortSignal.timeout(45_000)
  });
  if (!response.ok) {
    throw new Error(`Screenshot image fetch failed: ${response.status}`);
  }
  const buffer = new Uint8Array(await response.arrayBuffer());
  if (buffer.byteLength < 100) {
    throw new Error('Screenshot image too small');
  }
  return {
    bytes: buffer,
    contentType: guessContentType(
      imageUrl,
      response.headers.get('content-type')
    )
  };
}

/**
 * Captures a viewport screenshot of `pageUrl`.
 *
 * @param pageUrl - Absolute http(s) URL
 * @param template - Optional `{url}` template that returns an image directly
 */
export async function capturePageScreenshot(
  pageUrl: string,
  template?: string
): Promise<CapturedScreenshot> {
  const trimmedTemplate = template?.trim() || '';
  if (trimmedTemplate) {
    const imageUrl = trimmedTemplate.replaceAll(
      '{url}',
      encodeURIComponent(pageUrl)
    );
    return fetchImageBytes(imageUrl);
  }

  const microlink = new URL('https://api.microlink.io');
  microlink.searchParams.set('url', pageUrl);
  microlink.searchParams.set('screenshot', 'true');
  microlink.searchParams.set('meta', 'false');
  microlink.searchParams.set('viewport.width', '1280');
  microlink.searchParams.set('viewport.height', '800');

  const metaResponse = await fetch(microlink.toString(), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(45_000)
  });
  if (!metaResponse.ok) {
    throw new Error(`Microlink failed: ${metaResponse.status}`);
  }

  const payload = (await metaResponse.json()) as {
    status?: string;
    data?: { screenshot?: { url?: string } };
  };
  const shotUrl = payload.data?.screenshot?.url?.trim();
  if (payload.status !== 'success' || !shotUrl) {
    throw new Error('Microlink returned no screenshot URL');
  }

  return fetchImageBytes(shotUrl);
}

/**
 * Picks the first environment URL, else repo URL.
 */
export function resolveProjectCaptureUrl(params: {
  environments?: { name?: string; url?: string | null }[] | null;
  repoUrl?: string | null;
}): string {
  const envs = params.environments || [];
  const preferred = ['prod', 'production', 'preview', 'main', 'live'];
  for (const name of preferred) {
    const hit = envs.find(
      (env) => env.url && (env.name || '').trim().toLowerCase() === name
    );
    if (hit?.url) {
      return hit.url.trim();
    }
  }
  for (const env of envs) {
    if (env.url?.trim()) {
      return env.url.trim();
    }
  }
  return (params.repoUrl || '').trim();
}
