import React, { useRef, useEffect } from 'react'
import axios from 'axios'

function WebcamProctor() {
    const videoRef = useRef(null)

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                videoRef.current.srcObject = stream
            })
            .catch(err => console.error('Webcam error:', err))

        const captureAndSend = () => {
            const canvas = document.createElement('canvas')
            canvas.width = 640
            canvas.height = 480
            canvas.getContext('2d').drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
            const imageData = canvas.toDataURL('image/png')

            axios.post('http://localhost:5000/api/proctoring/analyze-frame', { image: imageData }, { withCredentials: true })
                .then(() => console.log('Image sent'))
                .catch(err => console.error(err))
        }

        const interval = setInterval(captureAndSend, 10000)
        return () => clearInterval(interval)
    }, [])

    return <video ref={videoRef} autoPlay className="mx-auto my-4 rounded shadow-lg" />
}

export default WebcamProctor