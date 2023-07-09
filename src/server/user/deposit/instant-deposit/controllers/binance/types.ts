export type CREATEORDERPAYLOAD = {
  env: {
    terminalType: "WEB";
  };
  merchantTradeNo: string;
  orderAmount: number;
  currency: string;
  webhookUrl: string;
  cancelUrl: string;
  returnUrl: string;
  goods: {
    goodsType: string;
    goodsCategory: string;
    referenceGoodsId: string;
    goodsName: string;
    goodsDetail: string;
  };
  orderExpireTime?: number;
};

export type BINANCEQUERYORDERRESPONSE = (
  | {
      status: "FAIL";
    }
  | {
      status: "SUCCESS";
      data?: {
        merchantId: number;
        prepayId: string;
        merchantTradeNo: string;
        currency: string;
        orderAmount: string;
        createTime: number;
        status:
          | "INITIAL"
          | "PENDING"
          | "PAID"
          | "CANCELED"
          | "ERROR"
          | "REFUNDING"
          | "REFUNDED"
          | "EXPIRED";
      };
    }
) & {
  code: string;
  errorMessage: string;
};

export type BINANCECREATEORDERRESPONSE = (
  | {
      status: "FAIL";
    }
  | {
      status: "SUCCESS";
      data: {
        prepayId: string;
        terminalType: string;
        expireTime: number;
        qrcodeLink: string;
        qrContent: string;
        checkoutUrl: string;
        deeplink: string;
        universalUrl: string;
        totalFee: string;
        currency: string;
      };
    }
) & { code: string; errorMessage: string };
