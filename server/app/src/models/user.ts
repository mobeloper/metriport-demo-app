import {
  Sequelize,
  Model,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  ModelStatic,
} from "sequelize";

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  static NAME: string = "user";
  id!: string;
  metriportUserId!: string;

  static define(sequelize: Sequelize): ModelStatic<User> {
    return sequelize.define<User>(this.NAME, {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
      metriportUserId: {
        type: DataTypes.UUID,
      },
    });
  }
}
