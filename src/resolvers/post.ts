import {
  Arg,
  Ctx,
  FieldResolver,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { Post } from "../entities/Post";
import { MyContext } from "../types/MyContext";
import { PostInput } from "../InputTypes/PostInput";
import { PostResponse } from "../ObjectTypes/PostResponse";
import { PostsResponse } from "../ObjectTypes/PostsResponse";
import { BooleanResponse } from "../ObjectTypes/BooleanResponse";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
import { Hit } from "../entities/Hit";
import { CommentResponse } from "../ObjectTypes/CommentResponse";
import { Comment } from "../entities/Comment";

@Resolver(() => Post)
export class PostResolver {
  @FieldResolver()
  contentSnip(@Root() post: Post) {
    if (post.content.length > 80) {
      return post.content.substring(0, 80);
    }
    return post.content;
  }

  @FieldResolver()
  creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(post.creatorId);
  }

  @FieldResolver()
  async comments(@Root() post: Post) {
    let comments = await Comment.find({ where: { postId: post.id } });
    return comments;
  }

  @FieldResolver()
  isOwnPost(@Root() post: Post, @Ctx() { req }: MyContext) {
    if (req.session.userId) {
      return req.session.userId === post.creatorId;
    } else {
      return false;
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async hitPost(
    @Ctx() { req }: MyContext,
    @Arg("post", () => Int) postId: number,
    @Arg("value", () => Int) hitValue: number
  ): Promise<boolean> {
    let value = [0, 1, -1].includes(hitValue) ? hitValue : 0;
    const { userId } = req.session;

    const hit = await Hit.findOne({ where: { postId, userId } });

    if (hit) {
      let updateValue: number;
      await getConnection().transaction(async (tm) => {
        if (hit.hitValue === value) {
          updateValue = -value;
          await tm.query(
            `delete from hit where "userId" = ${userId} and "postId" = ${postId};`
          );
        } else {
          updateValue = 2 * value;
          await tm.query(
            `update hit set "hitValue" = ${value} where "userId" = ${userId} and "postId" = ${postId};`
          );
        }

        await tm.query(
          `update post set "numberOfHits" = "numberOfHits" + ${updateValue} where id = ${postId};`
        );
      });
    } else {
      getConnection().transaction(async (tm) => {
        try {
          await tm.query(
            `insert into hit("userId", "postId", "hitValue") values (${userId}, ${postId}, ${value});`
          );
          await tm.query(
            `update post set "numberOfHits" = "numberOfHits" + ${value} where id = ${postId};`
          );
        } catch (err) {
          console.log("error: ", err);
        }
      });
    }

    // await getConnection().query(`
    // start transaction;

    // insert into hit("userId", "postId", "hitValue") values (${userId}, ${postId}, ${value});

    // update post set "numberOfHits" = "numberOfHits" + ${value} where id = ${postId};

    // commit;

    // `);

    return true;
  }

  @Query(() => PostsResponse)
  async posts(
    @Arg("limit") limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string,
    @Ctx() { req }: MyContext
  ): Promise<PostsResponse> {
    let cur = new Date();
    if (cursor) {
      cur = new Date(+cursor);
    }
    const realLimit = Math.min(50, limit);
    const testLimit = realLimit + 1;

    const { userId } = req.session;

    const posts: any[] = await getConnection().query(
      `
      select 
        p.* 
        ,(select "hitValue" from hit h where h."userId" = $3  and h."postId" = p.id) "hitStatus"
        ,(select count(*) from comment c where c."postId" = p.id ) "numberOfComments"
      from post p
      where p."createdAt" < $1
      order by p."createdAt" DESC
      limit $2
    `,
      [cur, testLimit, userId]
    );

    return {
      hasMorePosts: posts.length === testLimit,
      posts: posts.slice(0, realLimit).map((post) => ({
        ...post,
        hitStatus: [-1, 1].includes(post.hitStatus) ? post.hitStatus : 0,
      })),
    };
  }

  @Query(() => PostsResponse)
  @UseMiddleware(isAuth)
  async myPosts(
    @Ctx() { req }: MyContext,
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string
  ): Promise<PostsResponse> {
    let cur = new Date();
    if (cursor) {
      cur = new Date(+cursor);
    }
    const { userId } = req.session;

    const posts: any[] = await getConnection().query(
      `
        select p.*
        ,(select "hitValue" from hit h where h."userId" = $3 and h."postId" = p.id) "hitStatus"
        ,(select count(*) from comment c where c."postId" = p.id ) "numberOfComments"
        from post p
        where p."creatorId" = $3 and p."createdAt" < $2
        order by p."createdAt" DESC
        limit $1
    `,
      [limit + 1, cur, userId]
    );

    return {
      hasMorePosts: posts.length === limit + 1,
      posts: posts.slice(0, limit).map((post) => ({
        ...post,
        hitStatus: [-1, 1].includes(post.hitStatus) ? post.hitStatus : 0,
      })),
    };
  }

  @Query(() => PostsResponse)
  @UseMiddleware(isAuth)
  async userPosts(
    @Arg("id", () => Int!) id: number,
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string
  ): Promise<PostsResponse> {
    let cur = new Date();
    if (cursor) {
      cur = new Date(+cursor);
    }

    const posts: any[] = await getConnection().query(
      `
        select p.*
        ,(select "hitValue" from hit h where h."userId" = $3 and h."postId" = p.id) "hitStatus"
        ,(select count(*) from comment c where c."postId" = p.id ) "numberOfComments"
        from post p
        where p."creatorId" = $3 and p."createdAt" < $2
        order by p."createdAt" DESC
        limit $1
    `,
      [limit + 1, cur, id]
    );

    return {
      hasMorePosts: posts.length === limit + 1,
      posts: posts.slice(0, limit).map((post) => ({
        ...post,
        hitStatus: [-1, 1].includes(post.hitStatus) ? post.hitStatus : 0,
      })),
    };
  }

  @Query(() => PostResponse)
  @UseMiddleware(isAuth)
  async post(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<PostResponse> {
    const { userId } = req.session;
    try {
      const post = await getConnection().query(
        `
        select 
          p.*  
          ,(select "hitValue" from hit h where h."userId" = $2  and h."postId" = p.id) "hitStatus"
        from post p
        where p.id = $1

    `,
        [id, userId]
      );
      if (post === []) {
        return {
          errors: {
            field: "id",
            message: "the post with the given id does not exist!",
          },
        };
      } else {
        return {
          post: {
            ...post[0],
            hitStatus: [-1, 1].includes(post[0].hitStatus)
              ? post[0].hitStatus
              : 0,
            isOwnPost: userId === post[0].creatorId,
          },
        };
      }
    } catch (err) {
      return {
        errors: {
          field: "id",
          message: "the post with the given id could not be found!",
        },
      };
    }
  }

  @Mutation(() => PostResponse)
  @UseMiddleware(isAuth)
  async newPost(
    @Ctx() { req }: MyContext,
    @Arg("input", () => PostInput) input: PostInput
  ): Promise<PostResponse> {
    let post: Post;
    try {
      post = await Post.create({
        title: input.title,
        content: input.content,
        creatorId: req.session.userId,
      }).save();
    } catch (error) {
      console.log(error);
      return {
        errors: {
          field: "Post",
          message: "Could not create post",
        },
      };
    }

    return { post };
  }

  @Mutation(() => PostResponse)
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("input", () => PostInput) input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<PostResponse> {
    const post = await Post.findOne(id);

    if (!post) {
      return {
        errors: {
          field: "ID",
          message: "The Post Does Not Exist!",
        },
      };
    }

    if (req.session.userId !== post.creatorId) {
      return {
        errors: {
          field: "user",
          message: "User not Authorized!",
        },
      };
    }

    post.title = input.title;
    post.content = input.content;

    await Post.update({ id }, { title: input.title, content: input.content });

    return {
      post: post,
    };
  }

  // @Mutation(() => BooleanResponse)
  // async deleteAllPosts(): Promise<BooleanResponse> {
  //   try {
  //     await Post.delete({});
  //   } catch (err) {
  //     console.log(err);
  //     return {
  //       errors: [
  //         {
  //           field: "dg",
  //           message: "gd",
  //         },
  //       ],
  //     };
  //   }
  //   return {
  //     status: true,
  //   };
  // }
  @Mutation(() => BooleanResponse)
  @UseMiddleware(isAuth)
  async delete(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<BooleanResponse> {
    const post = await Post.findOne(id);
    if (!post) {
      return {
        errors: [
          {
            field: "id",
            message: "the post does not exist!",
          },
        ],
      };
    }

    if (post.creatorId !== req.session.userId) {
      return {
        errors: [
          {
            field: "user",
            message: "The user is not authorized!",
          },
        ],
      };
    }

    try {
      await Post.delete(id);
    } catch (err) {
      console.log(err);
      return {
        errors: [
          {
            field: "server",
            message: "Server error, Could not delete post!",
          },
        ],
      };
    }

    return {
      status: true,
    };
  }

  @Mutation(() => CommentResponse)
  @UseMiddleware(isAuth)
  async addComment(
    @Ctx() { req }: MyContext,
    @Arg("comment") comment: string,
    @Arg("post", () => Int) postId: number
  ): Promise<CommentResponse> {
    try {
      const com = await Comment.findOne({
        where: {
          postId: postId,
          userId: req.session.userId,
        },
      });
      if (com) {
        return {
          error: {
            field: "comment",
            message: "User has already commented!",
          },
        };
      }
      const createdComment = await Comment.create({
        postId,
        userId: req.session.userId,
        text: comment,
      }).save();
      // createdComment.postId
      return {
        comment: createdComment,
      };
    } catch (err) {
      console.log(err);
      return {
        error: {
          field: "postId",
          message: "The post does not exist!",
        },
      };
    }
  }
}
