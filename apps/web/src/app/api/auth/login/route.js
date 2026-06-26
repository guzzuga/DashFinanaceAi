export async function POST(request) {
  const { username, password } = await request.json();

  try {
    // Call backend API for authentication
    const res = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.success && data.user) {
      // Store user info in cookie
      const userInfo = JSON.stringify({
        id: data.user.id,
        username: data.user.username,
        name: data.user.name
      });
      const encoded = Buffer.from(userInfo).toString('base64');

      return new Response(JSON.stringify({ success: true, user: data.user }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": `session=${encoded}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
        },
      });
    }

    return new Response(JSON.stringify({ error: "Username atau password salah" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error('Login error:', err);
    return new Response(JSON.stringify({ error: "Gagal menghubungi server" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
