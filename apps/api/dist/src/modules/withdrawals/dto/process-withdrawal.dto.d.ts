export declare enum WithdrawalAction {
    APPROVE = "approve",
    REJECT = "reject"
}
export declare class ProcessWithdrawalDto {
    action: WithdrawalAction;
    transactionRef?: string;
    rejectReason?: string;
    notes?: string;
}
