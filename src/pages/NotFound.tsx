import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

const NotFound = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
            <h1 className="text-6xl font-bold">404</h1>
            <p className="text-muted-foreground">Page not found</p>
            <Button asChild>
                <Link to="/">Go Home</Link>
            </Button>
        </div>
    )
}
export default NotFound
