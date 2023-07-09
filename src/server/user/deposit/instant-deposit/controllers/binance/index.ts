import { prisma } from "@/server/db";
import type InstantDepositMethod from "@/server/services/InstantDepositMethod";
import { type BinanceConfig } from "@/server/services/InstantDepositMethod";
import { type UserContext } from "@/server/trpc";
import { ClientError } from "@/server/utils/errors";
import { addSeconds } from "date-fns";
import {
  BINANCEURLS,
  BINANCE_CURRENCY,
  createBinanceRequest,
} from "./services";
import binanceVerify from "./validate";

const createBinanceTxn = async ({
  ctx,
  amount,
  method,
}: {
  ctx: UserContext;
  amount: number;
  method: InstantDepositMethod;
}) => {
  const { user } = ctx;
  const { userId } = user.row;

  const { name: gatewayName } = method.row;
  const charge = method.calcCharge(amount);
  const netAmount = amount + charge;
  const status = "pending";
  const category = "deposit";
  const description = `deposit - ${gatewayName}`;

  const BinanceConfig = method.getConfig<BinanceConfig>("binance");
  const { API_KEY, SECRET_KEY, CALLBACK_URL, CANCEL_URL, SUCCESS_URL } =
    BinanceConfig;

  return prisma.$transaction(async (prismaTx) => {
    // create transaction
    const transaction = await prismaTx.transaction.create({
      data: {
        userId,
        amount: netAmount,
        charge,
        netAmount: amount,
        category,
        status,
        description,
      },
    });
    const transactionId = transaction.id;

    // create deposit
    await prismaTx.deposit.create({
      data: {
        transactionId,
        userId,
        amount: netAmount,
        charge,
        netAmount: amount,
        status,
        chargeType: method.row.chargeType,
        method: {
          logo: method.row.logo,
          name: method.row.name,
        },
        type: "instant",
      },
    });

    const response = await createBinanceRequest({
      apiKey: API_KEY,
      apiSecret: SECRET_KEY,
      method: "POST",
      path: BINANCEURLS.CREATE_ORDER_URL,
      payload: {
        currency: BINANCE_CURRENCY,
        env: {
          terminalType: "WEB",
        },
        goods: {
          goodsType: "01",
          goodsCategory: "D000",
          referenceGoodsId: "7876763A3B",
          goodsName: "Ice Cream",
          goodsDetail: "Greentea ice cream cone",
        },
        merchantTradeNo: transactionId,
        orderAmount: netAmount,
        cancelUrl: CANCEL_URL,
        returnUrl: SUCCESS_URL,
        webhookUrl: CALLBACK_URL,
        orderExpireTime: addSeconds(new Date(), 20).getTime(),
      },
    });
    const data = binanceVerify.createOrderResponse.parse(response);

    if (data.status === "FAIL") {
      throw ClientError(data.errorMessage);
    }

    const url = data.data.checkoutUrl;
    return { url };
  });
};

export default createBinanceTxn;
