import {
  Sequelize,
  Model,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  ModelStatic,
} from "sequelize";

export class ExampleModel extends Model<
  InferAttributes<ExampleModel>,
  InferCreationAttributes<ExampleModel>
> {
  static NAME: string = "example_model";
  id!: string;
  userId!: string;
  value!: number;

  static define(sequelize: Sequelize): ModelStatic<ExampleModel> {
    return sequelize.define<ExampleModel>(this.NAME, {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
      value: {
        type: DataTypes.INTEGER,
      },
    });
  }
}
