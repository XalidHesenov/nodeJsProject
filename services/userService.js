import bcrypt from 'bcrypt';
import sqlite3 from 'sqlite3';
import fs from 'fs'
import path, { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createToken } from '../authorization/auth.js';
const db = new sqlite3.Database('stepDrive.sqlite');

export async function Register(user) {
    try {
        const hashedPassword = await bcrypt.hash(user.password, 5);
        const oldUser = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM User WHERE Username = ?', [user.username], (err, row) => {
                if (err) {
                    console.error('Something went wrong', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });

        if (!oldUser) {
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO [User](Username, Password) VALUES(?, ?)', [user.username, hashedPassword], (err) => {
                    if (err) {
                        console.error('Error inserting user', err.message);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = dirname(__filename);
            const projectRoot = dirname(__dirname);
            const folderName = user.username;
            const folderPath = path.join(projectRoot, 'files');
            const targetFolderPath = path.join(folderPath, folderName);
            fs.mkdir(targetFolderPath, () => { });
            return 1;
        }
        else {
            return 0;
        }
    } catch (error) {
        console.error('Error in Register function', error.message);
        return -1;
    }
}

export async function Login(user) {
    try {
        const oldUser = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM User WHERE Username = ?', [user.username], (err, row) => {
                if (err) {
                    console.error('Something went wrong', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
        if (!oldUser) {
            return 'br'
        }
        else if (await bcrypt.compare(user.password, oldUser.Password)) {
            const token = createToken(oldUser)
            return token
        }
        else {
            return 'br'
        }
    } catch (error) {
        console.error('Error in Login function', error.message);
        return 'err';
    }
}

export async function MyDrive(userId) {
    try {
        const folders = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM Folder WHERE UserId = ?', [userId], (err, row) => {
                if (err) {
                    console.error('Something went wrong', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });

        const files = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM File WHERE UserId = ? AND FolderId = 0', [userId], (err, row) => {
                if (err) {
                    console.error('Something went wrong', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
        const data = {
            files: files,
            folders: folders
        }
        return data
    } catch (error) {
        console.error('Error in MyDrive function', error.message);
        return 'err';
    }
}

export async function SharedWithMe(userId) {
    try {
        const files = await new Promise((resolve, reject) => {
            db.all(`SELECT Id, Name, Path, UserId
            FROM File
            JOIN SharedFiles ON File.Id = SharedFiles.SharedFileId
            WHERE SharedFiles.SharedUserId = ?;`, [userId], (err, row) => {
                if (err) {
                    console.error('Something went wrong', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            })
        })
        return files
    } catch (error) {
        console.error('Error in SharedWithMe function', error.message);
        return 'err';
    }
}

export async function SearchUser(username) {
    try {
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT Username FROM [User] WHERE Username = ?', [username], (err, row) => {
                if (err) {
                    console.error('Something went wrong', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            })
        })
        return user
    } catch (error) {
        console.error('Error in SearchUser function', error.message);
        return 'err';
    }
}

export async function ShareFile(sharedUserName, fileId) {
    try {
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM [User] WHERE Username = ?', [sharedUserName], (err, row) => {
                if (err) {
                    console.error('Something went wrong', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            })
        })

        const shareCheck = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM SharedFiles WHERE SharedUserId = ? AND SharedFileId = ?', [user.Id, fileId], (err, row) => {
                if (err) {
                    console.error('Something went wrong', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            })
        })
        if (shareCheck) {
            return 1
        }

        if (user) {
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO SharedFiles(SharedUserId, SharedFileId) VALUES(?, ?)', [user.Id, fileId], (err) =>{
                    if (err) {
                        console.error('Error inserting user', err.message);
                        reject(err);
                    } else {
                        resolve();
                    }
                })
            })
            return 1
        }
        return 0
    } catch (error) {
        console.error('Error in ShareFile function', error.message);
        return 'err';
    }
}
