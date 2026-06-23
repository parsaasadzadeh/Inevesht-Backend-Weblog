const mongoose = require("mongoose");
const { schema } = require("./secure/postValidation");

const blogSchmea = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 100,
    },
    // فیلد اسلاگ اضافه شد
    slug: {
        type: String,
        required: true,
        unique: true, 
    },
    // ... بقیه فیلدها بدون تغییر (body, status, thumbnail, user, createdAt)
    body: { type: String, required: true },
    status: { type: String, default: "public", enum: ["private", "public"] },
    thumbnail: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
});

blogSchmea.index({ title: "text" });

// این بخش اضافه شود: تبدیل خودکار عنوان به اسلاگ قبل از اعتبارسنجی و ذخیره
blogSchmea.pre("validate", function (next) {
    if (this.title) {
        // حذف فاصله‌های اضافی و جایگزینی فاصله‌ها با خط تیره (-)
        this.slug = this.title.trim().replace(/\s+/g, '-');
    }
    next();
});

blogSchmea.statics.postValidation = function (body) {
    return schema.validate(body, { abortEarly: false });
};

module.exports = mongoose.model("Blog", blogSchmea);
