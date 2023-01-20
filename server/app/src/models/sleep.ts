import {
  Sequelize,
  Model,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  ModelStatic,
} from "sequelize";

export class Sleep extends Model<
  InferAttributes<Sleep>,
  InferCreationAttributes<Sleep>
> {
  static NAME: string = "sleep";
  id!: string;
  userId!: string;
  value!: string;

  static define(sequelize: Sequelize): ModelStatic<Sleep> {
    return sequelize.define<Sleep>(this.NAME, {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
      value: {
        type: DataTypes.JSONB,
      },
    });
  }
}
