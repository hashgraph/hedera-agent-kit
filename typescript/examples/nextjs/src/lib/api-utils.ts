import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createLLMFromEnv } from '@/lib/llm';
import { createAgentBootstrap, createToolkitConfiguration, createHederaClient } from '@/lib/agent';
import { HederaLangchainToolkit } from 'hedera-agent-kit';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { Message } from '@/types';

export const RequestSchema = z.object({
    input: z.string().min(1),
    messages: z
        .array(
            z.object({
                role: z.enum(['user', 'assistant']),
                content: z.string(),
            }),
        )
        .optional(),
});

export const PrepareSchema = RequestSchema.extend({
    accountId: z.string().optional(),
});

export function createErrorResponse(message: string, status = 400): NextResponse {
    return NextResponse.json({ ok: false, error: message }, { status });
}

export function createSuccessResponse<T>(data: T): NextResponse {
    return NextResponse.json({ ok: true, ...data });
}

export function transformMessagesToHistory(messages: Message[]): (HumanMessage | AIMessage)[] {
    return messages.map(m =>
        m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content),
    );
}

export function initializeLLM() {
    try {
        return createLLMFromEnv();
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Invalid AI provider configuration';
        throw new Error(message);
    }
}

export function createHederaAgentSetup(bootstrap?: ReturnType<typeof createAgentBootstrap>, accountId?: string) {
    const agentBootstrap = bootstrap || createAgentBootstrap();
    const client = createHederaClient(agentBootstrap);
    const configuration = accountId 
        ? {
            ...createToolkitConfiguration(agentBootstrap),
            context: {
                ...agentBootstrap.context,
                accountId: accountId,
            },
        }
        : createToolkitConfiguration(agentBootstrap);
    
    const hederaToolkit = new HederaLangchainToolkit({ client, configuration });
    const tools = hederaToolkit.getTools();
    
    return { bootstrap: agentBootstrap, client, configuration, tools };
}

export function createChatPrompt(systemMessage: string) {
    return ChatPromptTemplate.fromMessages([
        ['system', systemMessage],
        new MessagesPlaceholder('history'),
        ['human', '{input}'],
        ['placeholder', '{agent_scratchpad}'],
    ]);
}

export function createAgentExecutorWithPrompt(
    llm: ReturnType<typeof createLLMFromEnv>,
    tools: ReturnType<HederaLangchainToolkit['getTools']>,
    prompt: ChatPromptTemplate,
    returnIntermediateSteps = false
) {
    const agent = createToolCallingAgent({ llm, tools, prompt });
    return new AgentExecutor({ agent, tools, returnIntermediateSteps });
}

export function extractResultFromResponse(response: unknown): string {
    if (typeof response === 'object' && response !== null && 'output' in response) {
        const output = (response as { output: unknown }).output;
        return typeof output === 'string' ? output : (output as { text?: string })?.[0]?.text || '';
    }
    return '';
}