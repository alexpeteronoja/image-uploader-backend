import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import cors from "cors";
import path from "path";
import { access, constants } from "node:fs";
import { dirname } from "path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

dotenv.config();

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    cors({
        origin: process.env.NODE_ENV === "production" ?
            "vercel.app" :
            "http://localhost:5173",
    })
);
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// app.use(express.static("public"));

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "./public/image");
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname.toLowerCase());
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 2 },
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png/;
        const extName = fileTypes.test(
            path.extname(file.originalname).toLowerCase()
        );
        const mimeType = fileTypes.test(file.mimetype);

        const existingFile = path.join(
            __dirname,
            "public",
            "image",
            file.originalname.toLowerCase()
        );

        if (extName && mimeType) {
            return cb(null, true);
        } else {
            cb(
                new Error(
                    "Error Only JPG, JPEG, and PNG file Type allowed or File Exist"
                )
            );
        }
    },
}).single("file");

app.post("/api/upload", (req, res) => {
    upload(req, res, function(err) {
        if (err) {
            return res.status(400).json({ error: err || "upload failed" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "No files Uploaded" });
        }

        res.status(200).json({ message: "Succesfully Uploaded", file: req.file });
    });
});

app.get("/api/download/:filename", (req, res) => {
    const filename = req.params.filename;
    const sentFile = path.join(__dirname, "public", "image", filename);

    // Check if directory exist

    access(sentFile, constants.F_OK, (err) => {
        if (err) {
            console.error(`${sentFile} does not exist`);
            return res.status(404).send("file does not exist");
        }

        res.sendFile(sentFile);
        console.log(`${sentFile} file sent`);
    });
});

app.listen(process.env.Port || 3000, () =>
    console.log("Server Started at Port 3000")
);