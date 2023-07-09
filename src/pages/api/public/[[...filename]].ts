import {
  ALLOWED_FILE_TYPES,
  FILE_EXTENSIONS_WITH_MIME,
  type FILE_EXTENSIONS_TYPE,
} from "@/config";
import fs from "fs";
import sizeOf from "image-size";
import mimeTypes from "mime-types";
import { type NextApiRequest, type NextApiResponse } from "next";
import path from "path";
import sharp from "sharp";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { filename: filenameArr, w } = req.query;
    if (!Array.isArray(filenameArr)) {
      res.status(400).json({ message: "Invalid filename" });
      return;
    }

    const filename = filenameArr.join("/");
    if (typeof filename !== "string") {
      res.status(400).json({ message: "Invalid filename" });
      return;
    }

    const filePath = path.join(process.cwd(), "public", filename);
    const fileExt = filePath.split(".").pop();

    if (
      !fileExt ||
      !ALLOWED_FILE_TYPES.includes(
        fileExt?.toUpperCase() as FILE_EXTENSIONS_TYPE,
      )
    ) {
      res.status(404).json({ message: "File not found" });
      return;
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: "File not found" });
      return;
    }

    const fileContent = fs.readFileSync(filePath);

    const fileExtension = path.extname(filename).substring(1);
    const mimeType = mimeTypes.lookup(fileExtension);
    if (mimeType) {
      res.setHeader("Content-Type", mimeType);
      const width = parseInt(w as string, 10) || null;

      if (
        width &&
        mimeType.startsWith("image/") &&
        mimeType !== FILE_EXTENSIONS_WITH_MIME.SVG
      ) {
        const { width: fileOriginalWidth } = sizeOf(filePath);

        // Check if the width is provided and the file is an image
        const resizedImage = await sharp(fileContent)
          .resize(Math.min(fileOriginalWidth ?? 0, width)) // Resize the image with the provided width
          .toBuffer(); // Convert the resized image to a buffer
        res.send(resizedImage);
      } else res.send(fileContent);
      return;
    }
    res.send(fileContent);
  } catch (error) {
    res.status(500).send({ message: "Server Error" });
  }
}
