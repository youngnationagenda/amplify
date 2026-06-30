import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount, useDisconnect, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";

export function ConnectWalletButton() {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect } = useConnect();
  const [showDialog, setShowDialog] = useState(false);

  const connectMetaMask = () => {
    setShowDialog(false);
    connect({ connector: injected({ target: 'metaMask' }) });
  };

  const openWalletConnect = () => {
    setShowDialog(false);
    open();
  };

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="border-[hsl(var(--celo-gold))]/50 text-foreground hover:bg-[hsl(var(--celo-gold))]/10"
          >
            <div className="w-2 h-2 rounded-full bg-[hsl(var(--celo-green))] mr-2" />
            {address.slice(0, 6)}...{address.slice(-4)}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card border-border">
          <DropdownMenuItem onClick={() => open({ view: "Account" })} className="cursor-pointer">
            <Wallet className="w-4 h-4 mr-2" />
            View Wallet
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => disconnect()} className="cursor-pointer text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        className="bg-gradient-to-r from-[hsl(var(--celo-green))] to-[hsl(var(--celo-gold))] text-background hover:opacity-90"
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md bg-[#1a1a2e] border-gray-700 text-white">
          <DialogHeader className="text-center">
            <DialogTitle className="text-center text-xl font-bold text-white">
              Connect Wallet
            </DialogTitle>
            <DialogDescription className="text-center text-gray-400">
              Choose your preferred wallet to connect
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-4">
            {/* WalletConnect option */}
            <button
              onClick={openWalletConnect}
              className="flex items-center gap-3 w-full p-4 rounded-xl bg-[#232340] hover:bg-[#2a2a4a] transition-colors border border-gray-700"
            >
              <div className="w-10 h-10 rounded-full bg-[#3b99fc] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M81.9 176.3c65.6-64.2 171.9-64.2 237.5 0l7.9 7.7c3.3 3.2 3.3 8.4 0 11.6l-27 26.4c-1.6 1.6-4.3 1.6-5.9 0l-10.9-10.6c-45.8-44.8-120-44.8-165.8 0l-11.6 11.4c-1.6 1.6-4.3 1.6-5.9 0l-27-26.4c-3.3-3.2-3.3-8.4 0-11.6l8.7-8.5zm293.4 54.7l24 23.5c3.3 3.2 3.3 8.4 0 11.6l-108.2 105.9c-3.3 3.2-8.6 3.2-11.8 0l-76.8-75.2c-.8-.8-2.1-.8-3 0l-76.8 75.2c-3.3 3.2-8.6 3.2-11.8 0L2.7 266.1c-3.3-3.2-3.3-8.4 0-11.6l24-23.5c3.3-3.2 8.6-3.2 11.8 0l76.8 75.2c.8.8 2.1.8 3 0l76.8-75.2c3.3-3.2 8.6-3.2 11.8 0l76.8 75.2c.8.8 2.1.8 3 0l76.8-75.2c3.3-3.2 8.6-3.2 11.9 0z" fill="white"/>
                </svg>
              </div>
              <span className="text-white font-medium text-lg">WalletConnect</span>
              <span className="ml-auto text-xs font-semibold text-[#22c55e] bg-[#22c55e]/10 px-2 py-1 rounded">
                QR CODE
              </span>
            </button>

            {/* MetaMask option */}
            <button
              onClick={connectMetaMask}
              className="flex items-center gap-3 w-full p-4 rounded-xl bg-[#232340] hover:bg-[#2a2a4a] transition-colors border border-gray-700"
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
                <svg width="24" height="24" viewBox="0 0 318.6 318.6" xmlns="http://www.w3.org/2000/svg">
                  <path d="M274.1 35.5l-99.5 73.9L193 65.8z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M44.4 35.5l98.7 74.6-17.5-44.3zm193.9 171.3l-26.5 40.6 56.7 15.6 16.3-55.3zm-204.4.9l16.2 55.3 56.7-15.6-26.5-40.6z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M103.6 138.2l-15.8 23.9 56.3 2.5-2-60.5zm111.3 0l-39-34.8-1.3 61.2 56.2-2.5zM106.8 247.4l33.8-16.5-29.2-22.8zm71.1-16.5l33.9 16.5-4.7-39.3z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M211.8 247.4l-33.9-16.5 2.7 22.1-.3 9.3zm-105 0l31.5 14.9-.2-9.3 2.5-22.1z" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M138.8 193.5l-28.2-8.3 19.9-9.1zm40.9 0l8.3-17.4 20 9.1z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M106.8 247.4l4.8-40.6-31.3.9zM207 206.8l4.8 40.6 26.5-39.7zm23.8-44.7l-56.2 2.5 5.2 28.9 8.3-17.4 20 9.1zm-120.2 23.1l20-9.1 8.2 17.4 5.3-28.9-56.3-2.5z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M87.8 162.1l23.6 46-.8-22.9zm120.3 23.1l-1 22.9 23.7-46zm-64-20.6l-5.3 28.9 6.6 34.1 1.5-44.9zm30.5 0l-2.7 18 1.2 45 6.7-34.1z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M179.8 193.5l-6.7 34.1 4.8 3.3 29.2-22.8 1-22.9zm-69.2-8.3l.8 22.9 29.2 22.8 4.8-3.3-6.6-34.1z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M180.3 262.3l.3-9.3-2.5-2.2h-37.7l-2.3 2.2.2 9.3-31.5-14.9 11 9 22.3 15.5h38.3l22.4-15.5 11-9z" fill="#C0AD9E" stroke="#C0AD9E" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M177.9 230.9l-4.8-3.3h-27.7l-4.8 3.3-2.5 22.1 2.3-2.2h37.7l2.5 2.2z" fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M278.3 114.2l8.5-40.8-12.7-37.9-96.2 71.4 37 31.3 52.3 15.3 11.6-13.5-5-3.6 8-7.3-6.2-4.8 8-6.1zM31.8 73.4l8.5 40.8-5.4 4 8 6.1-6.1 4.8 8 7.3-5 3.6 11.5 13.5 52.3-15.3 37-31.3-96.2-71.4z" fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M267.2 153.5l-52.3-15.3 15.9 23.9-23.7 46 31.2-.4h46.5zm-163.6-15.3l-52.3 15.3-17.4 54.2h46.4l31.1.4-23.6-46zm71 26.4l3.3-57.7 15.2-41.1h-67.5l15 41.1 3.5 57.7 1.2 18.2.1 44.8h27.7l.2-44.8z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-white font-medium text-lg">MetaMask</span>
              <span className="ml-auto text-xs font-semibold text-orange-400 bg-orange-400/10 px-2 py-1 rounded">
                EXTENSION
              </span>
            </button>

            {/* All Wallets option */}
            <button
              onClick={openWalletConnect}
              className="flex items-center gap-3 w-full p-4 rounded-xl bg-[#232340] hover:bg-[#2a2a4a] transition-colors border border-gray-700"
            >
              <div className="w-10 h-10 rounded-full bg-[#232340] border border-gray-600 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-0.5">
                  <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                  <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                  <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                  <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                </div>
              </div>
              <span className="text-white font-medium text-lg">All Wallets</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
