import { config } from '../config/env.js';

export const getVapiConfig = () => {
  return {
    publicKey: config.vapiApiKey || 'mock_vapi_public_key',
    assistantId: config.vapiAssistantId || 'mock_vapi_assistant_id',
    isMock: !config.vapiApiKey,
  };
};

export const handleVapiWebhook = async (payload) => {
  console.log('[Vapi Webhook Event Received]:', payload.message?.type || payload.type);
  return { success: true };
};
