import { Field, ObjectType } from "type-graphql";
import { Post } from "../entities/Post";
import { PostError } from "./PostError";

@ObjectType()
export class PostResponse {
  @Field({ nullable: true })
  post?: Post;

  @Field({ nullable: true })
  errors?: PostError;
}
