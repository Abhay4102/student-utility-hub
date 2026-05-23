import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import { WelcomePopup } from "@/components/WelcomePopup";

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
const NotesMaker = lazy(() => import("@/pages/ai/NotesMaker"));
const Paraphraser = lazy(() => import("@/pages/ai/Paraphraser"));
const AiDetector = lazy(() => import("@/pages/ai/AiDetector"));
const CitationGenerator = lazy(() => import("@/pages/ai/CitationGenerator"));
const GpaCalculator = lazy(() => import("@/pages/tools/GpaCalculator"));
const AttendanceCalculator = lazy(() => import("@/pages/tools/AttendanceCalculator"));
const PdfToWord = lazy(() => import("@/pages/pdf/PdfToWord"));
const WordToPdf = lazy(() => import("@/pages/pdf/WordToPdf"));
const Timer = lazy(() => import("@/pages/tools/Timer"));
const QrGenerator = lazy(() => import("@/pages/tools/QrGenerator"));
const YoutubeSummarizer = lazy(() => import("@/pages/ai/YoutubeSummarizer"));
const About = lazy(() => import("@/pages/legal/About"));
const Contact = lazy(() => import("@/pages/legal/Contact"));
const Privacy = lazy(() => import("@/pages/legal/Privacy"));
const Terms = lazy(() => import("@/pages/legal/Terms"));
const Copyright = lazy(() => import("@/pages/legal/Copyright"));

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA_ID = "G-LBPC85MY75";

function AnalyticsTracker() {
  const [location] = useLocation();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    const fullPath = base + (location || "/");
    const send = () => {
      if (typeof window.gtag === "function") {
        window.gtag("event", "page_view", {
          page_path: fullPath,
          page_location: window.location.origin + fullPath,
          page_title: document.title,
          send_to: GA_ID,
        });
      }
    };
    if (typeof window.gtag === "function") {
      send();
    } else {
      const t = window.setInterval(() => {
        if (typeof window.gtag === "function") {
          send();
          window.clearInterval(t);
        }
      }, 500);
      window.setTimeout(() => window.clearInterval(t), 10000);
    }
  }, [location]);
  return null;
}

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
        <Route path="/ai/notes-maker" component={NotesMaker} />
        <Route path="/ai/paraphraser" component={Paraphraser} />
        <Route path="/ai/ai-detector" component={AiDetector} />
        <Route path="/ai/citation-generator" component={CitationGenerator} />
        <Route path="/tools/gpa-calculator" component={GpaCalculator} />
        <Route path="/tools/attendance-calculator" component={AttendanceCalculator} />
        <Route path="/pdf/pdf-to-word" component={PdfToWord} />
        <Route path="/pdf/word-to-pdf" component={WordToPdf} />
        <Route path="/tools/timer" component={Timer} />
        <Route path="/tools/qr-generator" component={QrGenerator} />
        <Route path="/ai/youtube-summarizer" component={YoutubeSummarizer} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/copyright" component={Copyright} />
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
          <AnalyticsTracker />
          <Router />
        </WouterRouter>
        <WelcomePopup />
        <Toaster richColors position="bottom-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
