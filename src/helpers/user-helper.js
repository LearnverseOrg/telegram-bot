import {
  createUser,
  getUserByChatId,
} from "../repositories/user-repository.js";

export const createUserIfNotExists = async (ctx) => {
  if (!ctx.chat?.id) {
    console.log("No chat id");
    return;
  }

  const userExists = await getUserByChatId(ctx.chat.id);
  if (userExists) {
    return userExists;
  }

  const user = {
    chatId: ctx.chat?.id,
    firstName: ctx.from?.first_name || "",
    lastName: ctx.from?.last_name || "",
    username: ctx.from?.username || "",
    language_code: ctx.from?.language_code || "",
  };

  const newUser = await createUser(user);

  return newUser;
};
