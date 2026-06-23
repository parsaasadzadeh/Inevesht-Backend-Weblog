const Yup = require("yup");
const Blog = require("../models/Blog");
const { sendEmail } = require("../utils/mailer");

// حذف شد: const captchapng = require("captchapng");

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

        if (parseInt(captcha) !== CAPTCHA_NUM) {
            const error = new Error("کد امنیتی صحیح نیست");
            error.statusCode = 422;
            throw error;
        }

        try {
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
        next(err);
    }
};

// ── تابع جدید کپچا با SVG خالص ──────────────────────────────────────────────
exports.getCaptcha = (req, res) => {
    CAPTCHA_NUM = parseInt(Math.random() * 9000 + 1000);
    const digits = String(CAPTCHA_NUM).split("");

    const W = 120, H = 40;

    // تولید خطوط نویز تصادفی
    const noiseLines = Array.from({ length: 5 }, () => {
        const x1 = Math.random() * W;
        const y1 = Math.random() * H;
        const x2 = Math.random() * W;
        const y2 = Math.random() * H;
        const color = `rgb(${rand(100,200)},${rand(100,200)},${rand(100,200)})`;
        return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="1.2"/>`;
    }).join("");

    // تولید نقاط نویز تصادفی
    const noiseDots = Array.from({ length: 30 }, () => {
        const cx = (Math.random() * W).toFixed(1);
        const cy = (Math.random() * H).toFixed(1);
        const color = `rgb(${rand(80,180)},${rand(80,180)},${rand(80,180)})`;
        return `<circle cx="${cx}" cy="${cy}" r="1" fill="${color}"/>`;
    }).join("");

    // رندر هر رقم با چرخش و موقعیت کمی تصادفی
    const digitsSvg = digits.map((d, i) => {
        const x = 14 + i * 25 + rand(-3, 3);
        const y = 28 + rand(-4, 4);
        const rotate = rand(-18, 18);
        const color = `rgb(${rand(20,80)},${rand(20,80)},${rand(20,80)})`;
        const size = rand(20, 26);
        return `<text x="${x}" y="${y}" font-size="${size}" font-family="monospace" font-weight="bold" fill="${color}" transform="rotate(${rotate},${x},${y})">${d}</text>`;
    }).join("");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#f0f0f0" rx="6"/>
  ${noiseLines}
  ${noiseDots}
  ${digitsSvg}
</svg>`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.send(svg);
};

// تابع کمکی برای عدد تصادفی در بازه
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}