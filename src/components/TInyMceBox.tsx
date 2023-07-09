import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

const TinyMceBox = styled(Box)(({ theme }) => ({
  "& p": {
    color: theme.palette.grey[600],
    marginBottom: 8,
  },
  "& :is(h1, h2, h3, h4, h5, h6)": {
    marginBottom: 8,
  },
  "& ul": {
    listStylePosition: "inside",
  },
  "& ul li": {
    marginBottom: 8,
    color: theme.palette.grey[600],
  },
}));

export default TinyMceBox;
