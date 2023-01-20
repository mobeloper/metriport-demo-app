import {
  Sequelize,
  Model,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  ModelStatic,
} from "sequelize";

export class Nutrition extends Model<
  InferAttributes<Nutrition>,
  InferCreationAttributes<Nutrition>
> {
  static NAME: string = "nutrition";
  id!: string;
  userId!: string;
  value!: string;

  static define(sequelize: Sequelize): ModelStatic<Nutrition> {
    return sequelize.define<Nutrition>(this.NAME, {
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
