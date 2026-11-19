# Cloudflare Workers

`wrangler.jsonc` configures the OpenNext Worker output and sets `keep_vars: true`
so deployments preserve plain environment variables configured in the Cloudflare
dashboard. Keep `BETTER_AUTH_URL` in the Worker's runtime Variables and Secrets
settings, with the application's actual HTTPS origin. The variable name ends in
`URL`, not `UR`. Build variables alone do not configure the running Worker.

The Worker name defaults to `piano`. Before deploying, match `name` to the existing
Cloudflare Worker name so the deployment updates the intended application.

Install dependencies with `npm ci`. `npm run build` uses OpenNext to generate
`.open-next/worker.js`, `.open-next/.build/open-next.config.edge.mjs`, and static
assets. `npm run build:cloudflare` is an equivalent build entry point.

`open-next.config.ts` explicitly sets `buildCommand: "npm run build:next"`.
This runs `next build` inside OpenNext without calling the Worker build again.
Keep this override when modifying the scripts to avoid recursive builds.
Use `npm run build:next` for a plain Node.js/Vercel Next.js build.

For Cloudflare Workers Builds, use these settings:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

The build command must generate both `.open-next/worker.js` and
`.open-next/.build/open-next.config.edge.mjs` before the deploy command starts.
The default build now creates these files. Wrangler may delegate to OpenNext
before running a custom Wrangler build, so there is deliberately no custom
`build.command` in `wrangler.jsonc`. An explicit build command of
`npm run build:cloudflare` and deploy command of
`npx opennextjs-cloudflare deploy` also work.

For a single command that builds and then deploys, use `npm run deploy`.
This script explicitly runs OpenNext build before OpenNext deploy. It can also
be used as the Cloudflare deploy command, though it will rebuild if the build
step already ran OpenNext. To check this sequence without publishing, run
`npm run deploy -- --dry-run`.

For a local Workers preview, run `npm run preview:cloudflare`.

Do not put database credentials or `BETTER_AUTH_SECRET` in `vars` or commit them.
Store those values as Cloudflare secrets. No URL placeholder is declared in
`wrangler.jsonc`, so it cannot overwrite the real dashboard URL.

References:

- https://developers.cloudflare.com/workers/wrangler/configuration/
- https://opennext.js.org/cloudflare/get-started
