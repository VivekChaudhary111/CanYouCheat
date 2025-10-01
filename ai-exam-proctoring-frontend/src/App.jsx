import React from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import WebcamProctor from './components/WebcamProctor'
import Timer from './components/Timer'

function App() {
    return(
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow text-center p-4">
                <h1 className="text-3xl mb-6">Exam In Progress</h1>
                <Timer durationMinutes={30} />
                <WebcamProctor />
                <button className="bg-red-600 text-white px-4 py-2 rounded mt-4">Submit Exam</button>
            </main>
            <Footer />
        </div>
    )
}

export default App
