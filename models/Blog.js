const mongoose = require("mongoose");
const { schema } = require("./secure/postValidation");

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 100,
    },

    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },

    body: {
        type: String,
        required: true,
    },

    status: {
        type: String,
        enum: ["private", "public"],
        default: "public",
    },

    thumbnail: {
        type: String,
        required: true,
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

blogSchema.index({ title: "text" });

blogSchema.pre("validate", function () {
    if (!this.title) return;

    this.slug = this.title
        .trim()
        .toLowerCase()
        .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
});


blogSchema.statics.postValidation = function (body) {
    return schema.validate(body, {
        abortEarly: false,
    });
};

module.exports = mongoose.model("Blog", blogSchema);
