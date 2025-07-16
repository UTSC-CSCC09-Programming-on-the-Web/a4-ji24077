"use strict";

const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const https = require("https");
const http = require("http");
const fs = require("fs");
const { sequelize } = require("./models");

const app = express();

// Port configuration
const HTTP_PORT = process.env.HTTP_PORT || 80;
const HTTPS_PORT = process.env.HTTPS_PORT || 443;
const NODE_ENV = process.env.NODE_ENV || "development";

// Middleware settings
app.use(cors());
app.use(express.json());
app.use(express.static("static"));
app.use("/uploads", express.static("uploads"));

// Force HTTPS redirect in production
app.use((req, res, next) => {
  if (NODE_ENV === "production" && req.header("x-forwarded-proto") !== "https") {
    res.redirect(`https://${req.header("host")}${req.url}`);
  } else {
    next();
  }
});

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "cscc09-web-gallery-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: NODE_ENV === "production", // HTTPS only in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Router settings
const authRouter = require("./routers/auth");
const usersRouter = require("./routers/users");
const imageRouter = require("./routers/images");
const commentRouter = require("./routers/comments");

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/images", imageRouter);
app.use("/api/comments", commentRouter);

// SSL Certificate paths
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || "/etc/letsencrypt/live/webgallery.yourdomain.com/privkey.pem";
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || "/etc/letsencrypt/live/webgallery.yourdomain.com/fullchain.pem";

// Server start
sequelize.sync({ force: false }).then(() => {
  if (NODE_ENV === "production") {
    // Production: HTTPS server
    if (fs.existsSync(SSL_KEY_PATH) && fs.existsSync(SSL_CERT_PATH)) {
      const options = {
        key: fs.readFileSync(SSL_KEY_PATH),
        cert: fs.readFileSync(SSL_CERT_PATH),
      };

      // HTTPS server
      https.createServer(options, app).listen(HTTPS_PORT, () => {
        console.log(`HTTPS Server is running on port ${HTTPS_PORT}`);
      });

      // HTTP server for redirect
      http.createServer(app).listen(HTTP_PORT, () => {
        console.log(`HTTP Server is running on port ${HTTP_PORT} (redirecting to HTTPS)`);
      });
    } else {
      console.error("SSL certificates not found. Please ensure SSL certificates are installed.");
      process.exit(1);
    }
  } else {
    // Development: HTTP server
    app.listen(3000, () => {
      console.log(`Development server is running on port 3000`);
    });
  }
});
