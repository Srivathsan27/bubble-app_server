import DataLoader from "dataloader";
import { title } from "process";
import { getConnection } from "typeorm";

export const createPostTitleLoader = () =>
  new DataLoader<number, string>(async (postIds) => {
    let query = "";

    for (let i = 1; i < postIds.length; i++) {
      query += "or id=$" + (i + 1) + " ";
    }

    const res = (await getConnection().query(
      ` select id,title from post where id=$1 ${query};`,
      [...postIds]
    )) as any[];

    const titleMap: Record<string, string> = {};
    res.forEach((item) => {
      titleMap[`${item.id}`] = item.title;
    });

    return postIds.map((id) => titleMap[`${id}`]);
  });
