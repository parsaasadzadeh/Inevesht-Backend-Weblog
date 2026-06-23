const Yup = require("yup");
const captchapng = require("captchapng");
const Blog = require("../models/Blog");
const { sendEmail } = require("../utils/mailer");

let CAPTCHA_NUM;

exports.getIndex = async (req, res, next) => {
    try {
        const numberOfPosts = await Blog.find({
            status: "public",
        }).countDocuments();

        const posts = await Blog.find({ status: "public" }).sort({
            createdAt: "desc",
        });

        if (!posts) {
            const error = new Error("هیچ پستی در پایگاه داده ثبت نشده است");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({ posts, total: numberOfPosts });
    } catch (err) {
        next(err);
    }
};

exports.getSinglePost = async (req, res, next) => {
    try {
        // تغییر مهم: جستجو بر اساس slug
        const post = await Blog.findOne({ slug: req.params.slug }).populate("user");

        if (!post) {
            const error = new Error("پستی با این آدرس یافت نشد");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({ post });
    } catch (err) {
        next(err);
    }
};

exports.handleContactPage = async (req, res, next) => {
    const { fullname, email, message, captcha } = req.body;

    const schema = Yup.object().shape({
        fullname: Yup.string().required("نام و نام خانوادگی الزامی می باشد"),
        email: Yup.string().email("آدرس ایمیل صحیح نیست").required("آدرس ایمیل الزامی می باشد"),
        message: Yup.string().required("پیام اصلی الزامی می باشد"),
        captcha: Yup.string().required("کد امنیتی الزامی می باشد"),
    });

    try {
        await schema.validate(req.body, { abortEarly: false });

        // ۱. بررسی کپچا
        if (parseInt(captcha) !== CAPTCHA_NUM) {
            const error = new Error("کد امنیتی صحیح نیست");
            error.statusCode = 422;
            throw error; 
        }

        // ۲. تلاش برای ارسال ایمیل در یک بلاک try/catch جداگانه
        try {
            // دقت کنید که کلمه await اضافه شده باشد
            // await sendEmail(
            //     email,
            //     fullname,
            //     "پیام از طرف وبلاگ",
            //     `${message} <br/> ایمیل کاربر : ${email}`
            // );
        } catch (emailError) {
            console.log("Email Sending Error:", emailError.message);
            const error = new Error("مشکلی در سرور ایمیل رخ داده است، لطفاً بعداً تلاش کنید.");
            error.statusCode = 500;
            throw error;
        }

        res.status(200).json({ message: "پیام شما با موفقیت ارسال شد" });
    } catch (err) {
        next(err); // ارسال خطا به میدل‌ور مدیریت خطای اکسپرس
    }
};


exports.getCaptcha = (req, res) => {
    CAPTCHA_NUM = parseInt(Math.random() * 9000 + 1000);
    const p = new captchapng(80, 30, CAPTCHA_NUM);
    p.color(0, 0, 0, 0);
    p.color(80, 80, 80, 255);

    const img = p.getBase64();
    const imgBase64 = Buffer.from(img, "base64");

    res.send(imgBase64);
};
