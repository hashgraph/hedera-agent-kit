import { Plugin } from '@/shared/plugin';
import { Context } from '@/shared/configuration';
import getTopicMessagesQuery, {
  GET_TOPIC_MESSAGES_QUERY_TOOL,
} from '@/plugins/core-consensus-query-plugin/tools/queries/get-topic-messages-query';

export const coreConsensusQueryPlugin: Plugin = {
  name: 'core-consensus-query-plugin',
  version: '1.0.0',
  description: 'A plugin for Hedera Consensus Service queries',
  tools: (context: Context) => {
    return [getTopicMessagesQuery(context)];
  },
};

export const coreConsensusQueryPluginToolNames = {
  GET_TOPIC_MESSAGES_QUERY_TOOL,
} as const;

export default { coreConsensusQueryPlugin, coreConsensusQueryPluginToolNames };
