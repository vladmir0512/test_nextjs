import {
  ALLOWED_FILE_MIMES,
  ALLOWED_FILE_TYPES,
  type FILE_EXTENSIONS_TYPE,
  FILE_EXTENSIONS_WITH_MIME,
} from "@/config";
import crypto from "crypto";
import { IncomingForm, type File } from "formidable";
import { type NextApiRequest, type NextApiResponse } from "next";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    // check if x-accept header is present
    const AcceptExtensions = req.headers["x-accept"];
    if (typeof AcceptExtensions !== "string")
      throw new Error("Invalid Accept header");

    // check if x-accept header is valid
    const isAcceptValid = AcceptExtensions.split(",").every((val) =>
      ALLOWED_FILE_TYPES.includes(val as unknown as FILE_EXTENSIONS_TYPE),
    );

    if (!isAcceptValid && AcceptExtensions !== "any")
      throw new Error("Invalid Accept header");

    // covert file extensions array to mime extensions array
    const ALLOWED_MIMES =
      AcceptExtensions === "any"
        ? ALLOWED_FILE_MIMES
        : AcceptExtensions.split(",").map(
            (val) =>
              FILE_EXTENSIONS_WITH_MIME[
                val as keyof typeof FILE_EXTENSIONS_WITH_MIME
              ],
          );

    const form = new IncomingForm({
      multiples: false,
      keepExtensions: true,
      uploadDir: path.join(process.cwd(), "public", "uploads"),
      filename(name, ext) {
        const fileName = name
          .toLowerCase()
          .toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^\w-]+/g, "");
        const randomUUID = crypto.randomUUID();
        const now = Date.now();
        const fullFileName = `${randomUUID}-${now}-${fileName}${ext}`;
        return fullFileName;
      },
      filter(part) {
        const { mimetype, originalFilename } = part;
        if (!mimetype) return false;

        const fileExt = originalFilename?.split(".").pop()?.toUpperCase();
        if (
          !fileExt ||
          !ALLOWED_FILE_TYPES.includes(
            fileExt as unknown as FILE_EXTENSIONS_TYPE,
          )
        ) {
          throw new Error(
            `Invalid File Type: ${
              fileExt ?? ""
            }. Allowed Files Types are ${ALLOWED_FILE_TYPES.join(",")} `,
          );
        }

        return ALLOWED_MIMES.includes(mimetype);
      },
    });

    const data: File = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve(files.file as File);
      });
    });

    return res.json({
      fileName: data.newFilename,
      fileUrl: `/uploads/${data.newFilename}`,
    });
  } catch (error) {
    let status = 500;
    let message = "Something went wrong";

    if (
      error instanceof Error &&
      error.message.startsWith("Invalid File Type")
    ) {
      status = 400;
      message = error.message;
    }

    return res.status(status).json({ message });
  }
}
