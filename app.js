const express = require("express");
const app = express();
const env = require("dotenv");
const UserRouter = require("./routers/userRouter");
const adminRouter = require("./routers/adminRouter");
const Db = require("./confg/db");
const session = require("express-session");

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(function (req, res, next) {
  res.set("Cache-Control", "no-cache, private, no-store, must-revalidate");
  next();
});
env.config({ path: "./.env" });
PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

app.use("/", UserRouter);
app.use("/admin", adminRouter);

Db().then(() => {
  app.listen(PORT, () => {
    console.log(`server is running http://localhost:${PORT}/`);
  });
});
