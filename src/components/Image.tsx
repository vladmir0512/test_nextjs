import { APP_URL } from "@/config";
import { getFileSrc } from "@/utils/fns";
import { getFileThumb } from "@/utils/getFileFormat";
import { Box, Link, type SxProps } from "@mui/material";
import NextImage, { type ImageLoaderProps, type ImageProps } from "next/image";
import NextLink from "next/link";

const imageLoader = ({ src, width, quality }: ImageLoaderProps) =>
  `${getFileSrc(src)}?w=${width}&q=${quality || 75}`;

const getBlurDataURL = (src: ImageProps["src"]) =>
  typeof src === "string" ? `${APP_URL}/api/public${src}?w=${7}` : undefined;

type Props = ImageProps & {
  openOnClick?: boolean;
  sx?: SxProps;
};

const Image = ({
  src,
  width,
  height,
  style,
  sx,
  openOnClick,
  objectFit = "cover",
  ...restProps
}: Props & {
  objectFit?: "cover" | "contain";
}) => {
  const blurDataUrl = getBlurDataURL(src);

  const Img = !src ? null : (
    <Box
      sx={{
        position: "relative",
        width: width ?? 1,
        height: height ?? 1,
        objectFit,
        overflow: "hidden",
        ...sx,
      }}
    >
      <NextImage
        loader={imageLoader}
        loading="lazy"
        sizes="100vw"
        width={0}
        height={0}
        placeholder={typeof src === "string" ? "blur" : undefined}
        blurDataURL={blurDataUrl}
        src={typeof src === "string" ? getFileThumb(src) : src}
        style={{
          width: "100%",
          height: "100%",
          objectFit,
          ...style,
        }}
        {...restProps}
      />
    </Box>
  );

  return openOnClick && typeof src === "string" ? (
    <Link
      target="_blank"
      href={getFileSrc(src)}
      sx={{ width: 1, height: 1 }}
      component={NextLink}
    >
      {Img}
    </Link>
  ) : (
    Img
  );
};

export default Image;
