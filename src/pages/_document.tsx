import appData from "@/appData.json";
import { APP_URL } from "@/config";
import { env } from "@/env.mjs";
import palette from "@/theme/palette";
import { getAbsoluteFileSrc } from "@/utils/fns";
// eslint-disable-next-line import/no-extraneous-dependencies
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import createEmotionServer from "@emotion/server/create-instance";
import { type AppType } from "next/app";
import Document, {
  Head,
  Html,
  Main,
  NextScript,
  type DocumentContext,
} from "next/document";
import React from "react";
import { type AppPropsWithLayout } from "./_app";

function createEmotionCache() {
  return createCache({ key: "css" });
}

export default function MyDocument() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        <meta
          httpEquiv="X-UA-Compatible"
          content="IE=edge"
        />
        <meta
          name="description"
          content={appData.description}
        />
        <meta
          name="keywords"
          content={appData.keywords}
        />
        <meta
          name="robots"
          content="index, follow"
        />
        <meta
          name="author"
          content={appData.author}
        />
        <link
          rel="canonical"
          href={APP_URL}
        />
        {/* OG tags */}
        <meta
          property="og:title"
          content={appData.title}
        />
        <meta
          property="og:site_name"
          content={appData.siteName}
        />
        <meta
          property="og:description"
          content={appData.description}
        />
        <meta
          property="og:image"
          content={getAbsoluteFileSrc(appData.image)}
        />
        <meta
          property="og:url"
          content={env.NEXT_PUBLIC_APP_URL}
        />
        <meta
          property="og:type"
          content="website"
        />

        {/* twitter  */}
        <meta
          name="twitter:title"
          content={appData.title}
        />
        <meta
          name="twitter:description"
          content={appData.description}
        />
        <meta
          name="twitter:image"
          content={getAbsoluteFileSrc(appData.image)}
        />
        <meta
          name="twitter:card"
          content={getAbsoluteFileSrc(appData.image)}
        />

        {/* PWA */}
        <link
          rel="manifest"
          href="/manifest.json"
        />
        <link
          rel="apple-touch-icon"
          href={appData.favicon}
        ></link>
        <meta
          name="theme-color"
          content={palette.light.secondary.main}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

// `getInitialProps` belongs to `_document` (instead of `_app`),
// it's compatible with static-site generation (SSG).
MyDocument.getInitialProps = async (ctx: DocumentContext) => {
  const originalRenderPage = ctx.renderPage;

  // You can consider sharing the same Emotion cache between all the SSR requests to speed up performance.
  // However, be aware that it can have global side effects.
  const cache = createEmotionCache();
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { extractCriticalToChunks } = createEmotionServer(cache);

  // We're passing `emotionCache` to App component
  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp:
        (
          App: React.ComponentType<
            React.ComponentProps<AppType> & AppPropsWithLayout
          >,
        ) =>
        (props) =>
          (
            <CacheProvider value={cache}>
              <App {...props} />
            </CacheProvider>
          ),
    });

  const initialProps = await Document.getInitialProps(ctx);
  // This is important. It prevents Emotion to render invalid HTML.
  // See https://github.com/mui/material-ui/issues/26561#issuecomment-855286153
  const emotionStyles = extractCriticalToChunks(initialProps.html);
  const emotionStyleTags = emotionStyles.styles.map((style) => (
    <style
      data-emotion={`${style.key} ${style.ids.join(" ")}`}
      key={style.key}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: style.css }}
    />
  ));

  return {
    ...initialProps,
    // return emotionStyleTags as props
    styles: [
      ...React.Children.toArray(initialProps.styles),
      ...emotionStyleTags,
    ],
  };
};
