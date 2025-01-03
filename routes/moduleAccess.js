
let express = require('express');
let router = express.Router();
let moduleAccess  = require('../Controller/moduleController');

router.post('/create', moduleAccess.create);
router.get('/:id', moduleAccess.get);
router.put('/:id', moduleAccess.update);
router.get('/', moduleAccess.getAll);

module.exports = router;