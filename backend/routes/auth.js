import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

app.post("/auth/register", (req, res) => {

});

app.post("/auth/login", (req, res) => {
    
});