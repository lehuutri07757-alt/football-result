export declare enum DepositAction {
    APPROVE = "approve",
    REJECT = "reject"
}
export declare class ProcessDepositDto {
    action: DepositAction;
    rejectReason?: string;
    notes?: string;
}
