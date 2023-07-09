import appData from "@/appData.json";
import { useConfiguration } from "@/redux/slices/configuration";
import { getAbsoluteFileSrc } from "@/utils/fns";
import { Box, type BoxProps } from "@mui/material";
import Head from "next/head";
import React from "react";
import { MotionViewport } from "./animate";

type Props = BoxProps & {
  title: string;
  children: React.ReactNode;
  head?: boolean;
  motion?: boolean;
};

const Page = ({
  title,
  children,
  head = true,
  motion,
  ...restProps
}: Props) => {
  const { appName, favicon } = useConfiguration();
  return (
    <>
      {head && (
        <Head>
          <meta charSet="utf-8" />
          <link
            rel="icon"
            type="image/png"
            href={
              getAbsoluteFileSrc(favicon) || getAbsoluteFileSrc(appData.favicon)
            }
          />
          <title>{`${title} | ${appName || appData.siteName}`}</title>
        </Head>
      )}
      <Box
        sx={{
          display: "flex",
          flexGrow: 1,
          flexDirection: "column",
        }}
        component={!motion ? undefined : MotionViewport}
        {...restProps}
      >
        {children}
      </Box>
    </>
  );
};

export default Page;
