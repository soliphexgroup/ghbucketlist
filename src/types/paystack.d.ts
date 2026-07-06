export type PaystackTransaction = {
  reference: string;
  status: string;
  message: string;
  trans: string;
  transaction: string;
  trxref: string;
};

export type PaystackCustomField = {
  display_name: string;
  variable_name: string;
  value: string;
};

export type PaystackNewTransactionOptions = {
  key: string;
  email: string;
  amount: number;
  currency?: string;
  ref?: string;
  metadata?: {
    custom_fields?: PaystackCustomField[];
    [key: string]: unknown;
  };
  onSuccess?: (transaction: PaystackTransaction) => void;
  onCancel?: () => void;
  onError?: (error: { message: string }) => void;
};

declare class PaystackPopInstance {
  newTransaction(options: PaystackNewTransactionOptions): void;
}

declare global {
  interface Window {
    PaystackPop?: {
      new (): PaystackPopInstance;
    };
  }
}
