import WalletPanel from "@/components/wallet/WalletPanel";

const InvestorWalletPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold mb-1">Wallet & DeFi</h2>
        <p className="text-sm text-muted-foreground">
          Manage your tokens, swap via Ubeswap pools, view LP positions, and access lending/borrowing.
        </p>
      </div>
      <WalletPanel />
    </div>
  );
};

export default InvestorWalletPage;
