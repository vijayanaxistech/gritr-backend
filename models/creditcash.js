const { string } = require("i/lib/util");
const mongoose = require("mongoose");
let Schema = mongoose.Schema;


const craditSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      required: false,
    },
    receiverId: {
      type: String,
      required: false,
    },
    message: {
      type: String,
      required: true,
    },
    credit: {
      type: Number,
      required: false,
    },
    debit: {
      type: Number,
      required: false,
    },
    userId: {
      type: String,
      required: false,
    },
    isDeleted:{
      type: Boolean,
      required: false,  
    },
    balance:{
      type: Schema.Types.Decimal128,
      required: false,   
    },
    transactionType:{
      type: String,
      required: false,   
    },
  },
  { timestamps: true }
);


craditSchema.methods.toJSON = function () {
  var obj = this.toObject();  
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("creditcash", craditSchema);
