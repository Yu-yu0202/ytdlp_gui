'use strict';
import { contextBridge, ipcRenderer } from 'electron';
import * as path from 'path';

const YtdlpHandler = require(path.join(__dirname, 'handler', 'ytdlpHandler')).YtdlpHandler;

contextBridge.exposeInMainWorld('ytdlp', {
    version: () => YtdlpHandler.version(),
    download: async (url: string, outputPath: string | undefined, formatType: string, stdout: HTMLElement, stderr: HTMLElement, ext: string) => {
        const child = await YtdlpHandler.download(url, outputPath, formatType as any, stdout, stderr, ext);
        
        child.stdout?.on('data', (chunk: any) => {
            ipcRenderer.send('ytdlp-stdout-renderer', chunk.toString());
        });
        
        child.stderr?.on('data', (chunk: any) => {
            ipcRenderer.send('ytdlp-stderr-renderer', chunk.toString());
        });
        
        child.on('close', (code: number) => {
            ipcRenderer.send('ytdlp-stdout-renderer', `process is exited by code ${code}`);
        });
        
        return new Promise((resolve, reject) => {
            child.on('close', (code: number) => {
                if (code === 0) {
                    resolve(`Download completed: ${outputPath}`);
                } else {
                    reject(new Error(`yt-dlp process exited with code ${code}`));
                }
            });
        });
    },
    onStdout: (callback: (data: string) => void) => {
        ipcRenderer.on('ytdlp-stdout-renderer', (_, data) => callback(data));
    },
    onStderr: (callback: (data: string) => void) => {
        ipcRenderer.on('ytdlp-stderr-renderer', (_, data) => callback(data));
    }
});