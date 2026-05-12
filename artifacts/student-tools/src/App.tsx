import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/Home"));
const Calculator = lazy(() => import("@/pages/Calculator"));
const JpgToPdf = lazy(() => import("@/pages/image/JpgToPdf"));
const PdfToJpg = lazy(() => import("@/pages/image/PdfToJpg"));
const JpgToPng = lazy(() => import("@/pages/image/JpgToPng"));
const PngToJpg = lazy(() => import("@/pages/image/PngToJpg"));
const PngToPdf = lazy(() => import("@/pages/image/PngToPdf"));
const PdfToPng = lazy(() => import("@/pages/image/PdfToPng"));
const PhotoResizer = lazy(() => import("@/pages/image/PhotoResizer"));
const BackgroundRemover = lazy(() => import("@/pages/image/BackgroundRemover"));
const PdfMaker = lazy(() => import("@/pages/pdf/PdfMaker"));
const PdfEditor = lazy(() => import("@/pages/pdf/PdfEditor"));
const PdfLocker = lazy(() => import("@/pages/pdf/PdfLocker"));
const PdfUnlocker = lazy(() => import("@/pages/pdf/PdfUnlocker"));
const PdfMerger = lazy(() => import("@/pages/pdf/PdfMerger"));
const PdfSplitter = lazy(() => import("@/pages/pdf/PdfSplitter"));
const PdfCompressor = lazy(() => import("@/pages/pdf/PdfCompressor"));
const TextToPdf = lazy(() => import("@/pages/pdf/TextToPdf"));
const WordMaker = lazy(() => import("@/pages/docs/WordMaker"));
const UnitConverter = lazy(() => import("@/pages/tools/UnitConverter"));
const PeriodicTable = lazy(() => import("@/pages/science/PeriodicTable"));
const PhysicsCalculator = lazy(() => import("@/pages/science/PhysicsCalculator"));
const StudyAssistant = lazy(() => import("@/pages/ai/StudyAssistant"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/calculator" component={Calculator} />
        <Route path="/image/jpg-to-pdf" component={JpgToPdf} />
        <Route path="/image/pdf-to-jpg" component={PdfToJpg} />
        <Route path="/image/jpg-to-png" component={JpgToPng} />
        <Route path="/image/png-to-jpg" component={PngToJpg} />
        <Route path="/image/png-to-pdf" component={PngToPdf} />
        <Route path="/image/pdf-to-png" component={PdfToPng} />
        <Route path="/image/resize" component={PhotoResizer} />
        <Route path="/image/background" component={BackgroundRemover} />
        <Route path="/pdf/maker" component={PdfMaker} />
        <Route path="/pdf/editor" component={PdfEditor} />
        <Route path="/pdf/lock" component={PdfLocker} />
        <Route path="/pdf/unlock" component={PdfUnlocker} />
        <Route path="/pdf/merge" component={PdfMerger} />
        <Route path="/pdf/split" component={PdfSplitter} />
        <Route path="/pdf/compress" component={PdfCompressor} />
        <Route path="/pdf/text-to-pdf" component={TextToPdf} />
        <Route path="/docs/word-maker" component={WordMaker} />
        <Route path="/tools/unit-converter" component={UnitConverter} />
        <Route path="/science/periodic-table" component={PeriodicTable} />
        <Route path="/science/physics-calculator" component={PhysicsCalculator} />
        <Route path="/ai/study-assistant" component={StudyAssistant} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster richColors position="bottom-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
