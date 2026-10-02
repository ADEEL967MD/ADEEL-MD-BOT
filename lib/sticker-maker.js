const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');
const Crypto = require('crypto');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');
const axios = require('axios');

ffmpeg.setFfmpegPath(ffmpegPath);

class StickerMaker {
    constructor() {
        this.tempDir = path.join(__dirname, '../temp');
        this.ensureTempDir();
    }

    ensureTempDir() {
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    async videoToWebp(videoBuffer) {
        const outputPath = path.join(
            tmpdir(),
            Crypto.randomBytes(6).readUIntLE(0, 6).toString(36) + '.webp'
        );
        const inputPath = path.join(
            tmpdir(),
            Crypto.randomBytes(6).readUIntLE(0, 6).toString(36) + '.mp4'
        );

        fs.writeFileSync(inputPath, videoBuffer);

        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .on('error', reject)
                .on('end', () => resolve(true))
                .addOutputOptions([
                    '-vcodec', 'libwebp',
                    '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0,split [a][b];[a] palettegen=reserve_transparent=on:transparency_color=ffffff [p];[b][p] paletteuse",
                    '-loop', '0',
                    '-ss', '00:00:00',
                    '-t', '00:00:05',
                    '-preset', 'default',
                    '-an',
                    '-vsync', '0'
                ])
                .toFormat('webp')
                .save(outputPath);
        });

        const webpBuffer = fs.readFileSync(outputPath);
        fs.unlinkSync(outputPath);
        fs.unlinkSync(inputPath);

        return webpBuffer;
    }

    async gifToSticker(gifBuffer) {
        const outputPath = path.join(tmpdir(), Crypto.randomBytes(6).toString('hex') + ".webp");
        const inputPath = path.join(tmpdir(), Crypto.randomBytes(6).toString('hex') + ".gif");

        fs.writeFileSync(inputPath, gifBuffer);

        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .on("error", reject)
                .on("end", () => resolve(true))
                .addOutputOptions([
                    "-vcodec", "libwebp",
                    "-vf", "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0,split [a][b];[a] palettegen=reserve_transparent=on:transparency_color=ffffff [p];[b][p] paletteuse",
                    "-loop", "0",
                    "-preset", "default",
                    "-an",
                    "-vsync", "0"
                ])
                .toFormat("webp")
                .save(outputPath);
        });

        const webpBuffer = fs.readFileSync(outputPath);
        fs.unlinkSync(outputPath);
        fs.unlinkSync(inputPath);

        return webpBuffer;
    }

    async convertStickerToImage(stickerBuffer) {
        const tempPath = path.join(this.tempDir, `sticker_${Date.now()}.webp`);
        const outputPath = path.join(this.tempDir, `image_${Date.now()}.png`);

        try {
            await fs.promises.writeFile(tempPath, stickerBuffer);

            await new Promise((resolve, reject) => {
                ffmpeg(tempPath)
                    .on('error', reject)
                    .on('end', resolve)
                    .output(outputPath)
                    .run();
            });

            return await fs.promises.readFile(outputPath);
        } catch (error) {
            console.error('Conversion error:', error);
            throw new Error('Failed to convert sticker to image');
        } finally {
            await Promise.all([
                fs.promises.unlink(tempPath).catch(() => {}),
                fs.promises.unlink(outputPath).catch(() => {})
            ]);
        }
    }

    async convertStickerToVideo(stickerBuffer) {
        const jobId = Date.now();
        const framesDir = path.join(this.tempDir, `frames_${jobId}`);
        const outputPath = path.join(this.tempDir, `video_${jobId}.mp4`);

        try {
            await fs.promises.mkdir(framesDir, { recursive: true });

            const img = sharp(stickerBuffer, { animated: true });
            const metadata = await img.metadata();

            const pageCount = metadata.pages || 1;
            const pageHeight = metadata.pageHeight || metadata.height;
            const width = metadata.width;

            const { data, info } = await img
                .raw()
                .ensureAlpha()
                .toBuffer({ resolveWithObject: true });

            const channels = info.channels;
            const frameBytes = width * pageHeight * channels;

            let fps = 15;
            if (Array.isArray(metadata.delay) && metadata.delay.length) {
                const avgDelayMs =
                    metadata.delay.reduce((a, b) => a + b, 0) / metadata.delay.length;
                if (avgDelayMs > 0) {
                    fps = Math.min(30, Math.max(1, Math.round(1000 / avgDelayMs)));
                }
            }

            const writes = [];
            for (let i = 0; i < pageCount; i++) {
                const frameBuffer = data.subarray(i * frameBytes, (i + 1) * frameBytes);
                const frameName = path.join(
                    framesDir,
                    `frame_${String(i).padStart(5, '0')}.png`
                );
                writes.push(
                    sharp(frameBuffer, {
                        raw: { width, height: pageHeight, channels }
                    })
                        .png()
                        .toFile(frameName)
                );
            }
            await Promise.all(writes);

            await new Promise((resolve, reject) => {
                ffmpeg()
                    .input(path.join(framesDir, 'frame_%05d.png'))
                    .inputFPS(fps)
                    .outputOptions([
                        '-c:v', 'libx264',
                        '-pix_fmt', 'yuv420p',
                        '-movflags', '+faststart',
                        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2'
                    ])
                    .on('error', reject)
                    .on('end', resolve)
                    .save(outputPath);
            });

            return await fs.promises.readFile(outputPath);
        } catch (error) {
            console.error('Sticker to video conversion error:', error);
            throw new Error('Failed to convert sticker to video');
        } finally {
            await fs.promises.rm(framesDir, { recursive: true, force: true }).catch(() => {});
            await fs.promises.unlink(outputPath).catch(() => {});
        }
    }

    async fetchImage(url) {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            return response.data;
        } catch (error) {
            console.error("Error fetching image:", error);
            throw new Error("Could not fetch image.");
        }
    }

    async fetchGif(url) {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            return response.data;
        } catch (error) {
            console.error("Error fetching GIF:", error);
            throw new Error("Could not fetch GIF.");
        }
    }
}

module.exports = new StickerMaker();
