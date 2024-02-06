import express from "express"
import { verifyToken } from "../authorization/auth.js";
import { AddFile, CreateFolder, DeleteFile, DeleteFolder, GetFile, GetFolder } from "../services/fileService.js";
export const file = express.Router()

file.post('/add-file', verifyToken, (req, res) => {
    AddFile(req, res)
})

file.post('/create-folder', verifyToken, (req, res) => {
    CreateFolder(req.user.username, req.user.userId, req.body.folderName).then((value) => {
        if(value == 1){
            res.status(200).json({message: 'Folder created successfully'})
        }
        else if(value == 0){
            res.status(400).json({message: 'A folder with this name already exists.'})
        }
    })
})

file.get('/get-folder', verifyToken, (req, res) => {
    GetFolder(req.query.folderId).then((value) => {
        if(value == 0){
            res.status(400).json({message: 'There is no folder with this id'})
        }
        else if(value != 0){
            res.status(200).json({folder: value})
        }
    })
})

file.get('/get-file', (req, res) => {
    GetFile(req.query.fileId).then((value) => {
        if(value == 0 || !value){
            res.status(400).json({message: 'There is no file with this id'})
        }
        else if(value != 0){
            res.download(value.Path, value.Name, (err) => {
                if (err) {
                  // İndirme hatası oluşursa hatayı konsola yazdırın
                  console.error('Dosya indirme hatası:', err);
                  res.status(500).send('Dosya indirme hatası.');
                }
            })
        }
    })
})

file.delete('/delete-file', verifyToken, (req, res) => {
    DeleteFile(req.body.fileId).then((value) => {
        if(value == 1){
            res.status(200).json({message: 'File deleted successfully'})
        }
        else if(value == 0){
            res.status(400).json({message: 'Not Found'})
        }
    })
})

file.delete('/delete-folder', verifyToken, (req, res) => {
    DeleteFolder(req.body.folderId).then((value) => {
        if(value == 1){
            res.status(200).json({message: 'Folder deleted successfully'})
        }
        else if(value == 0){
            res.status(400).json({message: 'Not Found'})
        }
    })
})
