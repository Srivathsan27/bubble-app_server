import { Field, ObjectType } from "type-graphql";
import { FieldError } from "./FieldError";

@ObjectType()
export class TaggedUser {
  @Field()
  id!: number;

  @Field()
  username!: string;

  @Field()
  isTagged!: boolean;

  @Field()
  isOwnAccount!: boolean;
}

@ObjectType()
export class TaggedResponse {
  @Field(() => [TaggedUser], { nullable: true })
  taggedUsers?: TaggedUser[];

  @Field(() => FieldError, { nullable: true })
  error?: FieldError;
}
