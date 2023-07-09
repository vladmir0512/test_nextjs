import { prisma } from "@/server/db";
import Deposit from "@/server/services/Deposit";
import InstantDepositMethod, {
  type BinanceConfig,
} from "@/server/services/InstantDepositMethod";
import {
  BINANCEURLS,
  BINANCE_CURRENCY,
  createBinanceRequest,
} from "@/server/user/deposit/instant-deposit/controllers/binance/services";
import binanceVerify from "@/server/user/deposit/instant-deposit/controllers/binance/validate";
import { ClientError } from "@/server/utils/errors";
import { type InstantDepositMethod_UniqueId } from "@prisma/client";
import crypto from "crypto";
import { type NextApiRequest, type NextApiResponse } from "next";
import { object, string } from "zod";

export const config = {
  api: {
    bodyParser: false,
  },
};

const headerValidator = object({
  "binancepay-certificate-sn": string(),
  "binancepay-nonce": string(),
  "binancepay-signature": string(),
  "binancepay-timestamp": string(),
});

async function buffer(readable: Readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    if (req.method !== "POST")
      return res
        .status(500)
        .json({ message: "Invalid request but listening to binance webhook" });

    const buf = await buffer(req);
    const rawBody = buf.toString("utf8");

    console.log("binance here");

    const headers = headerValidator.parse(req.headers);
    const body = binanceVerify.webhookBodyValidator.parse(JSON.parse(rawBody));
    const bodyData = binanceVerify.webhookDataValidator.parse(
      JSON.parse(body.data),
    );

    const reqBody = {
      ...body,
      data: bodyData,
    };

    const uniqueId: InstantDepositMethod_UniqueId = "binance";
    const method = await InstantDepositMethod.getInstanceByUniqueId(uniqueId);
    const BinanceConfig = method.getConfig<BinanceConfig>("binance");
    const { API_KEY, SECRET_KEY } = BinanceConfig;

    const certData = await createBinanceRequest({
      apiKey: API_KEY,
      apiSecret: SECRET_KEY,
      method: "POST",
      path: BINANCEURLS.WEBHOOK_CERTIFICATE_URL,
      payload: {},
    });

    const certValidatedData =
      binanceVerify.webhookCertificateResponse.parse(certData);
    if (certValidatedData.status === "FAIL") {
      throw ClientError(certValidatedData.errorMessage);
    }

    const certPublic = certValidatedData.data[0]?.certPublic;
    if (!certPublic) throw ClientError("Unable to get public key");

    const timestamp = headers["binancepay-timestamp"];
    const nonce = headers["binancepay-nonce"];
    const signature = headers["binancepay-signature"];
    const payload = `${timestamp}\n${nonce}\n${rawBody}\n`;

    const decodedSignature = Buffer.from(signature, "base64");

    // Convert the public key string to a PublicKey object
    const publicKey = crypto.createPublicKey({
      key: certPublic,
      format: "pem",
      type: "spki",
    });

    // Create a Verify object with the 'sha256WithRSAEncryption' algorithm
    const verify = crypto.createVerify("sha256WithRSAEncryption");
    verify.update(payload);

    // Verify the signature
    const isSignatureValid = verify.verify(publicKey, decodedSignature);
    console.log("isSignatureValid:->", isSignatureValid);

    if (!isSignatureValid) throw ClientError("Invalid Signature");

    const {
      data: { currency, merchantTradeNo, totalFee },
    } = reqBody;

    const deposit = await Deposit.getInstance(merchantTradeNo);
    const { transactionId, status, amount } = deposit.row;

    // check for amount
    if (Number(amount) !== Number(totalFee))
      throw new Error("Transaction amount not matching");

    // check for currency
    if (BINANCE_CURRENCY.toLowerCase() !== currency.toLowerCase())
      throw new Error("Payment failed invalid currency");

    const response = await createBinanceRequest({
      apiKey: API_KEY,
      apiSecret: SECRET_KEY,
      method: "POST",
      path: BINANCEURLS.QUERY_URL,
      payload: {
        merchantTradeNo: transactionId,
      },
    });
    const queryData = binanceVerify.queryOrderResponse.parse(response);

    if (status === "pending" && queryData.status === "SUCCESS") {
      if (queryData.data.status === "PAID") {
        // update db status
        await prisma.$transaction([
          prisma.deposit.update({
            where: {
              transactionId,
            },
            data: {
              status: "credit",
            },
          }),
          prisma.transaction.update({
            where: {
              id: transactionId,
            },
            data: {
              status: "credit",
            },
          }),
        ]);
      } else {
        // update db status
        await prisma.$transaction([
          prisma.deposit.update({
            where: {
              transactionId,
            },
            data: {
              status: "failed",
            },
          }),
          prisma.transaction.update({
            where: {
              id: transactionId,
            },
            data: {
              status: "failed",
            },
          }),
        ]);
      }
    }

    res.send({ returnCode: "SUCCESS", returnMessage: null });
    return undefined;
  } catch (error) {
    console.log(error);
    const text = error instanceof Error ? error.message : "";
    return res.status(500).send(`Something went wrong: ${text}`);
  }
}
