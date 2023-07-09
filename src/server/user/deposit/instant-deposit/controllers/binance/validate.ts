import {
  array,
  discriminatedUnion,
  literal,
  number,
  object,
  string,
  union,
} from "zod";

const queryOrderResponse = discriminatedUnion("status", [
  object({
    status: literal("FAIL"),
    errorMessage: string(),
  }),
  object({
    status: literal("SUCCESS"),
    data: object({
      merchantId: number(),
      createTime: number(),
      prepayId: string(),
      merchantTradeNo: string(),
      currency: string(),
      orderAmount: string(),
      status: union([
        literal("INITIAL"),
        literal("PENDING"),
        literal("PAID"),
        literal("CANCELED"),
        literal("ERROR"),
        literal("REFUNDING"),
        literal("REFUNDED"),
        literal("EXPIRED"),
      ]),
    }),
  }),
]).and(
  object({
    code: string(),
  }),
);

const createOrderResponse = discriminatedUnion("status", [
  object({
    status: literal("FAIL"),
    errorMessage: string(),
  }),
  object({
    status: literal("SUCCESS"),
    data: object({
      prepayId: string(),
      terminalType: string(),
      expireTime: number(),
      qrcodeLink: string(),
      qrContent: string(),
      checkoutUrl: string(),
      deeplink: string(),
      universalUrl: string(),
      totalFee: string(),
      currency: string(),
    }),
  }),
]).and(
  object({
    code: string(),
  }),
);

const webhookBodyValidator = object({
  bizType: literal("PAY"),
  data: string(),
  bizIdStr: string(),
  bizId: number(),
  bizStatus: literal("PAY_CLOSED"),
});

const webhookDataValidator = object({
  merchantTradeNo: string(),
  productType: string(),
  productName: string(),
  transactTime: number(),
  tradeType: string(),
  totalFee: number(),
  currency: string(),
  commission: number(),
});

const webhookCertificateResponse = discriminatedUnion("status", [
  object({
    status: literal("SUCCESS"),
    data: array(
      object({
        certPublic: string(),
        certSerial: string(),
      }),
    ),
  }),
  object({
    status: literal("FAIL"),
    errorMessage: string(),
  }),
]).and(
  object({
    code: string(),
  }),
);

const binanceVerify = {
  queryOrderResponse,
  createOrderResponse,
  webhookBodyValidator,
  webhookDataValidator,
  webhookCertificateResponse,
};

export default binanceVerify;
