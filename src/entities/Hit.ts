import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Post } from "./Post";
import { User } from "./User";

@Entity()
export class Hit extends BaseEntity {
  @PrimaryColumn({ type: "int" })
  userId!: number;

  @PrimaryColumn({ type: "int" })
  postId!: number;

  @ManyToOne(() => User, (user) => user.hits, { onDelete: "CASCADE" })
  user!: User;

  @ManyToOne(() => Post, (post) => post.hits, { onDelete: "CASCADE" })
  post!: Post;

  @Column({ type: "int", default: 0 })
  hitValue!: number;
}
