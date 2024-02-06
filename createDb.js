import sqlite3 from 'sqlite3';

export function createDatabase() {
    const db = new sqlite3.Database('stepDrive.sqlite');
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS User (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Username TEXT NOT NULL,
                Password TEXT NOT NULL
            );
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS Folder (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Name TEXT NOT NULL,
                Path TEXT NOT NULL,
                UserId INTEGER NOT NULL,
                FOREIGN KEY (UserId) REFERENCES User(Id)
            );
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS File (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Name TEXT NOT NULL,
                Path TEXT NOT NULL,
                FolderId INTEGER NOT NULL,
                UserId INTEGER NOT NULL,
                FOREIGN KEY (FolderId) REFERENCES Folder(Id),
                FOREIGN KEY (UserId) REFERENCES User(Id)
            );
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS SharedFiles (
                SharedUserId INTEGER,
                SharedFileId INTEGER,
                PRIMARY KEY (SharedUserId, SharedFileId),
                FOREIGN KEY (SharedUserId) REFERENCES User(Id),
                FOREIGN KEY (SharedFileId) REFERENCES File(Id)
            );
        `);
        db.close()
    });
}

