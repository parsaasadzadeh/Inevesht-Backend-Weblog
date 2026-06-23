const { put, del } = require("@vercel/blob");
const sharp = require("sharp");
const shortId = require("shortid");

/**
 * آپلود عکس روی Vercel Blob بعد از فشرده‌سازی با sharp
 * نیازمند متغیر محیطی BLOB_READ_WRITE_TOKEN (به صورت خودکار توسط SDK خوانده می‌شود)
 *
 * @param {object} file - فایل ارسالی از express-fileupload (مثلا req.files.thumbnail)
 * @param {string} folder - پوشه‌ی مجازی روی بلاب (مثلا "thumbnails" یا "uploads")
 * @returns {Promise<{url: string, pathname: string, downloadUrl: string}>}
 */
exports.uploadImage = async (file, folder = "uploads") => {
    if (!file || !file.data) {
        const error = new Error("فایلی برای آپلود ارسال نشده است");
        error.statusCode = 422;
        throw error;
    }

    const fileName = `${folder}/${shortId.generate()}_${file.name}`;

    const optimizedBuffer = await sharp(file.data)
        .jpeg({ quality: 60 })
        .toBuffer();

    const blob = await put(fileName, optimizedBuffer, {
        access: "public",
        contentType: "image/jpeg",
        addRandomSuffix: false, // چون خودمان با shortid یک پیشوند یکتا اضافه کرده‌ایم
    });

    return blob;
};

/**
 * حذف یک فایل از روی Vercel Blob با استفاده از آدرس کامل آن
 * خطای حذف، عمداً throw نمی‌شود تا حذف پست/جایگزینی عکس به خاطر
 * یک خطای جانبی (مثلا فایل از قبل وجود نداشته) متوقف نشود.
 *
 * @param {string} url - آدرس کامل فایل ذخیره شده روی بلاب
 */
exports.deleteImage = async (url) => {
    if (!url) return;
    try {
        await del(url);
    } catch (err) {
        console.log("خطا در حذف فایل از Vercel Blob:", err.message);
    }
};