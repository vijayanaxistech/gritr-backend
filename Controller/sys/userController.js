const { Validator } = require("node-input-validator");
const User = require("../../models/Users");
const helper = require("../../helpers/helper");
let Role = require("../../models/Roles");
const creditCash = require("../../models/creditcash");

const {
  TYPE_SYSTEM_ADMIN,
  TYPE_SUPER_ADMIN,
  TYPE_SUB_ADMIN,
  TYPE_MASTER,
  TYPE_CLIENT,
  TYPE_1_Month,
  TYPE_2_Month,
  TYPE_3_Month,
} = require("../../config/constants");

module.exports = {
  create: async (req, res) => {
    try {
      let v = new Validator(req.body, {
        fullName: "required",
        userName: "required",
        // password: "required",
        //credit: "required",
        // whitelabel_url: "required",
        // active_channel_no: "required",
        roleType: "required",
      });

      let errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) {
        return helper.error(res, errorsResponse);
      }

      let userList = await User.findOne({ _id: req.user.id });   
      let balCalculation = userList.available_balance ? userList.available_balance : userList.credit;
      const creditValid = await helper.validateCredit(req.body.credit, balCalculation);      
      if (creditValid !== true) {
          return helper.error(res, "Invalid credit amount or insufficient balance.");
      }

      let userData = req.body;
      userData.parentId = req.user.id;
      userData.masterIds = [req.user.id];

      await populateMasterIds(req.user.id, userData.masterIds);

      // Fetch the role details based on roleType
      let role = await Role.findOne({ roleType: req.body.roleType });

      if (!role) {
        return helper.error(res, "Invalid role type");
      }

      let userDataCredit;      

      userDataCredit = await module.exports.getUserDataCredit(req.body.accountType, userData);

      if (userData.id) {
        let userToUpdate = await User.findById(userData.id);
        if (!userToUpdate) {
          return helper.error(res, "User not found");
        }

        // Update the user's fields
        userToUpdate.fullName = userData.fullName;        
        userToUpdate.credit = userDataCredit;
        userToUpdate.whitelabel_url = userData.whitelabel_url;
        userToUpdate.active_channel_no = userData.active_channel_no;
        let updatedUser = await userToUpdate.save();

        return helper.success(res, "User updated successfully.", updatedUser);
      } else {
        if (!req.body.password) {
          throw "Password is required";
        }
        // Create new user
        let checkUsername = await User.findOne({ userName: userData.userName });
        if (checkUsername) {
          return helper.error(res, "Username is already registered");
        }

        userData.password = await helper.passwordEncrypt(userData.password);
        userData.role = role._id; // Assign the role object ID

        let newUser = await User.create(userData);   

        await module.exports.manageCreditDebitTransaction(res,req.user.id, newUser._id, userDataCredit);

        newUser.available_balance = userDataCredit;
        await newUser.save(); 

        return helper.success(res, "User created successfully.", newUser);
      }
    } catch (error) {
      return helper.error(res, error);
    }
  },

  getUserDataCredit:async(accountType, userData)=> {
    switch(accountType) {
        case TYPE_1_Month:
            return 1;
        case TYPE_2_Month:
            return 2;
        case TYPE_3_Month:
            return 3;
        default:
            return userData.credit;
    }   
  },


  manageCreditDebitTransaction : async (res, senderId, receiverId, credit) => {
    const user = await User.findById(senderId);    
    if (!user) {
      return helper.error(res, "User not found");
    }
  
    const balCalculation = user.available_balance ? user.available_balance : user.credit;
    const newBalance = balCalculation - credit;

    console.log('credit',credit);
    console.log('balCalculation',balCalculation);

    console.log('newBalance',newBalance);
  
    let creditCashData = {
      senderId: senderId,
      receiverId: receiverId,
      message: "Initial credit assigned",
      credit: credit,
      debit: null,
      userId: receiverId,
      isDeleted: false,
      balance: balCalculation,
      transactionType: 'CREDIT'
    };
  
    let debitCashData = {
      senderId: senderId,
      receiverId: receiverId,
      message: "Initial debit assigned",
      credit: null,
      debit: credit,
      userId: receiverId,
      isDeleted: false,
      balance: newBalance,
      transactionType: 'DEBIT'
    };
  
    await creditCash.create(creditCashData);
    await creditCash.create(debitCashData);
  
    // Update the sender's available_balance
    user.available_balance = newBalance;
    await user.save();
  
    return newBalance;
  },


  getAll: (req, res) => {
    const options = helper.getPaginationOptions(req);
    const query = {
      isDeleted: false,
    };

    // Add roleType filter if provided in query parameters
    if (req.query.roleType !== undefined) {
      const roleType = parseInt(req.query.roleType);
      // Validate the roleType against the constants
      const validRoleTypes = [
        TYPE_SYSTEM_ADMIN,
        TYPE_SUPER_ADMIN,
        TYPE_SUB_ADMIN,
        TYPE_MASTER,
        TYPE_CLIENT,
      ];
      if (validRoleTypes.includes(roleType)) {
        query.roleType = roleType;
      } else {
        return helper.error(res, "Invalid roleType provided.");
      }
    }

    User.paginate(query, options)
      .then((result) => {
        let obj = {
          data: result.docs,
          totalPages: result.totalPages,
          currentPage: result.page,
        };
        return helper.success(res, "Listing Successfully.", obj);
      })
      .catch((error) => {
        return helper.error(res, error);
      });
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

const populateMasterIds = async (userId, masterIds) => {
  let user = await User.findById(userId);
  if (user && user.parentId) {
    masterIds.push(String(user.parentId));
    await populateMasterIds(user.parentId, masterIds);
  }
};
