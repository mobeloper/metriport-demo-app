import {
  Sequelize,
  Model,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  ModelStatic,
} from "sequelize";

export class Activity extends Model<
  InferAttributes<Activity>,
  InferCreationAttributes<Activity>
> {
  static NAME: string = "activity";
  id!: string;
  userId!: string;
  value!: string;

  static define(sequelize: Sequelize): ModelStatic<Activity> {
    return sequelize.define<Activity>(this.NAME, {
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
