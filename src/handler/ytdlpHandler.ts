import { spawn, ChildProcess, exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as os from 'os';

type Formats = "bestaudio" | "bestaudio[ext=webm]" | "bestaudio[ext=m4a]" | "bestaudio[ext=mp3]" | "bestaudio[ext=flac]" | "bestmovie"

const YTDLP_URLS = {
    win32: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
    darwin: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
    linux: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp'
};
export class YtdlpHandler {
    private static ytdlpPath: string = '';
    private static readonly appDataPath = path.join(os.homedir(), '.ytdlp-electron');

    private static async isYtdlpInstalled(): Promise<boolean> {
        return new Promise((resolve) => {
            exec('yt-dlp --version', (error) => {
                if (error) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    private static async downloadYtdlp(): Promise<string> {
        if (!fs.existsSync(this.appDataPath)) {
            fs.mkdirSync(this.appDataPath, { recursive: true });
        }

        const platform = os.platform();
        const downloadUrl = YTDLP_URLS[platform as keyof typeof YTDLP_URLS];
        if (!downloadUrl) {
            throw new Error(`Unsupported platform: ${platform}`);
        }

        const ytdlpPath = path.join(this.appDataPath, platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(ytdlpPath);
            https.get(downloadUrl, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    if (platform !== 'win32') {
                        fs.chmodSync(ytdlpPath, '755');
                    }
                    resolve(ytdlpPath);
                });
            }).on('error', (err) => {
                fs.unlink(ytdlpPath, () => {});
                reject(err);
            });
        });
    }

    private static async ensureYtdlp(): Promise<string> {
        if (this.ytdlpPath) {
            return this.ytdlpPath;
        }

        const isInstalled = await this.isYtdlpInstalled();
        if (isInstalled) {
            this.ytdlpPath = 'yt-dlp';
            return this.ytdlpPath;
        }

        try {
            this.ytdlpPath = await this.downloadYtdlp();
            return this.ytdlpPath;
        } catch (error: any) {
            throw new Error(`Failed to download yt-dlp: ${(error as Error).message}`);
        }
    }
    public static async version(): Promise<string> {
        const ytdlpPath = await this.ensureYtdlp();
        return new Promise((resolve, reject) => {
            const child: ChildProcess = spawn(ytdlpPath, ['--version']);

            let versionOutput = '';
            child.stdout?.on('data', (data) => {
                versionOutput += data.toString();
            });
    
            child.stderr?.on('data', (data) => {
                console.error(`stderr: ${data}`);
            });
    
            child.on('close', (code) => {
                if (code === 0) {
                    resolve(versionOutput.trim());
                } else {
                    reject(new Error(`yt-dlp process exited with code ${code}`));
                }
            });
        });
    }

    public static sanitizePath(Path: string, ext: string) {
        if (!path.isAbsolute(Path)) {
            const appPath = process.env.PORTABLE_EXECUTABLE_DIR || process.cwd();
            Path = path.resolve(appPath, Path);
        }
        if (!Path.endsWith(`.${ext}`)) {
            Path += `.${ext}`
        }
        return Path;
    }

    public static async download(
        url: string,
        downloadpath: string | null | undefined,
        format: Formats,
        stdout: HTMLElement,
        stderr: HTMLElement,
        ext: string
    ): Promise<ChildProcess> {
        const ytdlpPath = await this.ensureYtdlp();

        if (downloadpath) {
            downloadpath = this.sanitizePath(downloadpath, ext);

            if (!path.isAbsolute(downloadpath)) {
                const appPath = process.env.PORTABLE_EXECUTABLE_DIR || process.cwd();
                downloadpath = path.resolve(appPath, downloadpath);
            }
        
            const downloadDir = path.dirname(downloadpath);
            if (!fs.existsSync(downloadDir)) {
                fs.mkdirSync(downloadDir, { recursive: true });
            }
        }

        let args: string[] = ['-f', format];
        if (downloadpath != null) {
            args.push('-o', downloadpath);
        }
        if (url.match(/^(https?:\/\/)?(www\.)?youtube\.com\/playlist\?list=/)) {
            args.push('--yes-playlist');
        }
        args.push(url);

        const child: ChildProcess = spawn(ytdlpPath, args, {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        child.stdout?.on('data', (data: string) => {
            if (stdout) {
                if (stdout instanceof HTMLTextAreaElement) {
                    stdout.value += data;
                } else if (stdout.textContent !== undefined) {
                    stdout.textContent += data;
                }
            }
            console.log(`stdout: ${data}`);
        });

        child.stderr?.on('data', (data: string) => {
            if (stderr) {
                if (stderr instanceof HTMLTextAreaElement) {
                    stderr.value += data;
                } else if (stderr.textContent !== undefined) {
                    stderr.textContent += data;
                }
            }
            console.error(`stderr: ${data}`);
        });

        child.on('error', (err) => {
            console.error('Failed to start yt-dlp process:', err);
            throw err;
        });

        return child;
    }
}