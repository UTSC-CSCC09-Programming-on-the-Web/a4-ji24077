"use strict";

const { Sequelize } = require("sequelize");
const path = require("path");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "../database.sqlite"),
  logging: false,
});

const User = require("./user")(sequelize);
const Image = require("./image")(sequelize);
const Comment = require("./comment")(sequelize);

// Set up associations
User.hasMany(Image, { foreignKey: "userId" });
Image.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Comment, { foreignKey: "userId" });
Comment.belongsTo(User, { foreignKey: "userId" });

Image.hasMany(Comment, { foreignKey: "imageId" });
Comment.belongsTo(Image, { foreignKey: "imageId" });

module.exports = {
  sequelize,
  User,
  Image,
  Comment,
};
