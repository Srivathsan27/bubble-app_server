import DataLoader from "dataloader";
import { User } from "../entities/User";

export const createUserLoader = () =>
  new DataLoader<number, User>(async (keys) => {
    const users = await User.findByIds(keys as number[]);
    const userMap: Record<string, User> = {};
    users.forEach((user) => {
      userMap[`${user.id}`] = user;
    });

    return keys.map((key) => userMap[`${key}`]);
  });
