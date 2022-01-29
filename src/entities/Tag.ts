import {
  BaseEntity,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
export class Tag extends BaseEntity {
  @PrimaryColumn()
  userId!: number;

  @PrimaryColumn()
  friendId!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.tags)
  friend!: User;

  @ManyToOne(() => User, (user) => user.tags)
  user!: User;
}
