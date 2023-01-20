import {
  Sequelize,
  Model,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  ModelStatic,
} from "sequelize";

export class Biometrics extends Model<
  InferAttributes<Biometrics>,
  InferCreationAttributes<Biometrics>
> {
  static NAME: string = "biometrics";
  id!: string;
  userId!: string;
  value!: string;

  static define(sequelize: Sequelize): ModelStatic<Biometrics> {
    return sequelize.define<Biometrics>(this.NAME, {
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
