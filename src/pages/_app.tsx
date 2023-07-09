import ProgressBar, { ProgressBarStyle } from "@/components/ProgressBar";
import ToastContainer from "@/components/ToastContainer";
import { MotionLazyContainer } from "@/components/animate";
import Settings from "@/components/settings";
import AdminAuthProvider from "@/redux/providers/admin";
import ConfigurationProvider from "@/redux/providers/configuration";
import UserAuthProvider from "@/redux/providers/user";
import { wrapper } from "@/redux/store";
import "@/styles/globals.css";
import ThemeProvider from "@/theme";
import { baseApi } from "@/utils/api";
import { Box, NoSsr, Slide } from "@mui/material";
import { type TransitionProps } from "@mui/material/transitions";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { m, useScroll, useSpring } from "framer-motion";
import { ConfirmProvider } from "material-ui-confirm";
import { type NextPage } from "next";
import { type AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { forwardRef, type ReactElement, type ReactNode } from "react";
import { Provider } from "react-redux";
import "react-toastify/dist/ReactToastify.css";
import { persistStore } from "redux-persist";
import { PersistGate } from "redux-persist/integration/react";

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

export type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const Transition = forwardRef(
  (
    props: TransitionProps & {
      children: React.ReactElement;
    },
    ref: React.Ref<unknown>,
  ) => (
    <Slide
      direction="up"
      ref={ref}
      {...props}
    />
  ),
);
Transition.displayName = "Transition";

const MyApp = (props: AppPropsWithLayout) => {
  const { Component, ...pageProps } = props;
  const { store } = wrapper.useWrappedStore(pageProps);
  const getLayout = Component.getLayout ?? ((page) => page);
  const router = useRouter();
  const isAdmin = router.pathname.startsWith("/admin");
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </Head>
      <PersistGate persistor={persistStore(store)}>
        {() => (
          <Provider store={store}>
            <ThemeProvider>
              <Box
                component={m.div}
                className="progress-bar"
                style={{
                  scaleX,
                  position: "fixed",
                  top: 0,
                  left: 0,
                  height: 10,
                  background: "red",
                  transformOrigin: "0%",
                }}
              />
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <MotionLazyContainer>
                  <ConfirmProvider
                    defaultOptions={{
                      dialogProps: {
                        TransitionComponent: Transition,
                      },
                      title: "Warning!",
                      cancellationButtonProps: {
                        color: "error",
                        size: "small",
                      },
                      cancellationText: "No, Cancel",
                      confirmationText: "Yes, Sure",
                      confirmationButtonProps: {
                        size: "small",
                      },
                    }}
                  >
                    <ProgressBar />
                    <ProgressBarStyle />
                    <NoSsr>
                      {isAdmin ? <AdminAuthProvider /> : <UserAuthProvider />}
                    </NoSsr>
                    <ConfigurationProvider />
                    <ToastContainer />
                    <Settings />
                    {getLayout(<Component {...pageProps} />)}
                  </ConfirmProvider>
                </MotionLazyContainer>
              </LocalizationProvider>
            </ThemeProvider>
          </Provider>
        )}
      </PersistGate>
    </>
  );
};

export default baseApi.withTRPC(MyApp);
