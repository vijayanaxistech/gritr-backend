
let express = require('express');
let router = express.Router();
let welcomeMessage  = require('../Controller/welcomeMsgController');

router.post('/create', welcomeMessage.create);
router.get('/', welcomeMessage.get);
router.put('/:id', welcomeMessage.update);


module.exports = router;