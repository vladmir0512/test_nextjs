/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */

import withPWA from "next-pwa";
// eslint-disable-next-line import/extensions
import { env } from "./src/env.mjs";

// eslint-disable-next-line import/extensions
await import("./src/env.mjs");

/** @type {import("next").NextConfig} */
const config = {
  // reactStrictMode: true,

  /**
   * If you have `experimental: { appDir: true }` set, then you must comment the below `i18n` config
   * out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  transpilePackages: ["d3-org-chart"],
  poweredByHeader: false,
  modularizeImports: {
    "@mui/material": {
      transform: "@mui/material/{{member}}",
    },
    "@mui/icons-material": {
      transform: "@mui/icons-material/{{member}}",
    },
    "@mui/lab": {
      transform: "@mui/lab/{{member}}",
    },
  }
};
export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: env.NODE_ENV === "development",
})(config);
