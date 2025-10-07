import React from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import WebcamProctor from './components/WebcamProctor'
import Timer from './components/Timer'

function App() {
  // exam submit handler
  const handleSubmit = () => {
    if (window.confirm("Are you sure you want to submit the exam?")) {
      // 🔹 here you can call your backend API to finalize submission
      alert("✅ Exam submitted successfully!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow text-center p-4 max-w-2xl mx-auto" role="main">
        <h1 className="text-3xl font-bold mb-6">Exam In Progress</h1>

        {/* Timer with auto-submit */}
        <Timer durationMinutes={30} onTimeUp={handleSubmit} />

        {/* Webcam proctoring */}
        <WebcamProctor />

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          className="bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-400 text-white px-6 py-2 rounded-lg mt-6 transition"
          aria-label="Submit Exam"
        >
          Submit Exam
        </button>
      </main>
      <Footer />
    </div>
  );
}

export default App;
