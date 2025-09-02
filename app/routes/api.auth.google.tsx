import { config } from "~/lib/config";

export async function loader({ request }: { request: Request }) {
  const { clientId, scope } = config.oauth.google;
  if (!clientId) {
    return new Response(JSON.stringify({ error: "Google OAuth not configured" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const origin = new URL(request.url).origin;
  const configured = config.oauth.google.redirectUri?.trim();
  const redirectUri = configured && configured.length > 0
    ? configured
    : new URL('/api/auth/google/callback', origin).toString();

  const url = new URL(request.url);
  if (url.searchParams.get('debug') === '1') {
    const redactedClientId = clientId.replace(/(^.{6}).+(@.*$)/, '$1…$2');
    const data = {
      origin,
      usingConfiguredRedirect: Boolean(configured && configured.length > 0),
      redirectUri,
      clientId: redactedClientId,
      scope,
      expectedAuthorizedOrigins: [origin],
      expectedAuthorizedRedirectUris: [redirectUri],
    };
    return new Response(JSON.stringify(data, null, 2), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return Response.redirect(authUrl, 302);
}


