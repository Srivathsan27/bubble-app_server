import { Cookie } from "express-session";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
import { Comment } from "../entities/Comment";
import { Post } from "../entities/Post";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types/MyContext";

@Resolver(() => Comment)
export class CommentResolver {
  @FieldResolver()
  user(@Root() comment: Comment, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(comment.userId);
  }

  @FieldResolver()
  async postTitle(
    @Root() comment: Comment,
    @Ctx() { postTitleLoader }: MyContext
  ) {
    return postTitleLoader.load(comment.postId);
  }

  @FieldResolver()
  isOwnComment(@Root() comment: Comment, @Ctx() { req }: MyContext): boolean {
    if (req.session.userId) {
      return req.session.userId === comment.userId;
    }
    return false;
  }

  @Query(() => [Comment])
  async comments(): Promise<Comment[]> {
    return await Comment.find({});
  }

  @Query(() => [Comment])
  @UseMiddleware(isAuth)
  async myComments(@Ctx() { req }: MyContext): Promise<Comment[]> {
    return await Comment.find({ where: { userId: req.session.userId } });
  }

  @Query(() => [Comment])
  @UseMiddleware(isAuth)
  async userComments(
    @Arg("id", () => Int!) userId: number
  ): Promise<Comment[]> {
    return await Comment.find({ where: { userId } });
  }

  // Mutations:
  @Mutation(() => String)
  @UseMiddleware(isAuth)
  async updateComment(
    @Ctx() { req }: MyContext,
    @Arg("post", () => Int) postId: number,
    @Arg("text") text: string
  ): Promise<string> {
    try {
      await Comment.update({ postId, userId: req.session.userId }, { text });
    } catch (err) {
      console.log(err);
      return "an error occurred!";
    }
    return text;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteComment(
    @Ctx() { req }: MyContext,
    @Arg("post", () => Int) postId: number
  ): Promise<boolean> {
    try {
      await Comment.delete({ postId, userId: req.session.userId });
    } catch (err) {
      return false;
    }
    return true;
  }
}
