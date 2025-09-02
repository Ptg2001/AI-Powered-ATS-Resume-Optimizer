import { config } from "~/lib/config";
import { findOrCreateUserFromGoogle, generateToken } from "~/lib/auth";

async function exchangeCodeForTokens(code: string, currentRedirectUri: string) {
  const { clientId, clientSecret } = config.oauth.google;
  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: currentRedirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to exchange code: ${text}`);
  }
  return res.json();
}

async function fetchGoogleUserInfo(accessToken: string) {
  const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch userinfo: ${text}`);
  }
  return res.json();
}

export async function loader({ request }: { request: Request }) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    if (error) {
      return Response.redirect(`/auth?error=${encodeURIComponent(error)}`, 302);
    }
    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing code' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const origin = url.origin;
    const configured = config.oauth.google.redirectUri?.trim();
    const currentRedirectUri = configured && configured.length > 0
      ? configured
      : new URL('/api/auth/google/callback', origin).toString();
    const tokenResponse = await exchangeCodeForTokens(code, currentRedirectUri);
    const accessToken = tokenResponse.access_token as string;
    const profile = await fetchGoogleUserInfo(accessToken);
    const user = await findOrCreateUserFromGoogle(profile);
    const jwt = generateToken(user.id);

    // Redirect to /auth with token info in fragment, the client page can store it
    const redirectUrl = new URL('/auth', url.origin);
    redirectUrl.searchParams.set('googleLogin', '1');
    redirectUrl.searchParams.set('token', jwt);
    redirectUrl.searchParams.set('name', user.name || '');
    redirectUrl.searchParams.set('email', user.email || '');

    return Response.redirect(redirectUrl.toString(), 302);
  } catch (e: any) {
    return Response.redirect(`/auth?error=${encodeURIComponent(e.message || 'Google login failed')}`, 302);
  }
}


