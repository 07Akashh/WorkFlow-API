import { Container, getContainer } from "@cloudflare/containers";

export class BackgroundWorker extends Container {
  defaultPort = 3000;
  sleepAfter = "10m";
}

export default {
  async fetch(request, env) {
    const container = getContainer(
      env.BackgroundWorker,
      "global_worker"
    );

    return container.fetch(request);
  },
};