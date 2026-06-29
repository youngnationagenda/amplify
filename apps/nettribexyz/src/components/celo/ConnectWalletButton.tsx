import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ConnectWalletButton() {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

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
    <Button
      onClick={() => open()}
      className="bg-gradient-to-r from-[hsl(var(--celo-green))] to-[hsl(var(--celo-gold))] text-background hover:opacity-90"
    >
      <Wallet className="w-4 h-4 mr-2" />
      Connect Wallet
    </Button>
  );
}
