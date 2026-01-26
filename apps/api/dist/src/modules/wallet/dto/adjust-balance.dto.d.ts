export declare enum BalanceType {
    REAL = "real",
    BONUS = "bonus"
}
export declare enum AdjustmentType {
    ADD = "add",
    SUBTRACT = "subtract"
}
export declare class AdjustBalanceDto {
    amount: number;
    balanceType: BalanceType;
    adjustmentType: AdjustmentType;
    description?: string;
}
