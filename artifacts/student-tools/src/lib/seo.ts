export interface FaqItem {
  q: string;
  a: string;
}

export interface SeoEntry {
  title: string;
  description: string;
  keywords?: string;
  h1?: string;
  intro?: string;
  howToSteps?: string[];
  benefits?: string[];
  faqs?: FaqItem[];
  related?: { href: string; title: string }[];
  schemaType?: "WebApplication" | "WebPage";
  noContent?: boolean;
}

export const SITE_NAME = "TREO TOOL'S";
export const SITE_URL = "https://treotools.in";
export const SITE_DEFAULT_DESCRIPTION =
  "TREO TOOL'S — your all-in-one student toolkit. PDF, image, document and AI tools, 100% in your browser. Free, fast, no signup.";

const allTools = {
  studyAssistant: { href: "/ai/study-assistant", title: "AI Study Assistant" },
  notesMaker: { href: "/ai/notes-maker", title: "AI Notes Maker" },
  paraphraser: { href: "/ai/paraphraser", title: "AI Paraphraser" },
  aiDetector: { href: "/ai/ai-detector", title: "AI Content Detector" },
  citation: { href: "/ai/citation-generator", title: "Citation Generator" },
  gpa: { href: "/tools/gpa-calculator", title: "GPA Calculator" },
  attendance: { href: "/tools/attendance-calculator", title: "Attendance Calculator" },
  calculator: { href: "/calculator", title: "Scientific Calculator" },
  unit: { href: "/tools/unit-converter", title: "Unit Converter" },
  timer: { href: "/tools/timer", title: "Timer & Clock" },
  qr: { href: "/tools/qr-generator", title: "QR Code Generator" },
  periodic: { href: "/science/periodic-table", title: "Periodic Table" },
  physics: { href: "/science/physics-calculator", title: "Physics Calculator" },
  jpgPdf: { href: "/image/jpg-to-pdf", title: "JPG to PDF" },
  pdfJpg: { href: "/image/pdf-to-jpg", title: "PDF to JPG" },
  jpgPng: { href: "/image/jpg-to-png", title: "JPG to PNG" },
  pngJpg: { href: "/image/png-to-jpg", title: "PNG to JPG" },
  pngPdf: { href: "/image/png-to-pdf", title: "PNG to PDF" },
  pdfPng: { href: "/image/pdf-to-png", title: "PDF to PNG" },
  resize: { href: "/image/resize", title: "Photo Resizer" },
  bgRemove: { href: "/image/background", title: "Background Remover" },
  pdfMaker: { href: "/pdf/maker", title: "PDF Maker" },
  pdfEditor: { href: "/pdf/editor", title: "PDF Editor" },
  pdfLock: { href: "/pdf/lock", title: "PDF Locker" },
  pdfUnlock: { href: "/pdf/unlock", title: "PDF Unlocker" },
  pdfMerge: { href: "/pdf/merge", title: "PDF Merger" },
  pdfSplit: { href: "/pdf/split", title: "PDF Splitter" },
  pdfCompress: { href: "/pdf/compress", title: "PDF Compressor" },
  textPdf: { href: "/pdf/text-to-pdf", title: "Text to PDF" },
  pdfWord: { href: "/pdf/pdf-to-word", title: "PDF to Word" },
  wordPdf: { href: "/pdf/word-to-pdf", title: "Word to PDF" },
  wordMaker: { href: "/docs/word-maker", title: "Word File Maker" },
};

