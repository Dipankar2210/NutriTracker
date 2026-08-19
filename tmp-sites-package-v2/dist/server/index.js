export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return Response.json({ error: 'This hosted preview includes the NutriMate marketing experience. Run the local app to use account and meal APIs.' }, { status: 503 });
    }
    return env.ASSETS.fetch(request);
  }
};
