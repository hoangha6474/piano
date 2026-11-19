import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default {
  ...defineCloudflareConfig(),
  // `npm run build` builds the Worker; call Next.js directly to avoid recursion.
  buildCommand: "npm run build:next",
};
