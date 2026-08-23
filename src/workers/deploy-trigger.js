export class BackgroundWorker {}

export default {
  async fetch(request, env, ctx) {
    const containerInstance = env.BackgroundWorker.get(env.BackgroundWorker.idFromName("global_worker"));
    return new Response("Container trigger active.");
  }
};
