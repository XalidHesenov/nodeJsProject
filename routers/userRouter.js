import express from "express"
import sqlite3 from "sqlite3"
import { body, check, validationResult } from 'express-validator'
import { Login, MyDrive, Register, SearchUser, ShareFile, SharedWithMe } from "../services/userService.js"
import { verifyToken } from "../authorization/auth.js";
const db = new sqlite3.Database('stepDrive.sqlite');

export const user = express.Router()


user.post('/register', [
    check('username').isLength({ min: 5, max: 14 }).withMessage('The username must be at least 5 characters and at most 14 characters.')
    .isLowercase().withMessage('The username should be in lowercase letters.')
    .isAlphanumeric().withMessage('The username can only contain letters and numbers.'),
    check('password', "The password must be at least 8 characters long and include at least 1 digit, 1 special character, and 1 uppercase and 1 lowercase letter.").isStrongPassword()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    Register(req.body).then((value) => {
        if (value == 1)
            res.status(200).json({ message: 'succesfully registered' })
        else if (value == 0)
            res.status(400).json({ message: 'this username aldready taken' })
        else
            res.status(500).json({ message: 'something went wrong in server' })
    })
});

user.post('/login', [
    check('username').isLength({ min: 5, max: 14 }).withMessage('The username must be at least 5 characters and at most 14 characters.')
    .isLowercase().withMessage('The username should be in lowercase letters.')
    .isAlphanumeric().withMessage('The username can only contain letters and numbers.'),
    check('password', "The password must be at least 8 characters long and include at least 1 digit, 1 special character, and 1 uppercase and 1 lowercase letter.").isStrongPassword()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    Login(req.body).then((value) => {
        if (value == 'br') {
            res.status(400).json({ message: 'username or password is incorrect' })
        }
        else if (value == 'err') {
            res.status(500).json({ message: 'something went wrong in server' })
        }
        else {
            res.status(200).json({ token: value })
        }
    })
})

user.get('/my-drive', verifyToken, (req, res) => {
    MyDrive(req.user.userId).then((value) => {
        res.status(200).json({ data: value })
    })
})

user.get('/shared-with-me', verifyToken, (req, res) => {
    SharedWithMe(req.user.userId).then((value) => {
        res.status(200).json({ data: value })
    })
})

user.post('/search-user', verifyToken, (req, res) => {
    SearchUser(req.body.username).then((value) => {
        if(value && value.Username != req.user.username){
            res.status(200).json()
        }
        else{
            res.status(400).json({ message: 'user not found' })
        }
    })
})

user.post('/share-file', verifyToken, (req, res) => {
    ShareFile(req.body.sharedUserName, req.body.fileId).then((value) => {
        if(value == 1){
            res.status(200).json()
        }
        else{
            res.status(400).json({ message: 'user not found' })
        }
    })
})