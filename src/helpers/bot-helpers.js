export const isBot = (ctx) => {
  return ctx.from?.is_bot;
};

export const isPrivateChat = (ctx) => {
  return ctx.chat?.type === "private";
};

export const checkIfNewUser = (ctx) => {
  return ctx.message?.new_chat_participant;
};

export const checkGroupChat = (ctx) => {
  return ctx.chat?.type === "group" || ctx.chat?.type === "supergroup";
};
