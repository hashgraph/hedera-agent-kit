"use client";

import { useWalletConnect } from "@/hooks/useWalletConnect";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Variant = "panel" | "compact";

export default function WalletConnectPanel({ variant = "panel" }: { variant?: Variant }) {
    const {
        connectionState,
        loading,
        error,
        connect,
        disconnect
    } = useWalletConnect();

    if (variant === "compact") {
        return (
            <div className="flex items-center gap-2">
                {connectionState.isConnected ? (
                    <>
                        <Badge variant="secondary" className="text-xs">{connectionState.accountId || "—"}</Badge>
                        <Button variant="outline" size="sm" onClick={disconnect} disabled={loading}>Disconnect</Button>
                    </>
                ) : (
                    <Button size="sm" onClick={connect} disabled={loading}>Connect</Button>
                )}
                {error && <span className="text-xs text-red-600">{error}</span>}
            </div>
        );
    }

    return (
        <div className="w-full max-w-xl border rounded p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-sm">WalletConnect</span>
                {connectionState.isConnected ? (
                    <button className="text-sm underline" onClick={disconnect} disabled={loading}>Disconnect</button>
                ) : (
                    <button className="text-sm underline" onClick={connect} disabled={loading}>Connect</button>
                )}
            </div>
            <div className="text-xs text-gray-600">Account: {connectionState.accountId || "—"}</div>
            {error && <div className="text-xs text-red-600">{error}</div>}
        </div>
    );
}


