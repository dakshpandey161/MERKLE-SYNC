const express = require('express')
const router = express.Router();

const userController = require('../controller/userController')


router.get('/getUser',userController.getUsers);
router.get('/syncdata',userController.syncdata);
router.post('/createUser', userController.createUser);
router.delete('/deleteUser/:userId', userController.deleteUser);

module.exports = router;