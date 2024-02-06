import jwt from "jsonwebtoken";
import { config } from "dotenv";
config()

export function verifyToken(req, res, next) {
    const header = req.headers['authorization'];
    const token = header && header.split(" ")[1]
    if (!token) {
        return res.status(400).json({ message: 'Token not provided' });
    }
    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(400).json({ message: 'Invalid token' });
        }

        req.user = decoded;
        next();
    });
}

export function createToken(user){
    return jwt.sign({ userId: user.Id, username: user.Username }, process.env.TOKEN_SECRET, {expiresIn: '1h'});
}