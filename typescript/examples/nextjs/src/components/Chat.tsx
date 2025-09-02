"use client";

import { useCallback, useRef, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MessageList } from "@/components/MessageList";
import { MessageInput } from "@/components/MessageInput";
import { TransactionStatus } from "@/components/TransactionStatus";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useMessageSubmit } from "@/hooks/useMessageSubmit";
import { useAutoSign } from "@/hooks/useAutoSign";
import { Message, AgentMode } from "@/types";

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingBytes, setPendingBytes] = useState<string | null>(null);
    const [openReview, setOpenReview] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);

    const mode = process.env.NEXT_PUBLIC_AGENT_MODE as AgentMode | undefined;

    const {
        connectionState,
        txStatus,
        isSigning,
        signAndExecute,
        resetTxStatus,
    } = useWalletConnection();

    const { submitMessage } = useMessageSubmit({
        mode,
        accountId: connectionState.accountId,
        onMessagesChange: setMessages,
        onPendingBytesChange: setPendingBytes,
        onTxStatusReset: resetTxStatus,
    });

    const focusComposer = useCallback(() => {
        if (typeof window === "undefined") return;
        const doFocus = () => {
            const el = inputRef.current ?? (document.getElementById("agent-composer") as HTMLTextAreaElement | null);
            if (el) {
                el.focus();
                try {
                    const len = el.value.length;
                    el.setSelectionRange(len, len);
                } catch { }
            }
        };
        requestAnimationFrame(() => requestAnimationFrame(doFocus));
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!input.trim()) return;
        
        setError(null);
        setLoading(true);
        setOpenReview(false);
        
        try {
            await submitMessage(input, messages);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
            setInput("");
            focusComposer();
        }
    }, [input, messages, submitMessage, focusComposer]);

    const handleSign = useCallback(async () => {
        if (!pendingBytes) return;
        try {
            const result = await signAndExecute(pendingBytes);
            setMessages(m => [...m, { role: "assistant", content: JSON.stringify(result) }]);
            setPendingBytes(null);
            setOpenReview(false);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }, [pendingBytes, signAndExecute]);

    const handleAccountIdChange = useCallback((_accountId: string) => {
        // This would update the connection state inside the hook
    }, []);

    useAutoSign({
        mode,
        pendingBytes,
        isSigning,
        accountId: connectionState.accountId,
        signAndExecute: handleSign,
        onAccountIdChange: handleAccountIdChange,
        onOpenReview: setOpenReview,
    });

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-base">Agent Chat</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[60vh] pr-4">
                    <MessageList messages={messages} />
                </ScrollArea>

                {error && (
                    <Alert variant="destructive" className="mt-3">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
            <CardFooter>
                <MessageInput
                    ref={inputRef}
                    value={input}
                    onChange={setInput}
                    onSubmit={handleSubmit}
                    disabled={loading}
                />
            </CardFooter>

            <TransactionStatus
                open={openReview}
                onOpenChange={setOpenReview}
                txStatus={txStatus}
                onSign={handleSign}
            />
        </Card>
    );
}


