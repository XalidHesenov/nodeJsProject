import {createDatabase} from "./createDb.js";
import express, { Router } from "express"
import parser from "body-parser";
import { config } from "dotenv";
import { user } from "./routers/userRouter.js";
import { file } from "./routers/fileRouter.js";
createDatabase()
config()
const PORT = process.env.PORT
const app = express();
app.use(parser.urlencoded({extended: true}))
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Tüm originlere izin ver (Dikkat: Güvenlik açısından * kullanımı genellikle önerilmez)
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.use(express.json())
app.use("/user", user)
app.use("/file", file)
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
