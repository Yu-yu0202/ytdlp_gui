document.addEventListener("DOMContentLoaded", async () => {
    console.info("[debug]: DOMContentLoaded Called");
    const ytdlp_version_span: HTMLElement | null = document.getElementById('ytdlp_version');
    const ytdlp_version: string = await window.ytdlp.version();
    if (ytdlp_version_span) {
        ytdlp_version_span.textContent = ytdlp_version;
    } else {
        console.warn("[debug]: ytdlp_version_span not found");
    }
    window.ytdlp.onStdout((line: string) => {
        console.info("[debug]: Stdout:", line);
        if (stdOut) {
            stdOut.textContent += line + "\n";
        } else {
            console.warn("[debug]: stdOut element not found");
        }
    });
    window.ytdlp.onStderr((line: string) => {
        console.error("[debug]: Stderr:", line);
        if (stdErr) {
            stdErr.textContent += line + "\n";
        } else {
            console.warn("[debug]: stdErr element not found");
        }
    });
});

const downloadButton: HTMLElement | null = document.getElementById('download');
const stdOut: HTMLElement | null = document.getElementById('stdout');
const stdErr: HTMLElement | null = document.getElementById('stderr');
const messageArea: HTMLElement | null = document.getElementById('message-area');

function showMessage(message: string, type: 'success' | 'failure') {
    if (messageArea) {
        messageArea.textContent = message;
        messageArea.className = ''; // Remove existing classes
        messageArea.classList.add(type === 'success' ? 'message-success' : 'message-failure');
        messageArea.style.display = 'block';
        setTimeout(() => {
            if (messageArea) {
                messageArea.style.display = 'none';
                messageArea.textContent = '';
                messageArea.className = '';
            }
        }, 5000); // 5秒後にメッセージを非表示にする
    }
}

downloadButton?.addEventListener('click', async (event: MouseEvent) => {
    console.info("[debug]: Download button clicked");
    event.preventDefault();
    const url: string | null = (document.getElementById('vurl') as HTMLInputElement).value;
    const outputPath: string | null = (document.getElementById('filename') as HTMLInputElement).value;
    const formatType: string = (document.getElementById('format') as HTMLSelectElement).value;
    if (!url || !outputPath || !formatType) {
        console.error("[debug]: Missing input values");
        alert("Please fill in all fields.");
        return;
    }
    try {
        const result: string = await window.ytdlp.download(url, outputPath, formatType);
        console.info("[debug]: Download successful", result);
        showMessage("ダウンロードが完了しました！", 'success');
    } catch (error: any) {
        console.error("[debug]: Download failed", error);
        alert(`Download failed: ${error.message}`);
        showMessage(`ダウンロードに失敗しました: ${error.message}`, 'failure');
    }
});