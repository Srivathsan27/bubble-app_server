import { Field, ObjectType } from "type-graphql";
import { FieldError } from "./FieldError";

@ObjectType()
export class BooleanResponse {
  @Field(() => Boolean, { nullable: true })
  status?: boolean;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}
