import type { ReactNode } from "react"
import Navbar from "./Navbar"
import Footer from "./Footer"
import FloatingActions from "./FloatingActions"

interface MainLayoutProps {
    children: ReactNode
}

const MainLayout = ({ children }: MainLayoutProps) => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50/50">
            <Navbar />
            <FloatingActions />
            <main className="flex-1 w-full bg-[#f9f9f9]">
                {children}
            </main>
            <Footer />
        </div>
    )
}

export default MainLayout
