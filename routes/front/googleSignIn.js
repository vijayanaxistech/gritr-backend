const express = require('express');
const router = express.Router();
const { googleSignIn } = require('../../Controller/front/googleSignIn');



router.post('/google-signin', googleSignIn);


module.exports = router;