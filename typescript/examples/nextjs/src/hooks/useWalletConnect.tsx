import { useState, useEffect, useCallback } from 'react';
import { ensureWalletConnector, getPairedAccountId, connectWallet, disconnectAllSessions, signAndExecuteBytes } from '@/lib/walletconnect';
import { SignAndExecuteTransactionResult } from '@hashgraph/hedera-wallet-connect';

export interface WalletConnectionState {
    accountId: string;
    isConnected: boolean;
    isPairing: boolean;
}

export type TransactionStatus = "pending" | "confirmed" | null;

export function useWalletConnect() {
    const [connectionState, setConnectionState] = useState<WalletConnectionState>({
        accountId: '',
        isConnected: false,
        isPairing: false,
    });

    const [txStatus, setTxStatus] = useState<TransactionStatus>(null);
    const [isSigning, setIsSigning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Check initial connection state
    useEffect(() => {
        (async () => {
            try {
                const connector = await ensureWalletConnector("warn");
                const isConnected = Boolean((connector as unknown as { signers?: unknown[] }).signers?.length);
                setConnectionState(prev => ({ ...prev, isConnected }));

                if (isConnected) {
                    try {
                        const acct = await getPairedAccountId();
                        setConnectionState(prev => ({ ...prev, accountId: acct }));
                    } catch {
                        // ignore if cannot derive
                    }
                }

                // Session event handlers
                const walletConnectClient = (connector as unknown as { walletConnectClient?: { on: (evt: string, cb: () => void) => void } }).walletConnectClient;

                walletConnectClient?.on('session_update', async () => {
                    setConnectionState(prev => ({ ...prev, isConnected: true }));
                    try {
                        const acct = await getPairedAccountId();
                        setConnectionState(prev => ({ ...prev, accountId: acct }));
                    } catch {
                        setConnectionState(prev => ({ ...prev, accountId: '' }));
                    }
                });

                walletConnectClient?.on('session_delete', () => {
                    setConnectionState({
                        accountId: '',
                        isConnected: false,
                        isPairing: false,
                    });
                });
            } catch {
                // ignore initial connection errors
            }
        })();
    }, []);

    const ensureConnected = useCallback(async (): Promise<string> => {
        if (connectionState.accountId) {
            return connectionState.accountId;
        }

        try {
            const acct = await getPairedAccountId();
            setConnectionState(prev => ({ ...prev, accountId: acct, isConnected: true }));
            return acct;
        } catch {
            setConnectionState(prev => ({ ...prev, isPairing: true }));
            const session = await connectWallet();
            const derived = session?.namespaces?.hedera?.accounts?.[0]?.split(':').pop() ?? '';
            if (!derived) throw new Error('No wallet account available after connecting');

            setConnectionState({
                accountId: derived,
                isConnected: true,
                isPairing: false,
            });
            return derived;
        }
    }, [connectionState.accountId]);

    const connect = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            await connectWallet();
            setConnectionState(prev => ({ ...prev, isConnected: true }));
            try {
                const acct = await getPairedAccountId();
                setConnectionState(prev => ({ ...prev, accountId: acct }));
            } catch {
                setConnectionState(prev => ({ ...prev, accountId: '' }));
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, []);

    const disconnect = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            await disconnectAllSessions();
            setConnectionState({
                accountId: '',
                isConnected: false,
                isPairing: false,
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, []);

    const signAndExecute = useCallback(async (pendingBytes: string): Promise<SignAndExecuteTransactionResult> => {
        if (!pendingBytes) throw new Error('No bytes to sign');

        setTxStatus('pending');
        setIsSigning(true);

        try {
            await ensureWalletConnector('warn');
            const accountId = await ensureConnected();

            const bytes = typeof window === 'undefined'
                ? Buffer.from(pendingBytes, 'base64')
                : Uint8Array.from(atob(pendingBytes), c => c.charCodeAt(0));

            const result = await signAndExecuteBytes({ bytes, accountId });
            setTxStatus('confirmed');
            return result;
        } catch (error) {
            setTxStatus(null);
            throw error;
        } finally {
            setIsSigning(false);
        }
    }, [ensureConnected]);

    const resetTxStatus = useCallback(() => {
        setTxStatus(null);
    }, []);

    const resetError = useCallback(() => {
        setError(null);
    }, []);

    return {
        // State
        connectionState,
        txStatus,
        isSigning,
        loading,
        error,

        // Actions
        connect,
        disconnect,
        ensureConnected,
        signAndExecute,
        resetTxStatus,
        resetError,
    };
}


