const Favorite = require("../models/favorite");
const User = require("../models/user");
const CustomError = require("../util/custom-error");
const { USER } = require("../util/constants");

async function favorite({ user, favorited }) {
  let fav = await Favorite.find({
    user,
    favorited,
  });

  // The user is unfavoriting this user
  if (fav) {
    return await Favorite.deleteOne({
      user,
      favorited,
    });
  }

  // Check if user exists and is a professional
  const toFav = await User.findById(favorited);
  if (
    !toFav ||
    (toFav.accountType && toFav.accountType === USER.ACCOUNT_TYPES.PATIENT)
  ) {
    throw new CustomError("no professional by that id found");
  }

  return await Favorite.create({
    user,
    favorited,
  });
}

async function get({ user, favorited = undefined }) {
  if (favorited) {
    return await Favorite.findOne({
      user,
      favorited,
    });
  }

  return await Favorite.find({
    user,
  });
}

module.exports = {
  favorite,
  get,
};
