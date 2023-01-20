import {
  Sequelize,
  Model,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  ModelStatic,
} from "sequelize";

export class Body extends Model<
  InferAttributes<Body>,
  InferCreationAttributes<Body>
> {
  static NAME: string = "body";
  id!: string;
  userId!: string;
  value!: string;

  static define(sequelize: Sequelize): ModelStatic<Body> {
    return sequelize.define<Body>(this.NAME, {
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
