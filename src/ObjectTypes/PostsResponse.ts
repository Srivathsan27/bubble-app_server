import { Field, ObjectType } from "type-graphql";
import { Post } from "../entities/Post";
import { PostError } from "./PostError";

@ObjectType()
export class PostsResponse {
  @Field(() => [Post], { nullable: true })
  posts?: Post[];

  @Field()
  hasMorePosts!: boolean;
}
