"use strict";
let aes256 = require("aes256");
let Constants = require("../config/constants");

module.exports = {
  gsk(auth) {
    var firstTF = auth.substring(0, 25);
    firstTF = firstTF.substr(firstTF.length - 20);
    firstTF = reverseString(firstTF);
    let lastTF = auth.substring(25);
    let data = aes256.decrypt(firstTF, lastTF);
    return data;
  },

  getEncKey: (resObj) => {
    let encKey = getRandomString(20);
    let appendEncKey = getRandomString(5);
    let finalString =
      appendEncKey +
      reverseStrings(encKey) +
      dataRkEnc(encKey, JSON.stringify(resObj));
    return finalString;
  },

  dataEncrypt: (data) => {
    let key = Constants.dataEnDesecret;
    let encrypted = aes256.encrypt(key, JSON.stringify(data));
    return encrypted;
  },
};

function reverseString(str) {
  if (str.length > 0) {
    var splitString = str.split(""); // var splitString = "hello".split("");

    var reverseArray = splitString.reverse();
    var joinArray = reverseArray.join("");
    return joinArray;
  }
}

function getRandomString(length, res) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function reverseStrings(str) {
  var splitString = str.split(""); // var splitString = "hello".split("");
  var reverseArray = splitString.reverse();
  var joinArray = reverseArray.join("");
  return joinArray;
}

function dataRkEnc(key, data) {
  let encrypted = aes256.encrypt(key, data);
  return encrypted;
}
