import React from 'react'

function Header() {
    return (
        <header className="bg-blue-800 text-white p-4 text-center">
            <img src="/logo.png" alt="AI Proctor Logo" className="h-12 mx-auto"/>
            <h1 className="text-xl">AI Enhanced Exam Proctoring System</h1>
        </header>
    )
}

export default Header