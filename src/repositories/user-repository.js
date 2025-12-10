import User from "../models/user-model.js";

export const createUser = async (user) => {
  const newUser = await User.create(user);
  return newUser;
};

export const getUserByChatId = async (chatId) => {
  const user = await User.findOne({ chatId });
  return user;
};

export const updateUser = async (chatId, user) => {
  const updatedUser = await User.findOneAndUpdate({ chatId }, user, {
    new: true,
  });
  return updatedUser;
};

export const getAllUsers = async () => {
  const users = await User.find();
  return users;
};

export const deleteUser = async (chatId) => {
  const deletedUser = await User.findOneAndDelete({ chatId });
  return deletedUser;
};
