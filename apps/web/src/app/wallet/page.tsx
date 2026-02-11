"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  MoreHorizontal,
  ChevronRight,
  ArrowLeft,
  Smartphone,
  Banknote,
  Bitcoin,
  Loader2,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useLanguageStore } from "@/stores/language.store";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  walletService,
  Transaction,
  TransactionType,
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_STATUS_LABELS,
  isPositiveTransaction,
} from "@/services/wallet.service";
import { depositService, PaymentMethod } from "@/services/deposit.service";
import { withdrawalService } from "@/services/withdrawal.service";
import { formatRelativeTime } from "@/lib/date";

const TRANSACTION_ICONS: Record<
  string,
  { icon: typeof Trophy; color: string }
> = {
  [TransactionType.DEPOSIT]: {
    icon: ArrowDownLeft,
    color:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
  },
  [TransactionType.WITHDRAWAL]: {
    icon: ArrowUpRight,
    color:
      "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
  },
  [TransactionType.BET_PLACED]: {
    icon: Banknote,
    color: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
  },
  [TransactionType.BET_WON]: {
    icon: Trophy,
    color:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
  },
  [TransactionType.BET_REFUND]: {
    icon: RefreshCw,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  },
  [TransactionType.BONUS]: {
    icon: CreditCard,
    color:
      "bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400",
  },
  [TransactionType.TRANSFER]: {
    icon: ArrowUpRight,
    color:
      "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
  },
  [TransactionType.ADJUSTMENT]: {
    icon: Banknote,
    color: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400",
  },
};

