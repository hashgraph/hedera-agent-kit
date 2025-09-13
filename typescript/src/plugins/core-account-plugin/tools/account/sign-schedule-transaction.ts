import { z } from 'zod';
import type { Context } from '@/shared/configuration';
import type { Tool } from '@/shared/tools';
import { Client, Status } from '@hashgraph/sdk';
import { handleTransaction, RawTransactionResponse } from '@/shared/strategies/tx-mode-strategy';
import HederaBuilder from '@/shared/hedera-utils/hedera-builder';
import { signScheduleTransactionParameters } from '@/shared/parameter-schemas/account.zod';
import HederaParameterNormaliser from '@/shared/hedera-utils/hedera-parameter-normaliser';
import { PromptGenerator } from '@/shared/utils/prompt-generator';

const signScheduleTransactionPrompt = (context: Context = {}) => {
  const contextSnippet = PromptGenerator.getContextSnippet(context);
  const usageInstructions = PromptGenerator.getParameterUsageInstructions();

  return `
${contextSnippet}

This tool will sign a scheduled transaction and return the transaction ID.

Parameters:
- scheduleId (string, required): The ID of the scheduled transaction to sign
${usageInstructions}
`;
};

const postProcess = (response: RawTransactionResponse) => {
  return `Transaction successfully signed. Transaction ID: ${response.transactionId}`;
};

const signScheduleTransaction = async (
  client: Client,
  context: Context,
  params: z.infer<ReturnType<typeof signScheduleTransactionParameters>>,
) => {
  try {
    const tx = HederaBuilder.signScheduleTransaction(params);
    const result = await handleTransaction(tx, client, context, postProcess);
    return result;
  } catch (error) {
    console.error('Error signing scheduled transaction', error);
    const errorDescription: string = 'Failed to sign scheduled transaction'
    const message = error instanceof Error ? errorDescription + ':' + error.message : 'Failed to sign scheduled transaction';

    return {
      raw: {
        status: Status.InvalidTransaction,
      },
      humanMessage: message,
    };
  }
};

export const SIGN_SCHEDULE_TRANSACTION_TOOL = 'sign_schedule_transaction_tool';

const tool = (context: Context): Tool => ({
  method: SIGN_SCHEDULE_TRANSACTION_TOOL,
  name: 'Sign Scheduled Transaction',
  description: signScheduleTransactionPrompt(context),
  parameters: signScheduleTransactionParameters(context),
  execute: signScheduleTransaction,
});

export default tool;
