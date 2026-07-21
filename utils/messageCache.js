const processedMessages = new Map();

const MESSAGE_TTL_MS = 10 * 60 * 1000;

function cleanOldMessages() {
  const now = Date.now();

  for (const [messageId, timestamp] of processedMessages.entries()) {
    if (now - timestamp > MESSAGE_TTL_MS) {
      processedMessages.delete(messageId);
    }
  }
}

function wasMessageProcessed(messageId) {
  cleanOldMessages();

  return processedMessages.has(messageId);
}

function markMessageAsProcessed(messageId) {
  cleanOldMessages();

  processedMessages.set(messageId, Date.now());
}

module.exports = {
  wasMessageProcessed,
  markMessageAsProcessed,
};