export const SEO_MAP: Record<string, SeoEntry> = {
  "/": {
    title: "TREO TOOL'S — Free Student Toolkit (PDF, Image, AI & Study Tools)",
    description: SITE_DEFAULT_DESCRIPTION,
    keywords: "student tools, free online tools, pdf tools, image converter, ai notes maker, gpa calculator, citation generator, paraphraser, ai detector, background remover, photo resizer",
    noContent: true,
  },

  // ---------- AI ----------
  "/ai/study-assistant": {
    title: "AI Study Assistant — Free Homework & Doubt Solver | TREO TOOL'S",
    description: "Ask any academic question in text, voice or image — get clear, step-by-step AI answers tutored for students. Free, no signup.",
    keywords: "ai study assistant, homework solver, ai tutor, doubt solver, ask ai questions, chatgpt for students, free ai tutor",
    intro: "AI Study Assistant is a free study buddy that answers academic questions across maths, science, history, programming and more. Type, speak or upload a photo of your textbook problem — you'll get a clear, structured explanation in seconds.",
    howToSteps: [
      "Type your question, or tap the mic to speak, or upload an image of the problem.",
      "Pick a mode — concise for quick answers, detailed for full explanations, or step-by-step for solving problems.",
      "Optionally choose a subject (Maths, Physics, Biology, etc.) so the AI uses the right terminology.",
      "Hit Ask — the answer streams in real-time with proper formatting, formulas and examples.",
    ],
    benefits: [
      "100% free, no signup or credit card needed.",
      "Solves text, voice and image-based questions (great for textbook screenshots).",
      "Multiple answer modes — concise, detailed, exam-ready, ELI12.",
      "Subject-aware — tailors the explanation for the syllabus you're studying.",
      "Streams answers instantly, so you never wait staring at a loading spinner.",
    ],
    faqs: [
      { q: "Is the AI Study Assistant really free?", a: "Yes — you can ask unlimited questions for free. No signup, no credit card, no daily limits for normal use." },
      { q: "Which subjects does it support?", a: "All academic subjects — Maths, Physics, Chemistry, Biology, History, Geography, English, Economics, Computer Science, programming and more." },
      { q: "Can I upload a photo of a question from my textbook?", a: "Yes. Tap the image button and upload a clear photo. The AI reads the question (including diagrams and equations) and explains it." },
      { q: "Is my data safe?", a: "Yes. We don't store your questions, images or voice recordings. Each session is processed and discarded." },
      { q: "Can it solve exam-style questions?", a: "Yes — pick the 'Exam' mode for answers written in precise mark-scheme style with the keywords examiners look for." },
    ],
    related: [allTools.notesMaker, allTools.paraphraser, allTools.aiDetector, allTools.citation],
  },

  "/ai/notes-maker": {
    title: "AI Notes Maker — Free Study Notes Generator for Students | TREO TOOL'S",
    description: "Generate clean, structured study notes from any topic or source text. 6 formats — outline, Cornell, flashcards, mind map & more. Free.",
    keywords: "ai notes maker, study notes generator, free notes for students, cornell notes online, flashcard generator, revision notes",
    intro: "AI Notes Maker turns any topic or block of source text into clean, exam-ready study notes. Choose between outline, Cornell, bullet, flashcard, mind-map or summary formats — all generated in seconds.",
    howToSteps: [
      "Enter a topic (e.g. 'Photosynthesis') or paste source text from your textbook / lecture.",
      "Pick a format — Outline, Cornell, Bullets, Flashcards, Mind Map or Summary.",
      "Choose detail level (Brief, Standard, Detailed or Exam-prep).",
      "Click Generate — well-structured notes appear instantly, ready to copy or download.",
    ],
    benefits: [
      "6 proven note formats including Cornell and flashcard mode for active recall.",
      "Works from a topic name or from your own pasted text / lecture transcript.",
      "Exam-prep detail level highlights exactly what tends to appear in exams.",
      "Adjusts language to your level — school, undergraduate or postgraduate.",
      "Generates practice questions with answers on demand.",
    ],
    faqs: [
      { q: "What note formats are supported?", a: "Outline, Cornell, Bullets, Flashcards, Mind Map and Summary. Each is tuned for a different study style." },
      { q: "Can I generate notes from my own lecture text?", a: "Yes — paste any source text (up to 18,000 characters) and the AI will structure it into clean notes." },
      { q: "Is it free?", a: "Yes, the AI Notes Maker is completely free with no signup required." },
      { q: "Can I get flashcards instead of normal notes?", a: "Yes — pick the Flashcards format and you'll get 12–20 Q&A cards ready for active recall." },
      { q: "Does it support exam-style notes?", a: "Yes — set detail to 'Exam Prep' to get mark-scheme phrasing, high-yield definitions and worked examples." },
    ],
    related: [allTools.studyAssistant, allTools.paraphraser, allTools.citation, allTools.aiDetector],
  },

  "/ai/paraphraser": {
    title: "Free AI Paraphraser — Rewrite Essays & Beat Plagiarism | TREO TOOL'S",
    description: "Rewrite essays, paragraphs and assignments to be unique and plagiarism-safe. 7 tones — academic, simple, formal, creative & more.",
    keywords: "paraphraser, ai paraphraser, free rewriter, plagiarism remover, essay rewriter, paraphrasing tool, humanize ai text",
    intro: "AI Paraphraser rewrites any block of text in 7 different tones — academic, simple, fluent, formal, creative, shorten or expand — without changing the meaning. Perfect for essays, assignments, blog posts or anywhere you need a fresh, plagiarism-safe version.",
    howToSteps: [
      "Paste up to 12,000 characters of text into the input box.",
      "Pick a tone — Academic, Simple, Fluent, Formal, Creative, Shorten or Expand.",
      "Choose rewrite strength — Light, Medium or Heavy.",
      "Click Paraphrase — the rewritten version streams in instantly, ready to copy.",
    ],
    benefits: [
      "7 distinct tones cover essay writing, business emails, creative writing and more.",
      "Preserves every fact, number, name and citation exactly.",
      "3 strength levels let you control how aggressive the rewrite is.",
      "Reads naturally — actively avoids common AI tells and robotic phrasing.",
      "Free, fast, no signup, no character limits per day.",
    ],
    faqs: [
      { q: "Does paraphrasing remove plagiarism?", a: "Heavy rewrite + a manual proof-read can reduce match scores significantly. Always cite original sources for facts and ideas." },
      { q: "How long can my text be?", a: "Up to 12,000 characters per request (roughly 2,000 words). Split longer documents into chunks." },
      { q: "Will the meaning change?", a: "No — the AI is instructed to preserve every fact, number, name and date exactly. Only the wording and structure change." },
      { q: "Can it 'humanise' AI-written text?", a: "Yes — the Fluent or Creative tones with Heavy strength rewrite text in a more natural, human-like voice." },
      { q: "Is the tool free?", a: "Yes — unlimited free use with no signup." },
    ],
    related: [allTools.aiDetector, allTools.notesMaker, allTools.citation, allTools.studyAssistant],
  },

  "/ai/ai-detector": {
    title: "Advanced AI Content Detector — Free ChatGPT Checker | TREO TOOL'S",
    description: "Detect AI-written text with a 2-pass ensemble of statistical analysis + GPT reasoning. Highlights AI sentences. Free, no signup.",
    keywords: "ai detector, chatgpt detector, ai content checker, gptzero alternative, ai writing detector, originality checker, free ai detection",
    intro: "Advanced AI Detector uses a two-pass system — statistical burstiness & vocabulary analysis combined with GPT-5.1 reasoning — to estimate how likely a piece of text was AI-generated, with sentence-by-sentence highlighting.",
    howToSteps: [
      "Paste the text you want to analyse (minimum ~50 words for reliable results).",
      "Click Analyse — the tool runs both statistical and AI-reasoning passes.",
      "Read the overall AI probability score (0–100%) and breakdown.",
      "Review the sentence-by-sentence heatmap to see which parts look AI-written.",
    ],
    benefits: [
      "Two-stage analysis — far more accurate than single-method detectors.",
      "Sentence-level highlighting shows exactly which lines look AI-written.",
      "Detects common AI tells — clichés, low burstiness, em-dash overuse.",
      "Free, no signup, no daily limit for normal use.",
      "Works on essays, articles, emails, code comments and more.",
    ],
    faqs: [
      { q: "How accurate is the AI detector?", a: "No detector is 100% accurate. We combine statistical signals with LLM reasoning to give the best estimate possible, and we always show a probability score rather than a yes/no verdict." },
      { q: "What text length works best?", a: "At least 50–100 words. Very short snippets don't contain enough signal for reliable detection." },
      { q: "Can it detect text from GPT-4, Claude, Gemini etc?", a: "Yes — it detects general patterns common to modern LLMs, not just one model." },
      { q: "Is heavily edited AI text detectable?", a: "Heavily rewritten or hand-edited AI text becomes harder to detect, which is expected — all detectors have this limit." },
      { q: "Is my text stored?", a: "No — we never store the text you paste in. It's analysed on the fly and discarded." },
    ],
    related: [allTools.paraphraser, allTools.notesMaker, allTools.citation, allTools.studyAssistant],
  },

  "/ai/citation-generator": {
    title: "Free Citation Generator — APA, MLA, Harvard, Chicago | TREO TOOL'S",
    description: "Generate accurate references in APA 7, MLA 9, Harvard, Chicago, IEEE & Vancouver styles — for books, journal articles & websites.",
    keywords: "citation generator, apa citation, mla citation, harvard reference generator, chicago citation, ieee citation, bibliography generator, free reference maker",
    intro: "Citation Generator creates accurate bibliography entries in 6 major styles — APA 7, MLA 9, Harvard, Chicago, IEEE and Vancouver — for books, journal articles and websites.",
    howToSteps: [
      "Pick the source type — Book, Journal Article or Website.",
      "Enter the source details (author, title, year, etc.).",
      "Choose your citation style (APA 7, MLA 9, Harvard, Chicago, IEEE or Vancouver).",
      "Copy the formatted citation directly into your bibliography.",
    ],
    benefits: [
      "Supports the 6 most-used academic citation styles.",
      "Handles books, journal articles and websites — the three most common source types.",
      "Generates properly formatted references including italics, punctuation and DOI links.",
      "100% free, no account needed.",
      "Copy-paste ready output — no manual reformatting.",
    ],
    faqs: [
      { q: "Which citation styles are supported?", a: "APA 7th edition, MLA 9th edition, Harvard, Chicago (author-date), IEEE and Vancouver." },
      { q: "Can I cite a website with no author?", a: "Yes — leave the author field blank and the citation will fall back to the website / organisation name." },
      { q: "Does it support in-text citations?", a: "Yes — the generated reference shows both the full bibliography entry and the in-text format for the chosen style." },
      { q: "Is this free?", a: "Yes, 100% free with no signup." },
      { q: "Does it generate DOI links?", a: "Yes — paste the DOI in the right field and it will be formatted correctly for the chosen style." },
    ],
    related: [allTools.paraphraser, allTools.notesMaker, allTools.aiDetector, allTools.studyAssistant],
  },

  // ---------- Utilities ----------
  "/tools/gpa-calculator": {
    title: "GPA / CGPA Calculator (India 10-point scale) | TREO TOOL'S",
    description: "Free GPA, CGPA, SGPA and percentage calculator for Indian universities (10-point grading scale). Mobile friendly, instant results.",
    keywords: "gpa calculator, cgpa calculator, sgpa calculator, india gpa calculator, percentage from cgpa, 10 point gpa, grade calculator india",
    intro: "GPA Calculator helps Indian students compute their SGPA, CGPA and the equivalent percentage on the standard 10-point grading scale used by most Indian universities (AICTE, VTU, Anna, MAKAUT, etc.).",
    howToSteps: [
      "Add each subject with its credit / credit hours and the grade you got (or grade point).",
      "Repeat for all subjects in the semester to get your SGPA.",
      "Add multiple semesters to compute your overall CGPA.",
      "View the equivalent percentage instantly (using the standard CGPA × 9.5 formula).",
    ],
    benefits: [
      "Built specifically for the Indian 10-point grading scale.",
      "Calculates SGPA, CGPA and percentage in one place.",
      "Supports any number of subjects and semesters.",
      "Saves your last entries in the browser so you don't lose data.",
      "100% free, no signup, mobile friendly.",
    ],
    faqs: [
      { q: "How is CGPA converted to percentage?", a: "Most Indian universities use the formula: Percentage = CGPA × 9.5. Some universities use 10. Always check your institution's official conversion." },
      { q: "What is the difference between SGPA and CGPA?", a: "SGPA is the GPA for a single semester. CGPA is the cumulative GPA averaged across all completed semesters." },
      { q: "Does it work for engineering universities like VTU, Anna, AKTU?", a: "Yes — the 10-point credit-weighted formula used here matches the AICTE-style grading followed by most Indian engineering universities." },
      { q: "Is my data saved anywhere?", a: "Only in your own browser (localStorage). Nothing is sent to a server." },
      { q: "Can I calculate CGPA from multiple semesters?", a: "Yes — add all semester SGPAs with their total credits and the tool gives you the overall CGPA." },
    ],
    related: [allTools.attendance, allTools.calculator, allTools.unit, allTools.physics],
  },

  "/tools/attendance-calculator": {
    title: "Attendance Calculator — How Many Classes Can I Skip? | TREO TOOL'S",
    description: "Find out exactly how many classes you can skip while staying above 75% attendance — or how many you must attend to recover. Free.",
    keywords: "attendance calculator, bunk calculator, 75 percent attendance, classes can i skip, attendance percentage calculator, college bunk planner",
    intro: "Attendance Calculator tells you exactly how many classes you can safely bunk while staying above your university's minimum attendance requirement (usually 75%) — or how many you must still attend to recover.",
    howToSteps: [
      "Enter the total number of classes held so far.",
      "Enter the number of classes you have attended.",
      "Set your target percentage (default 75%).",
      "See exactly how many more classes you can skip — or must attend — to hit your target.",
    ],
    benefits: [
      "Tells you the exact number of bunks you can afford safely.",
      "Recovery mode shows how many classes you must attend to catch up.",
      "Adjustable target percentage (75%, 80%, 85% etc.).",
      "Works for any course — engineering, medical, school, etc.",
      "100% free, no signup, mobile friendly.",
    ],
    faqs: [
      { q: "Why is 75% attendance the default?", a: "Most Indian universities (AICTE, MCI, university grants commission etc.) set 75% as the minimum required attendance to sit for the end-semester exam." },
      { q: "Can I set a different target like 80%?", a: "Yes — change the target field to any percentage your institution requires." },
      { q: "Does it account for future classes?", a: "Yes — enter the total expected classes for the semester and it will project your final attendance." },
      { q: "Is it free?", a: "Yes, completely free with no signup." },
      { q: "Does it work on mobile?", a: "Yes — fully mobile responsive." },
    ],
    related: [allTools.gpa, allTools.calculator, allTools.timer, allTools.unit],
  },

  "/calculator": {
    title: "Free Online Scientific Calculator with History | TREO TOOL'S",
    description: "A free scientific calculator with trig, log, powers, brackets and a full calculation history. Works on desktop and mobile.",
    keywords: "scientific calculator, online calculator, free calculator, trigonometry calculator, log calculator, math calculator",
    intro: "Scientific Calculator gives you all the standard scientific functions — trigonometry, logarithms, powers, square roots and bracket support — together with a running history of every calculation you do.",
    howToSteps: [
      "Tap or type numbers, operators and scientific functions.",
      "Use brackets to control order of operations.",
      "Switch between degrees and radians for trig functions.",
      "Tap any past result in the history to re-use it.",
    ],
    benefits: [
      "Full scientific function set — sin, cos, tan, log, ln, x², √, π, e and more.",
      "Bracket support for complex expressions.",
      "Running calculation history.",
      "Keyboard input on desktop, touch-friendly on mobile.",
      "Free, works offline once loaded.",
    ],
    faqs: [
      { q: "Does it support trigonometric functions?", a: "Yes — sin, cos, tan, plus inverse functions, in degrees or radians." },
      { q: "Can I re-use a past result?", a: "Yes — tap any entry in the history panel to insert it into your current expression." },
      { q: "Does it work offline?", a: "Yes — once the page is loaded it works fully offline in your browser." },
      { q: "Is it free?", a: "Yes, completely free with no signup." },
      { q: "Is there a keyboard shortcut?", a: "Yes — you can type numbers and operators directly on desktop." },
    ],
    related: [allTools.gpa, allTools.unit, allTools.physics, allTools.attendance],
  },

  "/tools/unit-converter": {
    title: "Free Unit Converter — Length, Weight, Temperature & More | TREO TOOL'S",
    description: "Convert between any units — length, weight, temperature, speed, volume, area, time and more. Instant, accurate and free.",
    keywords: "unit converter, length converter, weight converter, temperature converter, metric to imperial, km to miles, kg to pounds",
    intro: "Unit Converter handles every common conversion you need — length, weight, temperature, speed, volume, area, time and more — between metric and imperial units instantly.",
    howToSteps: [
      "Pick a category (Length, Weight, Temperature, etc.).",
      "Enter the value you want to convert.",
      "Choose the 'from' and 'to' units.",
      "The converted value appears instantly.",
    ],
    benefits: [
      "Covers 8+ unit categories with all common units.",
      "Two-way conversion — swap units with one tap.",
      "Handles metric ↔ imperial in both directions.",
      "Mobile-friendly with large input fields.",
      "Free, instant, no signup.",
    ],
    faqs: [
      { q: "What units are supported?", a: "Length, weight, temperature, speed, volume, area and time — with all common metric and imperial units in each." },
      { q: "How precise are the results?", a: "Conversions use standard SI definitions and are accurate to ~10 decimal places." },
      { q: "Can I convert between Celsius and Fahrenheit?", a: "Yes — temperature conversions support Celsius, Fahrenheit and Kelvin." },
      { q: "Is it free?", a: "Yes, completely free with no signup." },
      { q: "Does it work on mobile?", a: "Yes — fully responsive with touch-friendly buttons." },
    ],
    related: [allTools.calculator, allTools.physics, allTools.gpa, allTools.periodic],
  },

  "/tools/timer": {
    title: "Free Online Timer, Stopwatch, Alarm & World Clock | TREO TOOL'S",
    description: "All-in-one timer — countdown timer, stopwatch, multiple alarms and a world clock. Perfect for study sessions and exams. Free.",
    keywords: "online timer, stopwatch, countdown timer, study timer, pomodoro timer, alarm online, world clock",
    intro: "Timer & Clock combines a countdown timer, a stopwatch, multiple alarms and a world clock — all in one page, perfect for study sessions, the pomodoro technique, exams and travel.",
    howToSteps: [
      "Pick the tab you need — Timer, Stopwatch, Alarms or World Clock.",
      "For the Timer: set hours/minutes/seconds and hit Start.",
      "For Alarms: add as many alarms as you want, each with its own time and label.",
      "For World Clock: add the cities you care about to see all their times side-by-side.",
    ],
    benefits: [
      "4 tools in 1 — timer, stopwatch, alarm, world clock.",
      "Multiple simultaneous alarms with custom labels.",
      "Browser-tab title shows live time so you can see it from other tabs.",
      "World clock with major cities pre-loaded.",
      "Free, no signup, works on mobile.",
    ],
    faqs: [
      { q: "Can I set multiple alarms?", a: "Yes — add as many alarms as you want, each with its own time and label." },
      { q: "Does it keep running if I switch tabs?", a: "Yes — the timer and stopwatch keep running in the background." },
      { q: "Is there a pomodoro mode?", a: "Yes — set a 25-minute timer for focus and a 5-minute one for breaks, repeat as needed." },
      { q: "Does the world clock auto-update?", a: "Yes — all clocks update every second." },
      { q: "Is it free?", a: "Yes, completely free with no signup." },
    ],
    related: [allTools.calculator, allTools.attendance, allTools.gpa, allTools.unit],
  },

  "/tools/qr-generator": {
    title: "Free QR Code Generator — URL, WiFi, vCard, Email | TREO TOOL'S",
    description: "Create QR codes for URLs, Wi-Fi, vCards, email, SMS and more — custom colors, no watermark, instant download. Free.",
    keywords: "qr code generator, free qr generator, wifi qr code, vcard qr code, custom qr code, qr code maker, no watermark qr",
    intro: "QR Code Generator creates clean QR codes for URLs, Wi-Fi networks, vCards, email, SMS and plain text — with custom colors, no watermark, and instant PNG download.",
    howToSteps: [
      "Pick the QR type — URL, Wi-Fi, vCard, Email, SMS or Text.",
      "Enter the details (URL, Wi-Fi name & password, contact details, etc.).",
      "Customise the color and size if you want.",
      "Download the QR code as a PNG image — ready to print or share.",
    ],
    benefits: [
      "Supports 6 popular QR formats including Wi-Fi and vCard.",
      "No watermark on the generated QR code.",
      "Customisable colors and sizes.",
      "Instant PNG download.",
      "Free, no signup, runs entirely in your browser.",
    ],
    faqs: [
      { q: "What QR types can I create?", a: "URLs, Wi-Fi credentials, vCards (contact cards), email, SMS and plain text." },
      { q: "Is there a watermark?", a: "No — the generated QR is 100% clean with no watermark or branding." },
      { q: "Can I change the colors?", a: "Yes — choose any foreground and background color combination, including transparent backgrounds." },
      { q: "Do the QR codes expire?", a: "No — these are static QR codes that never expire." },
      { q: "Is it free?", a: "Yes, completely free." },
    ],
    related: [allTools.bgRemove, allTools.resize, allTools.timer, allTools.wordMaker],
  },

  // ---------- Science ----------
  "/science/periodic-table": {
    title: "Interactive Periodic Table — All 118 Elements | TREO TOOL'S",
    description: "Explore all 118 elements with atomic mass, electron config, melting & boiling points. Interactive, mobile friendly. Free.",
    keywords: "periodic table, interactive periodic table, all 118 elements, atomic mass, electron configuration, chemistry table",
    intro: "Periodic Table is an interactive table of all 118 chemical elements — tap any element to see its atomic number, atomic mass, electron configuration, melting & boiling points and category.",
    howToSteps: [
      "Tap or hover on any element to see its full data card.",
      "Filter by category (alkali metals, noble gases, etc.) to highlight a family.",
      "Use the search bar to jump straight to any element by name or symbol.",
      "View atomic mass, configuration, and physical properties at a glance.",
    ],
    benefits: [
      "All 118 elements including the newest synthesised ones.",
      "Detailed data card for every element.",
      "Filter by element category.",
      "Search by name, symbol or atomic number.",
      "Mobile-friendly responsive layout.",
    ],
    faqs: [
      { q: "Does it include the newest elements?", a: "Yes — all 118 IUPAC-recognised elements are included, up to Oganesson." },
      { q: "Can I see electron configurations?", a: "Yes — each element card shows its full electron configuration." },
      { q: "Is it free?", a: "Yes, completely free with no signup." },
      { q: "Does it work offline?", a: "Yes — once the page is loaded it works fully offline." },
      { q: "Can I search by atomic number?", a: "Yes — search by name, symbol or atomic number." },
    ],
    related: [allTools.physics, allTools.calculator, allTools.unit, allTools.studyAssistant],
  },

  "/science/physics-calculator": {
    title: "Physics Formula Calculator — 20+ Formulas | TREO TOOL'S",
    description: "Solve for any variable in 20+ physics formulas — mechanics, electricity, waves, energy and more. Free, instant results.",
    keywords: "physics calculator, physics formula solver, ohm law calculator, newton second law, kinematics calculator, energy calculator",
    intro: "Physics Calculator solves 20+ common physics formulas across mechanics, electricity, waves, thermodynamics and more. Just enter the known values and the calculator solves for the unknown variable.",
    howToSteps: [
      "Pick a formula category (Mechanics, Electricity, Waves, etc.).",
      "Choose the specific formula you need.",
      "Enter the values you know — leave the unknown variable blank.",
      "Get the calculated answer instantly with the right units.",
    ],
    benefits: [
      "20+ formulas across the major physics topics.",
      "Solves for any variable — not just one direction.",
      "Shows units automatically.",
      "Great for homework and quick sanity checks.",
      "Free, no signup, mobile friendly.",
    ],
    faqs: [
      { q: "Which physics topics are covered?", a: "Mechanics (kinematics, forces, energy), electricity (Ohm's law, power), waves, optics, thermodynamics and gravitation." },
      { q: "Can it solve for any variable?", a: "Yes — leave any one variable blank and the calculator solves for it." },
      { q: "Does it show the formula?", a: "Yes — every formula is displayed in standard physics notation." },
      { q: "Is it free?", a: "Yes, completely free with no signup." },
      { q: "Suitable for board exams?", a: "Yes — all formulas match standard 11th/12th physics syllabi." },
    ],
    related: [allTools.calculator, allTools.unit, allTools.periodic, allTools.studyAssistant],
  },

  // ---------- Image ----------
  "/image/jpg-to-pdf": {
    title: "JPG to PDF Converter — Free, No Upload | TREO TOOL'S",
    description: "Convert JPG/JPEG images to a single PDF file. 100% in your browser — nothing uploaded. Combine multiple JPGs, drag to reorder.",
    keywords: "jpg to pdf, jpeg to pdf, image to pdf, combine jpg to pdf, jpg to pdf converter, free jpg to pdf",
    intro: "JPG to PDF Converter turns one or many JPG / JPEG images into a single, properly-paginated PDF — entirely in your browser. Drag to reorder, choose page size and orientation, and download.",
    howToSteps: [
      "Drag and drop your JPG images (or click to pick them).",
      "Reorder pages by dragging — the order in the list becomes the order in the PDF.",
      "Choose page size (A4 / Letter / Auto) and orientation.",
      "Click Convert — your PDF downloads instantly.",
    ],
    benefits: [
      "100% client-side — your photos never leave your device.",
      "Combine unlimited JPGs into one PDF.",
      "Drag-to-reorder pages.",
      "A4 / Letter / Auto page sizes.",
      "Free, no signup, no watermark.",
    ],
    faqs: [
      { q: "Are my images uploaded to a server?", a: "No — everything happens in your browser. Your images never leave your device." },
      { q: "Is there a file size limit?", a: "Only your browser's memory. Most phones and laptops handle dozens of high-res JPGs without issue." },
      { q: "Can I reorder the pages?", a: "Yes — drag the image thumbnails to set the page order." },
      { q: "Is there a watermark?", a: "No — the output PDF is 100% clean." },
      { q: "Is it free?", a: "Yes, completely free with no signup." },
    ],
    related: [allTools.pdfJpg, allTools.pngPdf, allTools.pdfMerge, allTools.resize],
  },

  "/image/pdf-to-jpg": {
    title: "PDF to JPG Converter — Extract Pages as Images | TREO TOOL'S",
    description: "Convert every PDF page into a high-quality JPG image. Free, 100% in your browser, no upload, no watermark.",
    keywords: "pdf to jpg, pdf to jpeg, extract pdf pages, pdf to image, convert pdf to jpg, free pdf to jpg",
    intro: "PDF to JPG Converter renders every page of your PDF as a high-quality JPG image — perfect for sharing, embedding, or working with images instead of PDFs.",
    howToSteps: [
      "Upload your PDF file (drag-and-drop or click).",
      "Optionally pick the image quality / DPI.",
      "Click Convert — each page becomes its own JPG.",
      "Download individual pages or all at once as a ZIP.",
    ],
    benefits: [
      "100% client-side — your PDF stays on your device.",
      "Configurable image quality.",
      "Download single pages or all as a ZIP.",
      "Free, no signup, no watermark.",
      "Works on mobile.",
    ],
    faqs: [
      { q: "Is my PDF uploaded?", a: "No — the entire conversion happens in your browser." },
      { q: "What image quality is used?", a: "Default is high quality (~150 DPI). You can adjust it before converting." },
      { q: "Can I download all pages at once?", a: "Yes — click the 'Download all' button to get a ZIP of every page." },
      { q: "Does it handle password-protected PDFs?", a: "Not directly — first unlock the PDF using our PDF Unlocker tool, then convert." },
      { q: "Is it free?", a: "Yes, completely free." },
    ],
    related: [allTools.jpgPdf, allTools.pdfPng, allTools.pdfCompress, allTools.pdfUnlock],
  },

  "/image/jpg-to-png": {
    title: "JPG to PNG Converter — Free, Lossless | TREO TOOL'S",
    description: "Convert JPG to PNG with one click. 100% in your browser — no upload. Free, no watermark.",
    keywords: "jpg to png, jpeg to png, convert jpg to png, free jpg png converter",
    intro: "JPG to PNG Converter changes your JPG / JPEG images into PNG format — useful when you need a transparent-friendly file or a lossless copy.",
    howToSteps: [
      "Drag-and-drop or pick your JPG image.",
      "The tool converts it to PNG instantly.",
      "Click Download to save the PNG file.",
    ],
    benefits: [
      "100% client-side conversion.",
      "Supports batch conversion of multiple files.",
      "No watermark, no signup.",
      "Free, fast, mobile-friendly.",
    ],
    faqs: [
      { q: "Will my image quality drop?", a: "No — converting from JPG to PNG is lossless. PNG preserves whatever quality the source JPG had." },
      { q: "Can I convert multiple files?", a: "Yes — upload several JPGs at once and download them all." },
      { q: "Is it free?", a: "Yes, completely free with no signup." },
      { q: "Does it support transparency?", a: "JPG itself doesn't have transparency, so the PNG will have a solid background matching the original." },
    ],
    related: [allTools.pngJpg, allTools.jpgPdf, allTools.bgRemove, allTools.resize],
  },

  "/image/png-to-jpg": {
    title: "PNG to JPG Converter — Free, Quality Control | TREO TOOL'S",
    description: "Convert PNG images to JPG with quality control. 100% in your browser — no upload, no watermark.",
    keywords: "png to jpg, png to jpeg, convert png to jpg, free png jpg converter",
    intro: "PNG to JPG Converter turns PNG images into JPG format — smaller file size and universal compatibility, with control over the JPG quality.",
    howToSteps: [
      "Drag-and-drop or pick your PNG image.",
      "Set the JPG quality (higher = better, lower = smaller file).",
      "Click Convert.",
      "Download the resulting JPG.",
    ],
    benefits: [
      "Choose your JPG quality / file size.",
      "Batch convert multiple PNGs.",
      "100% client-side.",
      "No watermark, free, no signup.",
    ],
    faqs: [
      { q: "Will I lose quality?", a: "JPG is a lossy format — there's a small quality drop, but you control the trade-off with the quality slider." },
      { q: "What happens to transparent areas?", a: "PNG transparency is replaced with a solid background colour (usually white) since JPG doesn't support transparency." },
      { q: "Is it free?", a: "Yes, completely free with no signup." },
      { q: "Can I batch convert?", a: "Yes — upload multiple PNGs at once." },
    ],
    related: [allTools.jpgPng, allTools.pngPdf, allTools.resize, allTools.bgRemove],
  },

  "/image/png-to-pdf": {
    title: "PNG to PDF Converter — Free, No Upload | TREO TOOL'S",
    description: "Convert one or many PNG images into a single PDF. 100% client-side, free, no watermark.",
    keywords: "png to pdf, png images to pdf, convert png to pdf, free png pdf converter",
    intro: "PNG to PDF Converter combines one or many PNG images into a single, properly-paginated PDF — all in your browser.",
    howToSteps: [
      "Drag-and-drop or pick your PNG images.",
      "Reorder them by dragging.",
      "Pick page size (A4 / Letter / Auto).",
      "Click Convert and download your PDF.",
    ],
    benefits: [
      "Combine unlimited PNGs into a single PDF.",
      "Drag-to-reorder pages.",
      "100% client-side.",
      "Free, no watermark, no signup.",
    ],
    faqs: [
      { q: "Are my files uploaded?", a: "No — everything happens in your browser." },
      { q: "Can I mix PNGs and JPGs?", a: "Not in this specific tool — use the JPG to PDF tool for JPGs, or convert them to PNG first." },
      { q: "Is there a watermark?", a: "No — the output PDF is 100% clean." },
      { q: "Is it free?", a: "Yes, completely free." },
    ],
    related: [allTools.jpgPdf, allTools.pdfPng, allTools.pdfMerge, allTools.pdfCompress],
  },

  "/image/pdf-to-png": {
    title: "PDF to PNG Converter — Extract Pages as PNG | TREO TOOL'S",
    description: "Convert every PDF page to a high-quality, lossless PNG. Free, 100% in your browser, no upload, no watermark.",
    keywords: "pdf to png, extract pdf pages png, pdf to image, free pdf to png converter",
    intro: "PDF to PNG Converter turns every page of your PDF into a high-quality, lossless PNG — ideal when you need crisp images for editing or embedding.",
    howToSteps: [
      "Upload your PDF.",
      "Pick the output resolution (DPI).",
      "Click Convert.",
      "Download individual pages or all as a ZIP.",
    ],
    benefits: [
      "Lossless PNG output.",
      "Configurable DPI / resolution.",
      "Download all pages as a ZIP.",
      "100% client-side, free, no signup.",
    ],
    faqs: [
      { q: "Is my PDF uploaded?", a: "No — the entire conversion happens in your browser." },
      { q: "What DPI is recommended?", a: "150 DPI is a good balance. Use 300 DPI for print quality." },
      { q: "Can I download all pages at once?", a: "Yes — there's a 'Download all' button that gives you a ZIP." },
      { q: "Is it free?", a: "Yes, completely free." },
    ],
    related: [allTools.pdfJpg, allTools.pngPdf, allTools.pdfCompress, allTools.pdfUnlock],
  },

  "/image/resize": {
    title: "Photo Resizer — Exact KB / Pixel Compressor | TREO TOOL'S",
    description: "Resize images by pixel dimensions or compress to an exact target file size (KB / MB). Perfect for SSC, UPSC and exam form uploads.",
    keywords: "photo resizer, image compressor, resize image to kb, compress image to 100kb, exam form photo, ssc photo resize, upsc photo size",
    intro: "Photo Resizer either resizes your image to specific pixel dimensions or compresses it to an exact target file size in KB or MB — perfect for exam form uploads (SSC, UPSC, NEET, JEE, college applications) that require precise photo / signature sizes.",
    howToSteps: [
      "Upload your image (JPG or PNG).",
      "Pick a mode — resize by pixels, or compress to an exact KB/MB target.",
      "Enter the target dimensions or file size.",
      "Click Resize / Compress — download the output.",
    ],
    benefits: [
      "Exact-size compression — hit the target KB/MB precisely (e.g. 20KB, 50KB, 100KB).",
      "Or resize by exact pixel width/height.",
      "Perfect for SSC, UPSC, NEET, JEE and college form uploads.",
      "100% client-side — your photos never leave your device.",
      "Free, no signup, no watermark.",
    ],
    faqs: [
      { q: "Why do I need an exact-size photo?", a: "Indian government exam forms (SSC, UPSC, NEET, JEE etc.) require photos and signatures within strict KB ranges. This tool hits them exactly." },
      { q: "Will the quality drop too much?", a: "The tool uses smart binary-search compression to keep maximum quality for the target size." },
      { q: "Is my photo uploaded?", a: "No — everything is processed in your browser." },
      { q: "What formats are supported?", a: "JPG, JPEG and PNG inputs. Output is JPG for exact-size compression." },
      { q: "Is it free?", a: "Yes, completely free with no signup." },
    ],
    related: [allTools.bgRemove, allTools.jpgPng, allTools.pngJpg, allTools.jpgPdf],
  },

  "/image/background": {
    title: "Free Background Remover — AI Image Cutout in Browser | TREO TOOL'S",
    description: "Remove image backgrounds with AI — runs 100% in your browser, no upload, no signup. Perfect for ID photos and product shots.",
    keywords: "background remover, remove image background, ai background remover, free background remover, image cutout, transparent background, no upload",
    intro: "Background Remover uses an on-device AI model to cut out the subject and produce a transparent-background PNG — without uploading your photo anywhere. Perfect for ID photos, product shots and design work.",
    howToSteps: [
      "Upload your image (JPG or PNG).",
      "Wait while the AI model loads (first use takes ~15–30 seconds).",
      "The background is removed automatically.",
      "Download the transparent-background PNG.",
    ],
    benefits: [
      "Runs entirely in your browser — your photo never leaves your device.",
      "No signup, no daily limits.",
      "Outputs a clean transparent PNG.",
      "Works on people, products and most subjects.",
      "100% free.",
    ],
    faqs: [
      { q: "Why does it take 15–30 seconds the first time?", a: "The AI model (~30 MB) downloads and initialises in your browser on the first use. Subsequent uses are much faster." },
      { q: "Is my photo uploaded?", a: "No — everything runs on your device. Nothing is sent to any server." },
      { q: "Does it work on people and animals?", a: "Yes — it works well on people, animals, products and most clearly-defined subjects." },
      { q: "Is the output transparent?", a: "Yes — the output PNG has a transparent background." },
      { q: "Is it free?", a: "Yes, 100% free with no limits." },
    ],
    related: [allTools.resize, allTools.jpgPng, allTools.pngJpg, allTools.qr],
  },

  // ---------- PDF ----------
  "/pdf/maker": {
    title: "PDF Maker — Create PDF Files from Text | TREO TOOL'S",
    description: "Create clean PDF documents from text content — fonts, headings, paragraphs and lists. 100% in your browser, free.",
    keywords: "pdf maker, create pdf, make pdf file, pdf creator, free pdf maker, text to pdf",
    intro: "PDF Maker creates clean, well-formatted PDF documents from text content with proper headings, paragraphs and lists — all in your browser.",
    howToSteps: [
      "Type or paste your content into the editor.",
      "Format headings and lists using the toolbar.",
      "Pick a page size (A4 / Letter).",
      "Click Generate PDF and download.",
    ],
    benefits: [
      "Clean typography out of the box.",
      "Supports headings, paragraphs, lists.",
      "100% client-side.",
      "Free, no signup, no watermark.",
    ],
    faqs: [
      { q: "Is the PDF uploaded anywhere?", a: "No — it's built entirely in your browser." },
      { q: "Can I add images?", a: "For images, use the JPG to PDF or PNG to PDF tools." },
      { q: "Is it free?", a: "Yes, completely free." },
      { q: "Is there a watermark?", a: "No — output PDFs are 100% clean." },
    ],
    related: [allTools.textPdf, allTools.wordPdf, allTools.wordMaker, allTools.pdfEditor],
  },

  "/pdf/editor": {
    title: "PDF Editor — View, Annotate & Edit PDFs Online | TREO TOOL'S",
    description: "View, annotate, highlight and edit PDFs in your browser. 100% client-side, free, no signup.",
    keywords: "pdf editor, edit pdf online, annotate pdf, free pdf editor, pdf viewer",
    intro: "PDF Editor lets you view, annotate and edit PDFs directly in the browser — highlight text, add notes, rotate pages — without uploading the file anywhere.",
    howToSteps: [
      "Upload your PDF.",
      "Use the toolbar to highlight, annotate, add text or rotate pages.",
      "Click Save to download the edited PDF.",
    ],
    benefits: [
      "Annotate without uploading the file.",
      "Highlight, add notes and rotate pages.",
      "100% client-side, free, no signup.",
    ],
    faqs: [
      { q: "Is my PDF uploaded?", a: "No — all editing happens in your browser." },
      { q: "Can I edit the actual text inside the PDF?", a: "You can add overlay text, highlights and notes. Editing the original embedded text is limited because PDF text is rasterised." },
      { q: "Is it free?", a: "Yes." },
      { q: "Does it work on mobile?", a: "Yes, with a responsive layout." },
    ],
    related: [allTools.pdfMaker, allTools.pdfMerge, allTools.pdfCompress, allTools.pdfWord],
  },

  "/pdf/lock": {
    title: "PDF Locker — Password Protect Your PDF | TREO TOOL'S",
    description: "Add a password to any PDF in your browser. 100% client-side, no upload — your file never leaves your device.",
    keywords: "pdf locker, password protect pdf, encrypt pdf, free pdf password, lock pdf file",
    intro: "PDF Locker adds password protection to your PDF — entirely in your browser. The original file never leaves your device.",
    howToSteps: [
      "Upload the PDF you want to protect.",
      "Set a strong password.",
      "Click Lock — download the password-protected PDF.",
    ],
    benefits: [
      "Only those with the password can open the PDF.",
      "100% client-side — no upload.",
      "Free, no signup.",
      "Works on mobile.",
    ],
    faqs: [
      { q: "Is the password stored anywhere?", a: "No — the password is used only locally to encrypt the PDF in your browser." },
      { q: "How strong is the encryption?", a: "Standard PDF 128-bit AES encryption, supported by all major PDF readers." },
      { q: "Can I unlock the PDF later?", a: "Yes — use our PDF Unlocker tool with the password you set." },
      { q: "Is it free?", a: "Yes." },
    ],
    related: [allTools.pdfUnlock, allTools.pdfCompress, allTools.pdfMerge, allTools.pdfEditor],
  },

  "/pdf/unlock": {
    title: "PDF Unlocker — Remove PDF Password (You Own) | TREO TOOL'S",
    description: "Remove password protection from a PDF you own. 100% client-side — file never leaves your device. Free, no signup.",
    keywords: "pdf unlocker, remove pdf password, decrypt pdf, unlock pdf online, free pdf unlock",
    intro: "PDF Unlocker removes the password from PDFs you own — useful for PDFs whose password you've changed or no longer want. The entire process happens in your browser. Only use on PDFs you have the right to modify.",
    howToSteps: [
      "Upload the password-protected PDF.",
      "Enter the current password.",
      "Click Unlock — download the unlocked PDF.",
    ],
    benefits: [
      "100% client-side — your PDF and password never leave your device.",
      "Works with all standard PDF passwords.",
      "Free, no signup.",
    ],
    faqs: [
      { q: "Do I need to know the password?", a: "Yes — you need the original password. This tool does not crack unknown passwords." },
      { q: "Is my file uploaded?", a: "No — everything is processed in your browser." },
      { q: "Is it legal?", a: "Only unlock PDFs you own or have explicit permission to modify." },
      { q: "Is it free?", a: "Yes, completely free." },
    ],
    related: [allTools.pdfLock, allTools.pdfCompress, allTools.pdfMerge, allTools.pdfEditor],
  },

  "/pdf/merge": {
    title: "Free PDF Merger — Combine PDFs Online | TREO TOOL'S",
    description: "Combine multiple PDFs into one file. Drag to reorder. 100% in your browser, no upload, no watermark, free.",
    keywords: "pdf merger, combine pdf, merge pdf files, join pdf, free pdf merger, pdf combine online",
    intro: "PDF Merger combines multiple PDFs into a single file with full drag-to-reorder support — all in your browser, no upload required.",
    howToSteps: [
      "Drag-and-drop your PDFs (or click to pick).",
      "Drag the files to set the order.",
      "Click Merge — the combined PDF downloads instantly.",
    ],
    benefits: [
      "Merge unlimited PDFs.",
      "Drag-to-reorder.",
      "100% client-side.",
      "Free, no signup, no watermark.",
    ],
    faqs: [
      { q: "Is there a file limit?", a: "Only your browser's memory. Most modern devices handle dozens of PDFs at once." },
      { q: "Are my files uploaded?", a: "No — everything happens in your browser." },
      { q: "Is there a watermark?", a: "No — the merged PDF is 100% clean." },
      { q: "Is it free?", a: "Yes, completely free." },
    ],
    related: [allTools.pdfSplit, allTools.pdfCompress, allTools.pdfMaker, allTools.pdfEditor],
  },

  "/pdf/split": {
    title: "Free PDF Splitter — Split PDF by Pages | TREO TOOL'S",
    description: "Split a PDF into multiple files by page ranges or single pages. 100% client-side, free, no signup.",
    keywords: "pdf splitter, split pdf, extract pdf pages, divide pdf, free pdf split, separate pdf pages",
    intro: "PDF Splitter divides a PDF into multiple smaller PDFs — by page ranges, individual pages, or every Nth page — entirely in your browser.",
    howToSteps: [
      "Upload your PDF.",
      "Pick a split mode — by page range, individual pages, or every Nth page.",
      "Enter the page numbers.",
      "Click Split and download the resulting PDFs as a ZIP.",
    ],
    benefits: [
      "Multiple split modes.",
      "Download all parts as a ZIP.",
      "100% client-side, free, no signup.",
    ],
    faqs: [
      { q: "Is my PDF uploaded?", a: "No — everything happens in your browser." },
      { q: "Can I extract just a few pages?", a: "Yes — use the page-range mode (e.g. '3-7, 12, 18-20')." },
      { q: "Is it free?", a: "Yes, completely free." },
      { q: "Does it work on mobile?", a: "Yes." },
    ],
    related: [allTools.pdfMerge, allTools.pdfCompress, allTools.pdfJpg, allTools.pdfEditor],
  },

  "/pdf/compress": {
    title: "Free PDF Compressor — Shrink PDF Size Online | TREO TOOL'S",
    description: "Compress PDFs to a smaller file size while keeping quality. 100% in your browser, no upload, free.",
    keywords: "pdf compressor, compress pdf, reduce pdf size, shrink pdf, free pdf compressor, pdf size reducer",
    intro: "PDF Compressor shrinks the file size of your PDF — useful for email attachments, exam form uploads, and faster sharing — without sending it to any server.",
    howToSteps: [
      "Upload your PDF.",
      "Pick a compression level (low / medium / high).",
      "Click Compress — see the size reduction and download.",
    ],
    benefits: [
      "Significant size reduction with minimal quality loss.",
      "100% client-side — no upload.",
      "Free, no signup, no watermark.",
    ],
    faqs: [
      { q: "How much smaller will my PDF get?", a: "Typically 30–70% smaller depending on the content (image-heavy PDFs compress more)." },
      { q: "Is quality lost?", a: "Images are recompressed slightly. Text stays sharp." },
      { q: "Is my PDF uploaded?", a: "No — everything happens in your browser." },
      { q: "Is it free?", a: "Yes." },
    ],
    related: [allTools.pdfMerge, allTools.pdfSplit, allTools.pdfJpg, allTools.resize],
  },

  "/pdf/text-to-pdf": {
    title: "Text to PDF — Convert Plain Text to PDF | TREO TOOL'S",
    description: "Convert plain text to a clean PDF in seconds. Customise font size and page size. Free, no signup.",
    keywords: "text to pdf, txt to pdf, convert text to pdf, plain text pdf, free text to pdf",
    intro: "Text to PDF turns any plain text into a clean, well-formatted PDF — choose font size, line height and page size.",
    howToSteps: [
      "Paste or type your text.",
      "Pick font size, line spacing and page size.",
      "Click Convert — download the PDF.",
    ],
    benefits: [
      "Clean, readable typography out of the box.",
      "Customisable font and spacing.",
      "100% client-side, free, no signup.",
    ],
    faqs: [
      { q: "Can I paste long documents?", a: "Yes — the tool paginates the text across as many pages as needed." },
      { q: "Is it free?", a: "Yes, completely free." },
      { q: "Is there a watermark?", a: "No, the output is 100% clean." },
    ],
    related: [allTools.pdfMaker, allTools.wordPdf, allTools.wordMaker, allTools.pdfEditor],
  },

  "/pdf/pdf-to-word": {
    title: "PDF to Word — Convert PDF to .docx | TREO TOOL'S",
    description: "Extract text from PDF and convert to an editable .docx Word document. 100% in your browser, free, no signup.",
    keywords: "pdf to word, pdf to docx, convert pdf to word, free pdf word converter, editable pdf",
    intro: "PDF to Word extracts the text from your PDF and saves it as an editable .docx Word document — perfect when you need to revise the content.",
    howToSteps: [
      "Upload your PDF.",
      "The tool extracts the text content.",
      "Click Convert — download the .docx file.",
    ],
    benefits: [
      "Output is fully editable in Word, Google Docs and LibreOffice.",
      "100% client-side — no upload.",
      "Free, no signup, no watermark.",
    ],
    faqs: [
      { q: "Does it preserve complex formatting?", a: "Text is extracted reliably. Complex layouts (multi-column, tables) may need light touch-up after conversion." },
      { q: "Is my PDF uploaded?", a: "No — everything happens in your browser." },
      { q: "Is it free?", a: "Yes." },
      { q: "What file format do I get?", a: ".docx — opens in Word, Google Docs and LibreOffice." },
    ],
    related: [allTools.wordPdf, allTools.wordMaker, allTools.pdfEditor, allTools.pdfCompress],
  },

  "/pdf/word-to-pdf": {
    title: "Word to PDF — Convert .docx to PDF | TREO TOOL'S",
    description: "Convert .docx Word documents to professional PDFs. 100% in your browser, free, no signup, no watermark.",
    keywords: "word to pdf, docx to pdf, convert word to pdf, free word pdf converter",
    intro: "Word to PDF converts your .docx documents into clean, professional PDFs — preserving formatting, fonts and layout.",
    howToSteps: [
      "Upload your .docx file.",
      "Click Convert — download the resulting PDF.",
    ],
    benefits: [
      "Preserves formatting, fonts and layout.",
      "100% client-side.",
      "Free, no signup, no watermark.",
    ],
    faqs: [
      { q: "What formats are supported?", a: ".docx (Word 2007 and later)." },
      { q: "Is my file uploaded?", a: "No — everything happens in your browser." },
      { q: "Is there a watermark?", a: "No — the output is 100% clean." },
      { q: "Is it free?", a: "Yes." },
    ],
    related: [allTools.pdfWord, allTools.pdfMaker, allTools.wordMaker, allTools.pdfCompress],
  },

  "/docs/word-maker": {
    title: "Word File Maker — Create .docx Documents Online | TREO TOOL'S",
    description: "Create .docx Word documents with headings, lists and formatting — all in your browser, free, no signup.",
    keywords: "word file maker, create docx online, make word document, free word maker, docx generator",
    intro: "Word File Maker lets you create clean .docx Word documents online — with headings, paragraphs, lists and basic formatting — without installing Word.",
    howToSteps: [
      "Type or paste your content.",
      "Use the toolbar to format headings and lists.",
      "Click Generate — download the .docx file.",
    ],
    benefits: [
      "Output works in Word, Google Docs and LibreOffice.",
      "Clean typography.",
      "100% client-side.",
      "Free, no signup.",
    ],
    faqs: [
      { q: "Do I need Word installed?", a: "No — the file is generated in your browser. You only need Word (or any compatible reader) to open it." },
      { q: "Is it free?", a: "Yes." },
      { q: "Is my content saved anywhere?", a: "No — everything happens in your browser." },
    ],
    related: [allTools.wordPdf, allTools.pdfWord, allTools.textPdf, allTools.pdfMaker],
  },

  // ---------- Legal ----------
  "/about": {
    title: "About TREO TOOL'S — Free Student Toolkit",
    description: "TREO TOOL'S is a free, browser-based toolkit for students — PDF tools, image converters, AI study helpers and calculators.",
    noContent: true,
  },
  "/contact": {
    title: "Contact TREO TOOL'S",
    description: "Get in touch with the TREO TOOL'S team for feedback, bug reports or feature requests.",
    noContent: true,
  },
  "/privacy": {
    title: "Privacy Policy — TREO TOOL'S",
    description: "How TREO TOOL'S handles your data — short answer: nearly all tools run in your browser and your files never leave your device.",
    noContent: true,
  },
  "/terms": {
    title: "Terms & Conditions — TREO TOOL'S",
    description: "Terms of use for TREO TOOL'S — free student toolkit. Please review before using the tools.",
    noContent: true,
  },
  "/copyright": {
    title: "Copyright Notice — TREO TOOL'S",
    description: "Copyright information for TREO TOOL'S. Report copyright issues here.",
    noContent: true,
  },
};

export function getSeo(pathname: string): SeoEntry {
  const p = pathname.replace(/\/+$/, "") || "/";
  return (
    SEO_MAP[p] || {
      title: "TREO TOOL'S — Free Student Toolkit",
      description: SITE_DEFAULT_DESCRIPTION,
      noContent: true,
    }
  );
}
