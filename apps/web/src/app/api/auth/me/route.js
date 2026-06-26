export async function GET(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").filter(Boolean).map(c => {
      const [key, ...val] = c.split("=");
      return [key, val.join("=")];
    })
  );

  if (!cookies.session) {
    return Response.json({ authenticated: false });
  }

  try {
    // Decode user info from cookie
    const decoded = Buffer.from(cookies.session, 'base64').toString('utf-8');
    const user = JSON.parse(decoded);

    if (!user || !user.id) {
      return Response.json({ authenticated: false });
    }

    return Response.json({
      authenticated: true,
      username: user.username,
      name: user.name,
      user_id: user.id,
    });
  } catch (err) {
    console.error('Session decode error:', err);
    return Response.json({ authenticated: false });
  }
}
