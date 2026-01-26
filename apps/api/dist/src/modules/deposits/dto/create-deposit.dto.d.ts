export declare enum PaymentMethod {
    BANK_TRANSFER = "bank_transfer",
    E_WALLET = "e_wallet",
    CRYPTO = "crypto"
}
export declare class CreateDepositDto {
    amount: number;
    paymentMethod: PaymentMethod;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    transferContent?: string;
    proofImageUrl?: string;
    notes?: string;
}
