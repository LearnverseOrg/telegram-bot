import {
  createUser,
  getUserByChatId,
} from "../repositories/user-repository.js";

export const createUserIfNotExists = async (ctx) => {
  if (!ctx.chat.id) {
    console.log("No chat id");
    return;
  }

  const userExists = await getUserByChatId(ctx.chat.id);
  if (userExists) {
    return userExists;
  }

  const user = {
    chatId: ctx.update.message.chat.id,
    firstName: ctx.update.message.from.first_name,
    lastName: ctx.update.message.from.last_name,
    username: ctx.update.message.from.username,
    language_code: ctx.update.message.from.language_code,
  };

  const newUser = await createUser(user);

  return newUser;
};
