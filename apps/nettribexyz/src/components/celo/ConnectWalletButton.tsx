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

function MetaMaskIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 35 33"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M32.958 1L19.514 11.218l2.49-5.89L32.958 1z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.025 1l13.32 10.313-2.367-5.985L2.025 1zM28.15 23.535l-3.574 5.474 7.649 2.106 2.194-7.44-6.268-.14zM.563 23.675l2.182 7.44 7.649-2.106-3.574-5.474-6.257.14z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.94 14.422l-2.13 3.218 7.59.343-.27-8.148-5.19 4.587zM25.043 14.422l-5.26-4.682-.181 8.243 7.578-.343-2.137-3.218zM10.394 29.009l4.564-2.234-3.942-3.08-.622 5.314zM20.025 26.775l4.575 2.234-.633-5.314-3.942 3.08z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M24.6 29.009l-4.575-2.234.367 2.998-.04 1.264 4.248-2.028zM10.394 29.009l4.248 2.028-.028-1.264.355-2.998-4.575 2.234z" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.712 22.158l-3.804-1.12 2.686-1.229 1.118 2.349zM20.271 22.158l1.118-2.349 2.698 1.23-3.816 1.12z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.394 29.009l.645-5.474-4.219.14 3.574 5.334zM23.955 23.535l.645 5.474 3.574-5.334-4.219-.14zM27.18 17.64l-7.578.343.704 3.875 1.118-2.349 2.698 1.23 3.058-3.1zM10.908 21.039l2.698-1.23 1.106 2.35.716-3.876-7.59-.343 3.07 3.1z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.838 17.64l3.175 6.19-.106-3.09-3.07-3.1zM24.122 21.039l-.118 3.09 3.175-6.19-3.057 3.1zM15.428 17.983l-.716 3.876.9 4.646.2-6.122-.384-2.4zM19.602 17.983l-.372 2.388.188 6.134.9-4.646-.716-3.876z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20.318 21.858l-.9 4.646.645.45 3.942-3.08.118-3.09-3.805 1.074zM10.908 21.039l.106 3.09 3.942 3.08.645-.45-.9-4.646-3.793-1.074z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20.389 31.037l.04-1.264-.345-.296h-5.186l-.333.296.028 1.264-4.248-2.028 1.485 1.217 3.01 2.087h5.268l3.022-2.087 1.485-1.217-4.226 2.028z" fill="#C0AD9E" stroke="#C0AD9E" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20.025 26.775l-.645-.45h-3.777l-.645.45-.355 2.998.333-.296h5.186l.345.296-.442-2.998z" fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M33.517 11.838l1.14-5.502L32.958 1l-12.933 9.589 4.976 4.21 7.03 2.052 1.55-1.811-.674-.486 1.072-.976-.82-.633 1.072-.82-.71-.457zM.326 6.336l1.152 5.502-.736.457 1.072.82-.808.633 1.072.976-.674.486 1.538 1.811 7.03-2.052 4.976-4.21L2.025 1 .326 6.336z" fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M32.031 17.35l-7.03-2.053 2.137 3.218-3.175 6.19 4.184-.053h6.268l-2.384-7.302zM9.94 15.297l-7.03 2.052-2.347 7.302h6.257l4.172.052-3.175-6.19 2.124-3.217zM19.602 17.983l.449-7.779 2.04-5.521H12.978l2.029 5.521.46 7.779.176 2.412.012 6.11h3.777l.012-6.11.158-2.412z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

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
