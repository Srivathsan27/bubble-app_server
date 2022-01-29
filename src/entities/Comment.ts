import { Field, Int, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { Post } from "./Post";
import { User } from "./User";

@ObjectType()
@Entity()
export class Comment extends BaseEntity {
  //Primary Attrubutes
  @Field(() => Int)
  @PrimaryColumn()
  userId!: number;

  @Field(() => Int)
  @PrimaryColumn()
  postId!: number;

  //Comment Attributes

  @Field()
  @Column({ type: "text" })
  text!: string;

  @Field(() => String)
  @CreateDateColumn()
  createdAt!: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt!: Date;

  //Graphql only attributes:

  @Field()
  postTitle!: string;

  @Field()
  isOwnComment!: boolean;

  //Relations
  @Field(() => User)
  @ManyToOne(() => User, (user) => user.comments, { onDelete: "CASCADE" })
  user!: User;

  @ManyToOne(() => Post, (post) => post.comments, { onDelete: "CASCADE" })
  post!: Post;
}
