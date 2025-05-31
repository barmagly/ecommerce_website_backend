const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const usersModel = require('../models/users');

const { deleteUserById, getAllUser, getUserById, addUser, editUserById, userLogin } = require('../controller/user');

router.get('/', getAllUser)
router.get('/:id', getUserById);
router.post('/', addUser)
router.patch('/:id', editUserById)
router.delete('/:id', deleteUserById)
router.post('/login', userLogin)

module.exports = router;
