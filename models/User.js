const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { schema } = require("./secure/userValidation");

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: [true, "نام و نام خانوادگی الزامی می باشد"],
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 255,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

userSchema.statics.userValidation = function (body) {
    return schema.validate(body, { abortEarly: false });
};

// تغییر اصلی: حذف پارامتر next از امضای تابع.
// در نسخه‌های جدید Mongoose، هوک‌های pre دیگر آرگومان next پاس نمی‌دهند؛
// همین باعث می‌شد next() در ادامه‌ی تابع با خطای "next is not a function" بترکد.
// حالا فقط کافیست تابع async باشد؛ اگر throw کند، Mongoose خودش خطا را
// به save() منتقل می‌کند و کنترلر آن را در catch می‌گیرد.
userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
});

module.exports = mongoose.model("User", userSchema);