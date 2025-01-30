const express = require('express');
const router = express.Router();
const { googleSignIn } = require('../../Controller/front/googleSignIn');

const { facebookSignIn } = require('../../Controller/front/facebookSignIn');


router.post('/google-signin', googleSignIn);
router.post('/facebook-signin', facebookSignIn);


module.exports = router;