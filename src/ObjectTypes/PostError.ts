import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class PostError {
  @Field()
  field!: string;

  @Field()
  message!: string;
}
