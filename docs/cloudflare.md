# Cloudflare Workers

`wrangler.jsonc` configures the OpenNext Worker output and sets `keep_vars: true`
so deployments preserve plain environment variables configured in the Cloudflare
dashboard. Keep `BETTER_AUTH_URL` in the Worker's runtime Variables and Secrets
settings, with the application's actual HTTPS origin. The variable name ends in
`URL`, not `UR`. Build variables alone do not configure the running Worker.

The Worker name defaults to `piano`. Before deploying, match `name` to the existing
Cloudflare Worker name so the deployment updates the intended application.

Install dependencies with `npm ci`. `npm run build:cloudflare` uses OpenNext to
generate `.open-next/worker.js` and `.open-next/assets`; `next build` alone does
not produce them. Keep `npm run build` as the regular Next.js build, because
OpenNext invokes it internally.

For Cloudflare Workers Builds, use these settings:

- Build command: `npm run build:cloudflare`
- Deploy command: `npx opennextjs-cloudflare deploy`

The build command must generate both `.open-next/worker.js` and
`.open-next/.build/open-next.config.edge.mjs` before the deploy command starts.
Using `npm run build` alone only generates Next.js output. Wrangler may delegate
to OpenNext before running a custom Wrangler build, so there is deliberately no
custom `build.command` in `wrangler.jsonc`.

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
