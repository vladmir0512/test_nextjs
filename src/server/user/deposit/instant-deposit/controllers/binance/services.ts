import { ClientError } from "@/server/utils/errors";
import crypto from "crypto";
import { type CREATEORDERPAYLOAD } from "./types";

export const BINANCE_CURRENCY = "USDT";

const hashSignature = (apiSecret: string, string: string) =>
  crypto.createHmac("sha512", apiSecret).update(string).digest("hex");

const randomString = () =>
  crypto.randomBytes(32).toString("hex").substring(0, 32);

const BASE_URL = "https://bpay.binanceapi.com";

export enum BINANCEURLS {
  CREATE_ORDER_URL = "/binancepay/openapi/v2/order",
  QUERY_URL = "/binancepay/openapi/v2/order/query",
  WEBHOOK_CERTIFICATE_URL = "/binancepay/openapi/certificates",
}

export const createBinanceRequest = async ({
  method,
  payload,
  path,
  apiKey,
  apiSecret,
}: (
  | {
      path: BINANCEURLS.CREATE_ORDER_URL;
      payload: CREATEORDERPAYLOAD;
    }
  | {
      path: BINANCEURLS.QUERY_URL;
      payload:
        | {
            merchantTradeNo: string;
          }
        | {
            prepayId: string;
          };
    }
  | {
      path: BINANCEURLS.WEBHOOK_CERTIFICATE_URL;
      payload: object;
    }
) & {
  method: "GET" | "POST";
  apiKey: string;
  apiSecret: string;
}) => {
  try {
    const timestamp = Date.now();
    const nonce = randomString();
    const payloadToSign = `${timestamp}\n${nonce}\n${JSON.stringify(
      payload,
    )}\n`;
    const signature = hashSignature(apiSecret, payloadToSign);
    const url = BASE_URL + path;

    const response = await fetch(url, {
      method,
      headers: {
        "content-type": "application/json",
        "BinancePay-Timestamp": String(timestamp),
        "BinancePay-Nonce": nonce,
        "BinancePay-Certificate-SN": apiKey,
        "BinancePay-Signature": signature.toUpperCase(),
      },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as unknown;
    return data;
  } catch (error) {
    const text = error instanceof Error ? error.message : "";
    throw ClientError(`Error in request to binance:${text}`);
  }
};
