import { useState,useEffect } from "react";
import Sidebar from "./components/AppLayout/Sidebar";
import Footer from "./components/AppLayout/Footer";
import Navbar from "./components/AppLayout/Navbar";
import App from "./components/AppLayout/App";
import ChatBot from "./components/Chatbot/ChatBot";

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (windowWidth < 768) {
            setIsSidebarOpen(false);
        } else if (windowWidth > 1024) {
            setIsSidebarOpen(true);
        }
    }, [windowWidth]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };
    return (
        <div className="flex flex-col min-h-screen overflow-x-hidden">
            <div className="flex flex-1 w-full">
                <div className={`h-screen sticky top-0 ${isSidebarOpen ? "w-72 flex-shrink-0" : "w-0"} transition-all duration-500 ease-in-out bg-white z-40`}>
                    {isSidebarOpen && <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />}
                </div>
                <div className="flex flex-col w-full min-w-0">
                    <Navbar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                    <div className="flex-1">
                        <App />
                    </div>
                </div>
            </div>
            <Footer />
            <ChatBot />
        </div>
    );
};

export default Layout;
