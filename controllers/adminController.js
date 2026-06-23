const User = require("../models/User");
const Blog = require("../models/Blog");
const {
    uploadImage: uploadToBlob,
    deleteImage: deleteFromBlob,
} = require("../utils/blobStorage");

//  @desc   ساخت پست جدید (عکس روی Vercel Blob آپلود می‌شود)
exports.createPost = async (req, res, next) => {
    try {
        const thumbnail = req.files ? req.files.thumbnail : null;

        if (!thumbnail) {
            const error = new Error("عکس بند انگشتی الزامی است");
            error.statusCode = 422;
            throw error;
        }

        await Blog.postValidation({ ...req.body, thumbnail });

        const blob = await uploadToBlob(thumbnail, "thumbnails");

        await Blog.create({
            ...req.body,
            user: req.userId,
            thumbnail: blob.url,
        });

        res.status(201).json({ message: "پست جدید با موفقیت ساخته شد" });
    } catch (err) {
        next(err);
    }
};

//  @desc   ویرایش پست (در صورت ارسال عکس جدید، عکس قبلی از Blob حذف می‌شود)
exports.editPost = async (req, res, next) => {
    try {
        const thumbnail = req.files ? req.files.thumbnail : null;

        if (thumbnail) {
            await Blog.postValidation({ ...req.body, thumbnail });
        } else {
            await Blog.postValidation({
                ...req.body,
                thumbnail: {
                    name: "placeholder",
                    size: 0,
                    mimetype: "image/jpeg",
                },
            });
        }

        const post = await Blog.findOne({ slug: req.params.slug });

        if (!post) {
            const error = new Error("پستی با این شناسه یافت نشد");
            error.statusCode = 404;
            throw error;
        }

        if (post.user.toString() !== req.userId) {
            const error = new Error("شما مجوز ویرایش این پست را ندارید");
            error.statusCode = 401;
            throw error;
        }

        const { title, status, body } = req.body;
        post.title = title;
        post.status = status;
        post.body = body;

        if (thumbnail) {
            const oldThumbnailUrl = post.thumbnail;
            const blob = await uploadToBlob(thumbnail, "thumbnails");
            post.thumbnail = blob.url;

            // عکس قدیمی بعد از موفقیت در آپلود عکس جدید حذف می‌شود
            await deleteFromBlob(oldThumbnailUrl);
        }

        await post.save();

        res.status(200).json({ message: "پست شما با موفقیت ویرایش شد" });
    } catch (err) {
        next(err);
    }
};

//  @desc   حذف پست به همراه حذف عکس آن از Vercel Blob
exports.deletePost = async (req, res, next) => {
    try {
        const post = await Blog.findOneAndDelete({ slug: req.params.slug });

        if (!post) {
            const error = new Error("پستی با این آدرس یافت نشد");
            error.statusCode = 404;
            throw error;
        }

        await deleteFromBlob(post.thumbnail);

        res.status(200).json({ message: "پست شما با موفقیت پاک شد" });
    } catch (err) {
        next(err);
    }
};

//  @desc   داشبورد کاربر
exports.getDashboard = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const posts = await Blog.find({ user: req.userId }).sort({
            createdAt: "desc",
        });

        res.status(200).json({
            posts,
            fullname: user ? user.fullname : "کاربر عزیز",
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "خطای سرور در دریافت مقالات" });
    }
};

//  @desc   آپلود مستقل یک عکس (مثلا برای استفاده داخل بدنه‌ی پست)
exports.uploadImage = async (req, res, next) => {
    try {
        const image = req.files ? req.files.image : null;

        if (!image) {
            const error = new Error("جهت آپلود باید عکسی انتخاب کنید");
            error.statusCode = 400;
            throw error;
        }

        if (image.size > 4000000) {
            const error = new Error(
                "حجم عکس ارسالی نباید بیشتر از 4 مگابایت باشد"
            );
            error.statusCode = 422;
            throw error;
        }

        if (image.mimetype !== "image/jpeg" && image.mimetype !== "image/png") {
            const error = new Error(
                "تنها پسوندهای jpeg و png پشتیبانی می‌شوند"
            );
            error.statusCode = 422;
            throw error;
        }

        const blob = await uploadToBlob(image, "uploads");

        res.status(200).json({ image: blob.url });
    } catch (err) {
        next(err);
    }
};