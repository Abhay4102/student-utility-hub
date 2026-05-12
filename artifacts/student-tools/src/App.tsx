import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Calculator from "@/pages/Calculator";
import JpgToPdf from "@/pages/image/JpgToPdf";
import PdfToJpg from "@/pages/image/PdfToJpg";
import JpgToPng from "@/pages/image/JpgToPng";
import PngToJpg from "@/pages/image/PngToJpg";
import PngToPdf from "@/pages/image/PngToPdf";
import PdfToPng from "@/pages/image/PdfToPng";
import PhotoResizer from "@/pages/image/PhotoResizer";
import BackgroundRemover from "@/pages/image/BackgroundRemover";
import PdfMaker from "@/pages/pdf/PdfMaker";
import PdfEditor from "@/pages/pdf/PdfEditor";
import PdfLocker from "@/pages/pdf/PdfLocker";
import PdfUnlocker from "@/pages/pdf/PdfUnlocker";
import PdfMerger from "@/pages/pdf/PdfMerger";
import PdfSplitter from "@/pages/pdf/PdfSplitter";
import PdfCompressor from "@/pages/pdf/PdfCompressor";
import TextToPdf from "@/pages/pdf/TextToPdf";
import WordMaker from "@/pages/docs/WordMaker";

const queryClient = new QueryClient();

function Router() {
  return (
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
      <Route component={NotFound} />
    </Switch>
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
