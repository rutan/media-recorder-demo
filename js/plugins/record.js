(() => {
    class GameRecorder {
        constructor() {
            this._reset();
        }
    
        get result() {
            return this._result;
        }
    
        start() {
            if (this._isRecording) {
                this._pause = false;
                this._recorder.resume();
                return;
            }
    
            this._reset();
            const stream = this._createStream();
    
            const MIMETYPE_LIST = [
                'video/webm;codecs=vp9',
                'video/webm;codecs=vp8',
                'video/webm;codecs=h264',
                'video/webm',
                'video/mpeg'
            ];
            this._mimeType = MIMETYPE_LIST.find((type) => MediaRecorder.isTypeSupported(type))
    
            this._recorder = new MediaRecorder(stream, {mimeType: this._mimeType});
            this._recorder.addEventListener('dataavailable', (e) => {
                this._chunks.push(e.data);
            });
            this._recorder.start(5000);
            this._isRecording = true;
        }
    
        pause() {
            this._pause = true;
            this._recorder.pause();
        }
    
        stop() {
            if (!this._isRecording) return Promise.reject();
    
            return new Promise((resolve) => {
                this._isRecording = false;
                this._recorder.addEventListener('stop', (e) => {
                    this._result = new Blob(this._chunks, {type: this._mimeType});
                    resolve(this._result);
                });
                this._recorder.stop();
            });
        }
    
        _reset() {
            this._chunks = [];
            this._isRecording = false;
            this._pause = false;
            this._result = null;
        }
    
        _createStream() {
            const audioContext =  window.WebAudio._context;
            const audioNode = window.WebAudio._masterGainNode;
            const destination = audioContext.createMediaStreamDestination();
            audioNode.connect(destination);
            const oscillator = audioContext.createOscillator();
            oscillator.connect(destination);
    
            const audioStream = destination.stream;
            const canvasStream = document.querySelector('canvas').captureStream();
    
            const mediaStream = new MediaStream();
            [canvasStream, audioStream].forEach((stream) => {
                stream.getTracks().forEach((track) => mediaStream.addTrack(track));
            });
    
            return mediaStream;
        }
    }

    // ゲーム内から使うのでシングルトンにする
    window.gameRecorder = new GameRecorder();

    // デモ用
    window.gameRecorder.showVideo = function () {
        let video = document.getElementById('my-video');
        if (!video) {
            video = document.createElement('video');
            video.id = 'my-video';
            video.setAttribute('controls', 'controls');
            video.style.position = 'absolute';
            video.style.width = '320px';
            video.style.height = '240px';
            video.style.zIndex = 100;
            document.body.appendChild(video);
        }
        video.src = window.URL.createObjectURL(window.gameRecorder.result);
        video.play();
    };
})();
