import React, { useState, useEffect } from 'react'

function Timer({ durationMinutes }) {
    const [timeLeft, setTimeLeft] = useState(durationMinutes * 60)

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0) {
                    clearInterval(interval)
                    alert('Time is up! Exam auto-submitted.')
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60

    return (
        <div className="text-center p-4">
            <h2 className="text-lg">Time Left: {`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}</h2>
        </div>
    )
}

export default Timer