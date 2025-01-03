
let express = require('express');
let router = express.Router();
let roleManagement  = require('../Controller/roleController');


// Core APIs
router.post('/create', roleManagement.create);
router.put('/:id', roleManagement.update);
router.get('/:id', roleManagement.get);



module.exports = router;