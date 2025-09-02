import { useCallback } from 'react';
import { API_ENDPOINTS } from '@/lib/constants';
import { Message, AgentMode, WalletPrepareResponse, AgentResponse } from '@/types';

interface UseMessageSubmitProps {
    mode: AgentMode | undefined;
    accountId: string;
    onMessagesChange: (updateFn: (messages: Message[]) => Message[]) => void;
    onPendingBytesChange: (bytes: string | null) => void;
    onTxStatusReset: () => void;
}

export function useMessageSubmit({
    mode,
    accountId,
    onMessagesChange,
    onPendingBytesChange,
    onTxStatusReset,
}: UseMessageSubmitProps) {
    const submitMessage = useCallback(async (input: string, messages: Message[]) => {
        onTxStatusReset();
        onPendingBytesChange(null);

        const nextMessages = [...messages, { role: "user" as const, content: input }];
        onMessagesChange(() => nextMessages);

        if (mode === "human") {
            const res = await fetch(API_ENDPOINTS.WALLET_PREPARE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    input,
                    accountId: accountId || undefined,
                    messages: nextMessages
                }),
            });

            const json: WalletPrepareResponse = await res.json();
            if (!res.ok || !json.ok) throw new Error(json.error || "Request failed");

            if (json.bytesBase64) {
                onPendingBytesChange(json.bytesBase64);
                onMessagesChange(m => [...m, { role: "assistant", content: "Transaction requires signature." }]);
            } else {
                const text = json.result || "";
                onMessagesChange(m => [...m, { role: "assistant", content: text }]);
            }
        } else {
            const res = await fetch(API_ENDPOINTS.AGENT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ input, messages: nextMessages }),
            });

            const json: AgentResponse = await res.json();
            if (!res.ok || !json.ok) throw new Error(json.error || "Request failed");

            const text = json.result;
            onMessagesChange(m => [...m, { role: "assistant", content: text }]);
        }
    }, [mode, accountId, onMessagesChange, onPendingBytesChange, onTxStatusReset]);

    return { submitMessage };
}