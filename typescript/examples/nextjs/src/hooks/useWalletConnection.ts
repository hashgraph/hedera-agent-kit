import { useCallback, useState } from 'react';
import { signAndExecuteBytes, getPairedAccountId, connectWallet, ensureWalletConnector } from '@/lib/walletconnect';
import { WalletConnectionState, SignResult, TransactionStatus } from '@/types';

export function useWalletConnection() {
    const [connectionState, setConnectionState] = useState<WalletConnectionState>({
        accountId: '',
        isConnected: false,
        isPairing: false,
    });

    const [txStatus, setTxStatus] = useState<TransactionStatus>(null);
    const [isSigning, setIsSigning] = useState(false);

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

    const signAndExecute = useCallback(async (pendingBytes: string): Promise<SignResult> => {
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

    return {
        connectionState,
        txStatus,
        isSigning,
        ensureConnected,
        signAndExecute,
        resetTxStatus,
    };
}