export const isBot = (ctx) => {
  return ctx.update?.message?.from?.is_bot;
};

export const isPrivateChat = (ctx) => {
  return ctx.update?.message?.chat?.type === "private";
};

export const checkIfNewUser = (ctx) => {
  return ctx.update?.message?.new_chat_participant;
};

export const checkGroupChat = (ctx) => {
  return ctx.update?.message?.chat?.type === "group";
};