export default function WalletPage() {
  const router = useRouter();
  const [activeAction, setActiveAction] = useState<
    "deposit" | "withdraw" | null
  >(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Deposit form state
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState<PaymentMethod>(
    PaymentMethod.BANK_TRANSFER,
  );
  const [depositBankName, setDepositBankName] = useState("");
  const [depositAccountNumber, setDepositAccountNumber] = useState("");
  const [depositAccountName, setDepositAccountName] = useState("");
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [depositError, setDepositError] = useState("");

  // Withdrawal form state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawBankName, setWithdrawBankName] = useState("");
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState("");
  const [withdrawAccountName, setWithdrawAccountName] = useState("");
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");

  const resetDepositForm = () => {
    setDepositAmount("");
    setDepositBankName("");
    setDepositAccountNumber("");
    setDepositAccountName("");
    setDepositError("");
    setDepositSuccess(false);
  };

  const resetWithdrawForm = () => {
    setWithdrawAmount("");
    setWithdrawBankName("");
    setWithdrawAccountNumber("");
    setWithdrawAccountName("");
    setWithdrawError("");
    setWithdrawSuccess(false);
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount < 10000) {
      setDepositError("Minimum deposit is 10,000");
      return;
    }
    if (
      depositMethod === PaymentMethod.BANK_TRANSFER &&
      (!depositBankName || !depositAccountNumber || !depositAccountName)
    ) {
      setDepositError("Please fill in all bank details");
      return;
    }
    setDepositSubmitting(true);
    setDepositError("");
    try {
      await depositService.create({
        amount,
        paymentMethod: depositMethod,
        bankName: depositBankName || undefined,
        accountNumber: depositAccountNumber || undefined,
        accountName: depositAccountName || undefined,
      });
      setDepositSuccess(true);
      resetDepositForm();
      setDepositSuccess(true);
      fetchTransactions(1, false);
    } catch (err: any) {
      setDepositError(
        err?.response?.data?.message || "Failed to create deposit",
      );
    } finally {
      setDepositSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 50000) {
      setWithdrawError("Minimum withdrawal is 50,000");
      return;
    }
    if (amount > balance) {
      setWithdrawError("Insufficient balance");
      return;
    }
    if (!withdrawBankName || !withdrawAccountNumber || !withdrawAccountName) {
      setWithdrawError("Please fill in all bank details");
      return;
    }
    setWithdrawSubmitting(true);
    setWithdrawError("");
    try {
      await withdrawalService.create({
        amount,
        bankName: withdrawBankName,
        accountNumber: withdrawAccountNumber,
        accountName: withdrawAccountName,
      });
      setWithdrawSuccess(true);
      resetWithdrawForm();
      setWithdrawSuccess(true);
      fetchTransactions(1, false);
      // Refresh user data to get updated balance
      checkAuth();
    } catch (err: any) {
      setWithdrawError(
        err?.response?.data?.message || "Failed to create withdrawal",
      );
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const language = useLanguageStore((s) => s.language);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) router.push("/");
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions();
    }
  }, [isAuthenticated]);

  const fetchTransactions = async (
    pageNum: number = 1,
    append: boolean = false,
  ) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await walletService.getMyHistory({
        page: pageNum,
        limit: 10,
      });

      if (append) {
        setTransactions((prev) => [...prev, ...response.data]);
      } else {
        setTransactions(response.data);
      }

      setPage(pageNum);
      setHasMore(pageNum < response.meta.totalPages);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchTransactions(page + 1, true);
    }
  };

  const balance = user?.wallet?.realBalance ?? 0;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const getTransactionIcon = (type: string) => {
    const config =
      TRANSACTION_ICONS[type] || TRANSACTION_ICONS[TransactionType.ADJUSTMENT];
    return config;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium hidden sm:inline-block">Back</span>
            </Link>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              My Wallet
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle className="h-9 w-9 border-0 bg-gray-100 hover:bg-gray-200 dark:bg-slate-900 dark:hover:bg-slate-800" />
            <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
              {(user?.username?.[0] || "U").toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-lg px-4 py-8">
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-white shadow-2xl shadow-emerald-500/30 transition-transform hover:scale-[1.01]">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-black/10 blur-3xl"></div>

          <div className="relative z-10 flex flex-col justify-between h-40">
            <div className="flex items-center justify-between">
              <span className="font-medium text-emerald-50">Total Balance</span>
              <Wallet className="opacity-80" />
            </div>

            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-1">
                {formatCurrency(balance)}
              </h2>
              <p className="text-sm text-emerald-100 opacity-80">
                **** **** **** 8888
              </p>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium opacity-90">
                {user?.username || "Member"}
              </span>
              <div className="flex gap-1">
                <div className="h-3 w-3 rounded-full bg-white/80"></div>
                <div className="h-3 w-3 rounded-full bg-white/50"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => setActiveAction("deposit")}
            className={`flex flex-col items-center gap-2 group ${activeAction === "deposit" ? "text-emerald-600 dark:text-emerald-500" : "text-gray-600 dark:text-slate-400"}`}
          >
            <div
              className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all shadow-sm group-hover:scale-105 ${activeAction === "deposit" ? "bg-emerald-500 text-white shadow-emerald-500/30" : "bg-white text-emerald-600 dark:bg-slate-900 dark:text-emerald-500"}`}
            >
              <ArrowDownLeft size={24} />
            </div>
            <span className="text-xs font-semibold">Deposit</span>
          </button>

          <button
            onClick={() => setActiveAction("withdraw")}
            className={`flex flex-col items-center gap-2 group ${activeAction === "withdraw" ? "text-blue-600 dark:text-blue-500" : "text-gray-600 dark:text-slate-400"}`}
          >
            <div
              className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all shadow-sm group-hover:scale-105 ${activeAction === "withdraw" ? "bg-blue-500 text-white shadow-blue-500/30" : "bg-white text-blue-600 dark:bg-slate-900 dark:text-blue-500"}`}
            >
              <ArrowUpRight size={24} />
            </div>
            <span className="text-xs font-semibold">Withdraw</span>
          </button>

          <button className="flex flex-col items-center gap-2 text-gray-600 dark:text-slate-400 group">
            <div className="h-14 w-14 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-orange-500 shadow-sm transition-all group-hover:scale-105">
              <CreditCard size={24} />
            </div>
            <span className="text-xs font-semibold">Cards</span>
          </button>

          <button className="flex flex-col items-center gap-2 text-gray-600 dark:text-slate-400 group">
            <div className="h-14 w-14 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-purple-500 shadow-sm transition-all group-hover:scale-105">
              <MoreHorizontal size={24} />
            </div>
            <span className="text-xs font-semibold">More</span>
          </button>
        </div>

        {activeAction && (
          <div className="mb-8 p-6 rounded-3xl bg-white dark:bg-slate-900 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white capitalize">
                {activeAction}
              </h3>
              <button
                onClick={() => {
                  setActiveAction(null);
                  resetDepositForm();
                  resetWithdrawForm();
                }}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>

            {activeAction === "deposit" ? (
              <div className="space-y-4">
                {depositSuccess ? (
                  <div className="text-center py-6">
                    <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
                      <ArrowDownLeft size={28} />
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white mb-1">
                      Deposit Request Submitted!
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      Your request is pending admin approval.
                    </p>
                    <button
                      onClick={() => {
                        setDepositSuccess(false);
                      }}
                      className="mt-4 px-6 py-2 bg-emerald-500 text-white text-sm font-bold rounded-full hover:bg-emerald-600"
                    >
                      New Deposit
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                        Payment Method
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() =>
                            setDepositMethod(PaymentMethod.BANK_TRANSFER)
                          }
                          className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-colors ${
                            depositMethod === PaymentMethod.BANK_TRANSFER
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30"
                              : "border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400"
                          }`}
                        >
                          <Banknote size={16} /> Bank Transfer
                        </button>
                        <button
                          onClick={() =>
                            setDepositMethod(PaymentMethod.E_WALLET)
                          }
                          className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-colors ${
                            depositMethod === PaymentMethod.E_WALLET
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30"
                              : "border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400"
                          }`}
                        >
                          <Smartphone size={16} /> E-Wallet
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                        Amount
                      </label>
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="Min 10,000"
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    {depositMethod === PaymentMethod.BANK_TRANSFER && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                            Bank Name
                          </label>
                          <input
                            type="text"
                            value={depositBankName}
                            onChange={(e) => setDepositBankName(e.target.value)}
                            placeholder="e.g. Vietcombank"
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                            Account Number
                          </label>
                          <input
                            type="text"
                            value={depositAccountNumber}
                            onChange={(e) =>
                              setDepositAccountNumber(e.target.value)
                            }
                            placeholder="Your account number"
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                            Account Name
                          </label>
                          <input
                            type="text"
                            value={depositAccountName}
                            onChange={(e) =>
                              setDepositAccountName(e.target.value)
                            }
                            placeholder="NGUYEN VAN A"
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          />
                        </div>
                      </>
                    )}
                    {depositError && (
                      <p className="text-sm text-red-500 font-medium">
                        {depositError}
                      </p>
                    )}
                    <button
                      onClick={handleDeposit}
                      disabled={depositSubmitting}
                      className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {depositSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <ArrowDownLeft size={18} />
                      )}
                      {depositSubmitting
                        ? "Submitting..."
                        : "Submit Deposit Request"}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {withdrawSuccess ? (
                  <div className="text-center py-6">
                    <div className="mx-auto h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
                      <ArrowUpRight size={28} />
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white mb-1">
                      Withdrawal Request Submitted!
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      Your request is pending admin approval.
                    </p>
                    <button
                      onClick={() => {
                        setWithdrawSuccess(false);
                      }}
                      className="mt-4 px-6 py-2 bg-blue-500 text-white text-sm font-bold rounded-full hover:bg-blue-600"
                    >
                      New Withdrawal
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                        Amount
                      </label>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Min 50,000"
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                        Available: {formatCurrency(balance)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={withdrawBankName}
                        onChange={(e) => setWithdrawBankName(e.target.value)}
                        placeholder="e.g. Vietcombank"
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={withdrawAccountNumber}
                        onChange={(e) =>
                          setWithdrawAccountNumber(e.target.value)
                        }
                        placeholder="Your account number"
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                        Account Name
                      </label>
                      <input
                        type="text"
                        value={withdrawAccountName}
                        onChange={(e) => setWithdrawAccountName(e.target.value)}
                        placeholder="NGUYEN VAN A"
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    {withdrawError && (
                      <p className="text-sm text-red-500 font-medium">
                        {withdrawError}
                      </p>
                    )}
                    <button
                      onClick={handleWithdraw}
                      disabled={withdrawSubmitting}
                      className="w-full py-3.5 rounded-2xl bg-blue-500 text-white font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {withdrawSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <ArrowUpRight size={18} />
                      )}
                      {withdrawSubmitting
                        ? "Submitting..."
                        : "Submit Withdrawal Request"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              Recent Transactions
            </h3>
            <button
              onClick={() => fetchTransactions(1, false)}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 flex items-center gap-1"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-600 mb-3" />
              <p className="text-gray-500 dark:text-slate-400">
                No transactions yet
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {transactions.map((tx) => {
                  const iconConfig = getTransactionIcon(tx.type);
                  const IconComponent = iconConfig.icon;
                  const isPositive = isPositiveTransaction(tx.type);

                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow dark:bg-slate-900 dark:shadow-none dark:border dark:border-slate-800"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-12 w-12 rounded-2xl flex items-center justify-center ${iconConfig.color}`}
                        >
                          <IconComponent size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">
                            {TRANSACTION_TYPE_LABELS[tx.type] || tx.type}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-slate-400">
                            {formatRelativeTime(tx.createdAt, language)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-bold ${isPositive ? "text-emerald-600 dark:text-emerald-500" : "text-gray-900 dark:text-white"}`}
                        >
                          {isPositive ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </div>
                        <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mt-0.5">
                          {TRANSACTION_STATUS_LABELS[tx.status] || tx.status}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full mt-6 py-3 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                >
                  {loadingMore ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <ChevronDown size={18} />
                      Load More
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
