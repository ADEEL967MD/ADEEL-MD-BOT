'use strict';

const config = require('../config');

function isAlwaysOnline(client) {
  const uc = client && client.userConfig;
  if (uc && (uc.ALWAYS_ONLINE === 'true' || uc.ALWAYS_ONLINE === true)) return true;
  if (uc && (uc.ALWAYS_ONLINE === 'false' || uc.ALWAYS_ONLINE === false)) return false;
  return config.ALWAYS_ONLINE === 'true';
}

function isAutoTyping(client) {
  const uc = client && client.userConfig;
  if (uc && uc.AUTO_TYPING != null) return uc.AUTO_TYPING === 'true' || uc.AUTO_TYPING === true;
  return config.AUTO_TYPING === 'true';
}

function isAutoRecording(client) {
  const uc = client && client.userConfig;
  if (uc && uc.AUTO_RECORDING != null) return uc.AUTO_RECORDING === 'true' || uc.AUTO_RECORDING === true;
  return config.AUTO_RECORDING === 'true';
}

async function PresenceControl(client, presence) {
  if (!client) return;

  if (isAlwaysOnline(client)) {
    client.sendPresenceUpdate('available').catch(() => {});
    return;
  }

  client.sendPresenceUpdate('unavailable').catch(() => {});
}

function BotActivityFilter(bot) {
  if (!bot) return bot;
  if (bot.__adeelPresenceWrapped) return bot;
  bot.__adeelPresenceWrapped = true;

  const originalSendMessage = bot.sendMessage.bind(bot);
  const originalSendPresenceUpdate = bot.sendPresenceUpdate.bind(bot);

  bot.sendMessage = async function wrappedSendMessage(...args) {
    const result = await originalSendMessage(...args);

    if (isAlwaysOnline(bot)) return result;

    if (!isAutoTyping(bot) && !isAutoRecording(bot)) {
      originalSendPresenceUpdate('unavailable').catch(() => {});
    }

    return result;
  };

  bot.sendPresenceUpdate = async function wrappedSendPresenceUpdate(type, ...rest) {
    if (isAlwaysOnline(bot)) {
      return originalSendPresenceUpdate(type, ...rest);
    }

    if (type === 'available') {
      return originalSendPresenceUpdate('unavailable', ...rest);
    }
    return originalSendPresenceUpdate(type, ...rest);
  };

  if (!isAlwaysOnline(bot)) {
    originalSendPresenceUpdate('unavailable').catch(() => {});
  }

  return bot;
}

module.exports = {
  PresenceControl,
  BotActivityFilter,
  isAlwaysOnline,
};
