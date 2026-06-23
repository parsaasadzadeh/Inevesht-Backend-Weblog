const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const { errorHandler } = require("./middlewares/errors");

// Load env
dotenv.config();

// Connect database
connectDB();

const app = express();

// CORS
app.use(cors());

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File Upload
// عکس‌ها دیگر روی دیسک سرور ذخیره نمی‌شوند (در Vercel امکان نوشتن دائمی روی دیسک وجود ندارد)؛
// همه‌چیز در حافظه (RAM) نگه داشته می‌شود و سپس مستقیم به Vercel Blob فرستاده می‌شود.
app.use(
  fileUpload({
    useTempFiles: false,
    limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
    abortOnLimit: true,
  })
);

// توجه: app.use(express.static("public")) حذف شد چون دیگر فایلی
// به صورت محلی در پوشه‌ی public/uploads ذخیره نمی‌شود. اگر فایل استاتیک
// دیگری (مثل favicon) دارید که باید سرو شود، آن خط را برای همان مسیر نگه دارید.

// Routes
app.use("/", require("./routes/blog"));
app.use("/users", require("./routes/users"));
app.use("/dashboard", require("./routes/dashboard"));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
  );
});