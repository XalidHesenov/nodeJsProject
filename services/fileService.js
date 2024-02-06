import sqlite3 from "sqlite3";
import multer from "multer";
import fs from 'fs'
import path, { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const db = new sqlite3.Database('stepDrive.sqlite');

const dynamicDestination = async (req, file, cb) => {
    let folder;
    try {
        if (req.body.folderId != 0) {
            folder = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM Folder WHERE Id = ?', [req.body.folderId], (err, row) => {
                    if (err) {
                        console.error('Something went wrong', err.message);
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            });
        }
        const destinationPath = folder ? `files\\${req.user.username}\\${folder.Name}` : `files\\${req.user.username}`
        req.destPath = destinationPath
        cb(null, destinationPath);
    } catch (error) {
        console.error('Error in dynamicDestination function', error.message);
        cb(error);
    }
};

export function AddFile(req, res) {
    const username = req.user.username;
    const storage = multer.diskStorage({
        destination: dynamicDestination,
    });

    const upload = multer({ storage: storage }).single('file');

    upload(req, res, async (err) => {
        if (err) {
            console.error('Error uploading file', err);
            return res.status(400).json({ message: 'Error uploading file' });
        }

        try {
            fs.renameSync(req.file.path, path.join(req.destPath, req.file.originalname));
            const newPath = req.destPath + `\\${req.file.originalname}`
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO File(Name, Path, FolderId, UserId) VALUES(?, ?, ?, ?)',
                    [req.file.originalname, newPath, req.body.folderId, req.user.userId], (err) => {
                        if (err) {
                            console.error('Error inserting file', err.message);
                            reject(err);
                        } else {
                            resolve();
                        }
                    }
                );
            })
            res.status(200).json({ message: "File uploaded" });
        } catch (error) {
            console.error('Error in AddFile function', error.message);
            res.status(500).json();
        }
    });
}


export async function CreateFolder(username, userId, folderName) {
    try {
        const folder = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM Folder WHERE Name = ? AND UserId = ?', [folderName, userId], (err, row) => {
                if (err) {
                    console.error('Something went wrong', err);
                    reject(err);
                }
                else {
                    resolve(row);
                }
            })
        })
        if (folder) {
            return 0
        }
        const targetFolderPath = `files\\${username}\\${folderName}`
        fs.mkdir(targetFolderPath, () => { });
        await new Promise((resolve, reject) => {
            db.run('INSERT INTO Folder(Name, Path, UserId) VALUES(?, ?, ?)', [folderName, targetFolderPath, userId], (err) => {
                if (err) {
                    console.error('Error inserting user', err.message);
                    reject(err);
                } else {
                    resolve();
                }
            })
        })
        return 1;
    } catch (error) {
        console.error('Error in CreateFolder function', error);
        return -1;
    }
}

export async function DeleteFile(fileId) {
    try {
        const file = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM File WHERE Id = ?', [fileId], (err, row) => {
                if (err) {
                    console.error('Error inserting user', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            })
        })
        fs.unlink(file.Path, (err) => { });
        await new Promise((resolve, reject) => {
            db.exec(`DELETE FROM File WHERE Id = ${fileId}; DELETE FROM SharedFiles WHERE SharedFileId = ${fileId}`, (err) => {
                if (err) {
                    console.error('Error deleting file', err.message);
                    reject(err);
                } else {
                    resolve();
                }
            })
        })
        return 1
    } catch (error) {
        console.error('Error in DeleteFile function', error);
        return 0
    }
}

export async function DeleteFolder(folderId) {
    try {
        const folder = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM Folder WHERE Id = ?', [folderId], (err, row) => {
                if (err) {
                    console.error('Error inserting user', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            })
        })
        fs.rm(folder.Path, { recursive: true }, (err) => { })
        const files = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM File WHERE FolderId = ?', [folderId], (err, row) => {
                if (err) {
                    console.error('Error inserting user', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            })
        })
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM Folder WHERE Id = ?', [folderId], (err) => {
                if (err) {
                    console.error('Error deleting file', err.message);
                    reject(err);
                } else {
                    resolve();
                }
            })
        })
        files.forEach(async element => {
            console.log(element.Id)
            await new Promise((resolve, reject) => {
                db.exec(`DELETE FROM File WHERE Id = ${element.Id}; DELETE FROM SharedFiles WHERE SharedFileId = ${element.Id}`, (err) => {
                    if (err) {
                        console.error('Error deleting file', err.message);
                        reject(err);
                    } else {
                        resolve();
                    }
                })
            })
        });

        return 1
    } catch (error) {
        console.error('Error in DeleteFolder function', error);
        return 0
    }
}

export async function GetFile(fileId) {
    try {
        const file = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM File WHERE Id = ?', [fileId], (err, row) => {
                if (err) {
                    console.error('Something went wrong', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            })
        })
        return file
    } catch (error) {
        console.error('Error in GetFile function', error);
        return 0
    }
}

export async function GetFolder(folderId) {
    try {
        const folder = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM Folder WHERE Id = ?', [folderId], (err, row) => {
                if (err) {
                    console.error('Something went wrong', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });

        const files = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM File WHERE FolderId = ?', [folderId], (err, row) => {
                if (err) {
                    console.error('Something went wrong', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
        folder.files = files
        return folder
    } catch (error) {
        console.error('Error in GetFolder function', error);
        return 0
    }
}