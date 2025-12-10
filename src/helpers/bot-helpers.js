export const isBot = (ctx) => {
  return ctx.update.message.from.is_bot;
};

export const isPrivateChat = (ctx) => {
  return ctx.update.message.chat.type === "private";
};
