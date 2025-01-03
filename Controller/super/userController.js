const { Validator } = require("node-input-validator");
const User = require("../../models/Users");
const helper = require("../../helpers/helper");
const UserLoggedFormation = require("../../models/userLoggedFormation");

module.exports = {
  create: async (req, res) => {
    try {
      let v = new Validator(req.body, {
        fullName: "required",
        userName: "required",
        password: "required",
        credit: "required",
        whitelabel_url: "required",
        active_channel_no: "required",
      });

      let errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) {
        return helper.error(res, errorsResponse);
      }

      let checkUsername = await User.findOne({ userName: v.inputs.userName });

      if (checkUsername) {
        return helper.error(res, "Username is already registered");
      }

      req.body.password = await helper.passwordEncrypt(req.body.password);
      await User.create(req.body)
        .then(() => {
          return helper.success(res, "Super User Created Successfully.", {});
        })
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      return helper.error(res, error);
    }
  },

  getAll: async (req, res) => {
    try {
      let userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const skipIndex = (page - 1) * limit;
      const query = {
        _id: { $ne: userId },
        parentId: req.params.id,
        isDeleted: false,
      };

      const sort = { createdAt: -1 };

      const users = await User.find(query)
        .sort(sort)
        .skip(skipIndex)
        .limit(limit)
        .exec();

      const allData = await Promise.all(
        users?.map(async (item) => {
          item = item.toJSON();
          let getUser = await User.findOne(
            {
              parentId: item?._id,
              // roleType: item?.roleType - 1,
            },
            { fullName: -1 }
          );
          item.childData = getUser;

          // Fetch the last login information
          let lastLogin = await UserLoggedFormation.findOne(
            { userId: item._id },
            {},
            { sort: { createdAt: -1 } }
          );

          if (lastLogin) {
            item.lastLogin = lastLogin.createdAt || null;
            item.ip = lastLogin.ip || null;
            item.deviceId = lastLogin.deviceId || null;
          } else {
            // Handle the case where no login information is found for the user
            item.lastLogin = null;
            item.ip = null;
            item.deviceId = null;
          }
          return item;
        })
      );

      const totalUsers = await User.countDocuments(query);
      return helper.success(res, "Listing Successfully.", {
        data: allData,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: page,
      });
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  get: (req, res) => {
    User.findOne({ _id: req.params.id })
      .then((response) => {
        if (!response) {
          return helper.error(res, "No data available");
        }
        return helper.success(res, "Listing Successfully.", response);
      })
      .catch((error) => {
        return helper.error(res, error);
      });
  },
};
