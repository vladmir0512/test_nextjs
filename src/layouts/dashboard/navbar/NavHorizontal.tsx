import { NavSectionHorizontal } from "@/components/nav-section";
import { HEADER } from "@/config";
import { AppBar, Container } from "@mui/material";
import { styled } from "@mui/material/styles";
import { memo } from "react";
import navConfig from "./NavConfig";

const RootStyle = styled(AppBar)(({ theme }) => ({
  transition: theme.transitions.create("top", {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.shorter,
  }),
  width: "100%",
  position: "fixed",
  zIndex: theme.zIndex.appBar,
  padding: theme.spacing(1, 0),
  boxShadow: theme.customShadows.z8,
  top: HEADER.DASHBOARD_DESKTOP_OFFSET_HEIGHT,
  backgroundColor: theme.palette.background.default,
}));

function NavHorizontal() {
  return (
    <RootStyle>
      <Container maxWidth={false}>
        <NavSectionHorizontal navConfig={navConfig} />
      </Container>
    </RootStyle>
  );
}

export default memo(NavHorizontal);
