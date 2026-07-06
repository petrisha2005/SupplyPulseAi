import { useEffect, useRef, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  BrainCircuit,
  Cpu,
  FileDown,
  FileText,
  Gauge,
  ShieldAlert,
  Sparkles,
  TimerReset,
  Zap
} from "lucide-react";

type LandingPageId = "dashboard" | "reports";

type LandingProps = {
  setPage: (page: LandingPageId) => void;
};

const problemCards = [
  {
    icon: <Boxes size={22} />,
    title: "Scattered inventory",
    text: "Marketplace, Shopify, and ERP stock drift out of sync before teams notice."
  },
  {
    icon: <TimerReset size={22} />,
    title: "Late reorder decisions",
    text: "Supplier calls happen after the risk is already visible in sales velocity."
  },
  {
    icon: <ShieldAlert size={22} />,
    title: "Sale-event stockouts",
    text: "Festival demand spikes turn small gaps into lost revenue and trust."
  }
];

const workflowSteps = ["Inventory Fusion", "Forecasting", "Risk Score", "AI Reorder", "Alerts & Reports"];

const demoSteps = [
  { title: "Open morning dashboard", icon: <Gauge size={19} /> },
  { title: "Explain top SKU risk", icon: <BrainCircuit size={19} /> },
  { title: "View forecast", icon: <BarChart3 size={19} /> },
  { title: "Draft PO", icon: <FileText size={19} /> },
  { title: "Run pipeline", icon: <Cpu size={19} /> },
  { title: "Export report", icon: <FileDown size={19} /> }
];

const scrollToDemo = () => {
  window.history.replaceState(null, "", "#demo-flow");
  document.getElementById("demo-flow")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

export function Landing({ setPage }: LandingProps) {
  useEffect(() => {
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.16 });

    revealItems.forEach((item) => observer.observe(item));

    if (window.location.hash === "#demo-flow") {
      window.setTimeout(() => document.getElementById("demo-flow")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F7F1E8] text-[#1F160F]">
      <LandingEnvironment />
      <LandingNav setPage={setPage} />

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-14 px-5 pb-24 pt-10 lg:grid-cols-[0.88fr_1.12fr] lg:pt-14">
        <div className="reveal">
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-[#FFFDF8]/85 px-4 py-2 text-sm font-black text-teal-800 shadow-sm backdrop-blur-xl">
            <Sparkles size={15} /> AI-powered inventory intelligence for Indian D2C brands
          </span>
          <h1 className="mt-8 max-w-4xl text-5xl font-black leading-[1.02] tracking-normal md:text-7xl">Stop stockouts before they steal your revenue.</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#6B5B4A]">SupplyPulse AI unifies marketplace inventory, forecasts demand, scores SKU-level stockout risk, and generates reorder actions before sale events hit.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LandingButton onClick={() => setPage("dashboard")} tone="primary">Launch Dashboard <ArrowRight size={17} /></LandingButton>
            <LandingButton onClick={scrollToDemo} tone="secondary">View Demo Flow</LandingButton>
          </div>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            <LaunchStat value="₹41.0L" label="revenue at risk" />
            <LaunchStat value="4.2s" label="GPU refresh" />
            <LaunchStat value="11.3x" label="faster insight" />
          </div>
        </div>

        <Hero3DMockup />
      </section>

      <section id="problem" className="relative z-10 mx-auto max-w-7xl px-5 py-20">
        <div className="grid gap-5 md:grid-cols-3">
          {problemCards.map((card, index) => <ProblemCard key={card.title} {...card} index={index} />)}
        </div>
      </section>

      <section id="solution" className="relative z-10 mx-auto max-w-7xl px-5 py-20">
        <SectionTitle eyebrow="Solution workflow" title="One live decision path from stock signal to supplier action." />
        <div className="reveal landing-pipeline mt-9 grid gap-4 lg:grid-cols-5">
          {workflowSteps.map((step, index) => <WorkflowBlock key={step} step={step} index={index} />)}
        </div>
      </section>

      <section id="acceleration" className="relative z-10 mx-auto max-w-7xl px-5 py-20">
        <SectionTitle eyebrow="Acceleration" title="Fast refresh cycles before lead-time windows close." />
        <div className="mt-9 grid gap-5 md:grid-cols-4">
          <BenchmarkCard label="CPU/manual" value="47.3s / 6+ min manual" tone="warm" />
          <BenchmarkCard label="GPU pipeline" value="4.2s" tone="green" featured />
          <BenchmarkCard label="Speedup" value="11.3x" tone="brown" />
          <BenchmarkCard label="Insight time" value="under 40s" tone="green" />
        </div>
        <p className="reveal mt-6 max-w-2xl text-sm font-bold text-[#6B5B4A]">Fast refresh cycles let teams respond before supplier lead-time windows close.</p>
      </section>

      <section id="demo-flow" className="relative z-10 mx-auto max-w-7xl px-5 py-20">
        <SectionTitle eyebrow="Demo" title="See the live decision flow" />
        <div className="landing-journey reveal mt-9 grid gap-5 md:grid-cols-3">
          {demoSteps.map((step, index) => <DemoStep key={step.title} {...step} index={index} />)}
        </div>
        <div className="reveal mt-8 flex flex-wrap gap-3">
          <LandingButton onClick={() => setPage("dashboard")} tone="primary">Launch Dashboard <ArrowRight size={17} /></LandingButton>
          <LandingButton onClick={() => setPage("reports")} tone="secondary"><FileDown size={16} /> Open Executive Report</LandingButton>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-28 pt-12">
        <div className="reveal landing-final-panel rounded-[2rem] border border-white/70 bg-[#1F160F]/95 p-8 text-white shadow-2xl shadow-slate-950/25 md:p-12">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-sm font-black uppercase text-teal-200">Live stockout cockpit</p>
              <h2 className="mt-2 text-3xl font-black tracking-normal">Ready to see today&apos;s stockout risk?</h2>
              <p className="mt-3 max-w-2xl leading-7 text-[#DED0BD]">Launch the live cockpit to inspect SKU risk, forecast demand, generate reorder actions, and export the executive report.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setPage("dashboard")} className="rounded-md bg-teal-500 px-5 py-3 text-sm font-black text-white shadow-xl shadow-teal-500/25 transition hover:-translate-y-0.5">Launch Dashboard</button>
              <button onClick={() => setPage("reports")} className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:-translate-y-0.5">
                <FileDown size={16} /> Open Executive Report
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function LandingEnvironment() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.18),rgba(247,241,232,0)_62%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
    </div>
  );
}

function LandingNav({ setPage }: LandingProps) {
  return (
    <div className="sticky top-0 z-30 px-4 py-4">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-[#E5D8C8]/80 bg-[#FFFDF8]/82 px-4 py-3 shadow-xl shadow-[#2A1A12]/10 backdrop-blur-2xl">
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1F160F] text-sm font-black text-white shadow-xl shadow-slate-950/20 [transform:rotateX(12deg)_rotateY(-16deg)]">SP</span>
          <span className="hidden text-lg font-black sm:inline">SupplyPulse AI</span>
        </button>
        <div className="hidden items-center gap-7 text-sm font-bold text-[#6B5B4A] md:flex">
          <a href="#problem" className="transition hover:text-[#1F160F]">Problem</a>
          <a href="#solution" className="transition hover:text-[#1F160F]">Solution</a>
          <a href="#acceleration" className="transition hover:text-[#1F160F]">Acceleration</a>
          <a href="#demo-flow" className="transition hover:text-[#1F160F]">Demo</a>
        </div>
        <button onClick={() => setPage("dashboard")} className="inline-flex items-center gap-2 rounded-full bg-[#1F160F] px-4 py-2 text-sm font-black text-white shadow-xl shadow-slate-950/15 transition hover:-translate-y-0.5">
          Launch Dashboard <ArrowRight size={16} />
        </button>
      </nav>
    </div>
  );
}

function Hero3DMockup() {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 1024 || !cardRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    cardRef.current.style.setProperty("--rotate-y", `${x * 8}deg`);
    cardRef.current.style.setProperty("--rotate-x", `${-y * 8}deg`);
  };

  const resetMouse = () => {
    cardRef.current?.style.setProperty("--rotate-y", "0deg");
    cardRef.current?.style.setProperty("--rotate-x", "0deg");
  };

  return (
    <div className="reveal landing-hero-stage [perspective:1500px]" onMouseMove={handleMouseMove} onMouseLeave={resetMouse}>
      <div className="landing-shadow mx-auto h-12 max-w-lg rounded-full bg-[#2A1A12]/15 blur-2xl" />
      <div ref={cardRef} className="landing-hero-card relative mx-auto max-w-2xl [--rotate-x:0deg] [--rotate-y:0deg]">
        <div className="landing-hero-slab absolute inset-10 rounded-[2rem] border border-[#E5D8C8]/70 bg-[#FFFDF8]/35 shadow-2xl shadow-[#2A1A12]/10" />
        <div className="landing-hero-slab landing-hero-slab-alt absolute inset-5 rounded-[2rem] border border-[#E5D8C8]/70 bg-[#FFFDF8]/55 shadow-2xl shadow-[#2A1A12]/10" />

        <div className="landing-dashboard-card relative overflow-hidden rounded-[2rem] border border-[#E5D8C8]/85 bg-[#FFFDF8]/90 p-5 shadow-2xl shadow-[#2A1A12]/20 backdrop-blur-xl md:p-7">
          <span className="landing-shimmer absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
          <div className="landing-float-badge absolute right-3 top-20 hidden rounded-full border border-red-100 bg-red-50 px-3 py-2 text-xs font-black text-red-700 shadow-xl shadow-red-900/10 md:block">Stockout in 24h</div>
          <div className="landing-float-badge-slow absolute right-10 bottom-8 hidden rounded-full border border-[#DDF8F1] bg-[#E6FFFA] px-3 py-2 text-xs font-black text-[#0D9488] shadow-xl shadow-teal-900/10 md:block">Diwali Sale ↑ 1.85x</div>
          <div className="flex items-center justify-between border-b border-[#E5D8C8]/80 pb-4">
            <div>
              <p className="text-xs font-black uppercase text-teal-700">D2C marketplace intelligence</p>
              <h2 className="mt-1 text-2xl font-black">From channel data to reorder action</h2>
            </div>
            <span className="rounded-full bg-[#DDF8F1] px-3 py-1 text-xs font-black text-[#0D9488] shadow-sm">GPU 4.2s</span>
          </div>

          <div className="landing-intel-flow relative mt-5 grid gap-4 lg:grid-cols-[0.82fr_0.9fr_1.2fr]">
            <div className="relative z-10 space-y-2">
              <p className="text-[0.68rem] font-black uppercase text-[#7A6A58]">Channel data</p>
              {["Amazon", "Meesho", "Shopify", "Flipkart", "ERP"].map((channel, index) => <ChannelChip key={channel} channel={channel} index={index} />)}
            </div>

            <div className="relative z-10 flex flex-col justify-center">
              <span className="landing-data-line landing-data-line-in hidden lg:block" />
              <span className="landing-data-line landing-data-line-out hidden lg:block" />
              <div className="landing-ai-engine rounded-[1.6rem] border border-[#DDF8F1] bg-[#1F160F] p-5 text-center text-[#FFFDF8] shadow-2xl shadow-teal-900/20">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#DDF8F1] text-[#0D9488] shadow-inner">
                  <BrainCircuit size={28} />
                </div>
                <p className="mt-3 text-xs font-black uppercase text-teal-200">SupplyPulse</p>
                <h3 className="mt-1 text-lg font-black">AI Engine</h3>
                <div className="mt-4 grid grid-cols-2 gap-2 text-[0.62rem] font-black uppercase text-[#DED0BD]">
                  {["Inventory fusion", "Demand forecast", "Risk scoring", "Supplier ranking"].map((label) => <span key={label} className="rounded-full border border-white/10 bg-white/5 px-2 py-1">{label}</span>)}
                </div>
              </div>
            </div>

            <div className="landing-output-card relative z-10 rounded-[1.5rem] border border-[#E5D8C8] bg-[#FFFDF8]/92 p-4 shadow-xl shadow-[#2A1A12]/12">
              <div className="flex items-center justify-between">
                <p className="text-[0.68rem] font-black uppercase text-teal-700">Risk dashboard</p>
                <span className="landing-alert-glow rounded-full bg-red-50 px-2.5 py-1 text-[0.65rem] font-black uppercase text-red-700">Critical</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <HeroMetric compact label="Critical SKUs" value="2" icon={<ShieldAlert size={15} />} />
                <HeroMetric compact label="Revenue risk" value="₹41.0L" icon={<Gauge size={15} />} />
                <HeroMetric compact label="Pipeline" value="4.2s" icon={<Cpu size={15} />} />
              </div>
              <div className="mt-3 rounded-xl border border-[#DDF8F1] bg-[#E6FFFA] px-3 py-2">
                <p className="text-[0.65rem] font-black uppercase text-[#0D9488]">Top action</p>
                <p className="mt-1 text-sm font-black text-[#1F160F]">Reorder 600 units today</p>
              </div>
              <div className="mt-3 space-y-2">
                {[
                  { product: "Handbag Premium Pack", score: "87", level: "Critical" },
                  { product: "Cotton Kurti", score: "79", level: "High" },
                  { product: "Rose Serum", score: "62", level: "Medium" }
                ].map((item) => <ProductRiskRow key={item.product} {...item} />)}
              </div>
              <div className="mt-3 flex h-12 items-end gap-1.5">
                {[38, 58, 46, 74, 68, 96].map((height, index) => <span key={index} className="landing-risk-bar w-full rounded-t bg-teal-400" style={{ "--bar-height": `${height}%`, animationDelay: `${index * 0.12}s` } as CSSProperties} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChannelChip({ channel, index }: { channel: string; index: number }) {
  const initial = channel.slice(0, 1);
  return (
    <span className="landing-channel-chip flex items-center gap-2 rounded-xl border border-[#E5D8C8] bg-[#FFFDF8]/90 px-3 py-2 text-xs font-black text-[#6B5B4A] shadow-sm" style={{ animationDelay: `${index * 0.16}s` }}>
      <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#1F160F] text-[0.65rem] text-[#FFFDF8]">{initial}</span>
      <span>{channel}</span>
    </span>
  );
}

function ProductRiskRow({ product, score, level }: { product: string; score: string; level: string }) {
  const levelClass = level === "Critical" ? "bg-red-50 text-red-700 border-red-100" : level === "High" ? "bg-amber-50 text-[#D97706] border-amber-100" : "bg-[#E6FFFA] text-[#0D9488] border-[#DDF8F1]";
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#E5D8C8] bg-[#FFFDF8]/82 px-3 py-3 shadow-sm">
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-[#1F160F]">{product}</p>
        <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[0.65rem] font-black uppercase ${levelClass}`}>{level}</span>
      </div>
      <span className="ml-3 rounded-full bg-[#1F160F] px-3 py-1 text-sm font-black text-[#FFFDF8]">{score}</span>
    </div>
  );
}

function HeroMetric({ label, value, icon, compact = false }: { label: string; value: string; icon: ReactNode; compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-[#E5D8C8] bg-[#FFFDF8]/88 shadow-sm ${compact ? "p-2" : "p-4"}`}>
      <div className="text-teal-700">{icon}</div>
      <p className={`${compact ? "mt-1 text-[0.55rem]" : "mt-3 text-xs"} font-black uppercase text-[#7A6A58]`}>{label}</p>
      <p className={`${compact ? "text-sm" : "mt-1 text-2xl"} font-black`}>{value}</p>
    </div>
  );
}

function LaunchStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#E5D8C8]/80 bg-[#FFFDF8]/70 p-4 shadow-lg shadow-[#2A1A12]/10 backdrop-blur">
      <p className="text-xl font-black text-[#1F160F]">{value}</p>
      <p className="mt-1 text-xs font-black uppercase leading-4 text-[#7A6A58]">{label}</p>
    </div>
  );
}

function ProblemCard({ icon, title, text, index }: { icon: ReactNode; title: string; text: string; index: number }) {
  return (
    <div className="reveal landing-tilt-card rounded-[1.7rem] border border-[#E5D8C8]/80 bg-[#FFFDF8]/75 p-7 shadow-xl shadow-[#2A1A12]/10 backdrop-blur" style={{ transitionDelay: `${index * 80}ms` }}>
      <span className="landing-icon-cube grid h-12 w-12 place-items-center rounded-2xl bg-[#1F160F] text-teal-200 shadow-xl shadow-slate-950/15">{icon}</span>
      <h3 className="mt-5 text-xl font-black">{title}</h3>
      <p className="mt-3 leading-7 text-[#6B5B4A]">{text}</p>
    </div>
  );
}

function WorkflowBlock({ step, index }: { step: string; index: number }) {
  return (
    <div className="landing-flow-block relative rounded-2xl border border-[#E5D8C8]/80 bg-[#FFFDF8]/78 p-5 shadow-xl shadow-[#2A1A12]/10 backdrop-blur">
      {index < workflowSteps.length - 1 && <span className="landing-flow-connector hidden lg:block" />}
      <span className="landing-number-cube grid h-11 w-11 place-items-center rounded-xl bg-[#1F160F] text-sm font-black text-white shadow-xl shadow-slate-950/15">{index + 1}</span>
      <p className="mt-5 font-black">{step}</p>
    </div>
  );
}

function BenchmarkCard({ label, value, tone, featured = false }: { label: string; value: string; tone: "warm" | "green" | "brown"; featured?: boolean }) {
  const barClass = tone === "warm" ? "from-orange-400 to-red-500" : tone === "green" ? "from-teal-300 to-teal-600" : "from-[#7A6A58] to-[#1F160F]";
  return (
    <div className={`reveal landing-metric-card rounded-[1.7rem] border border-[#E5D8C8]/80 bg-[#FFFDF8]/78 p-7 shadow-xl shadow-[#2A1A12]/10 backdrop-blur ${featured ? "landing-gpu-glow" : ""}`}>
      <div className="flex items-center justify-between">
        <BarChart3 className={tone === "warm" ? "text-orange-600" : tone === "green" ? "text-teal-700" : "text-[#1F160F]"} size={22} />
        <span className="rounded-full bg-[#FFFBF3] px-2.5 py-1 text-xs font-black text-[#6B5B4A]">live</span>
      </div>
      <p className="mt-5 text-xs font-black uppercase text-[#7A6A58]">{label}</p>
      <p className="mt-2 min-h-16 text-2xl font-black">{value}</p>
      <div className="mt-5 h-2 rounded-full bg-[#E5D8C8]/70">
        <div className={`landing-race-bar h-full rounded-full bg-gradient-to-r ${barClass}`} />
      </div>
    </div>
  );
}

function DemoStep({ title, icon, index }: { title: string; icon: ReactNode; index: number }) {
  return (
    <div className="landing-demo-step reveal rounded-[1.6rem] border border-[#E5D8C8]/80 bg-[#FFFDF8]/78 p-6 shadow-xl shadow-[#2A1A12]/10 backdrop-blur" style={{ transitionDelay: `${index * 55}ms` }}>
      <div className="flex items-center justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700 shadow-inner">{icon}</span>
        <span className="text-sm font-black text-teal-700">0{index + 1}</span>
      </div>
      <p className="mt-5 font-black">{title}</p>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="reveal">
      <p className="text-sm font-black uppercase text-teal-700">{eyebrow}</p>
      <h2 className="mt-2 max-w-3xl text-3xl font-black leading-tight md:text-4xl">{title}</h2>
    </div>
  );
}

function LandingButton({ children, onClick, tone }: { children: ReactNode; onClick: () => void; tone: "primary" | "secondary" }) {
  const className = tone === "primary"
    ? "bg-[#1F160F] text-[#FFFDF8] shadow-xl shadow-[#2A1A12]/20"
    : "border border-[#DED0BD] bg-[#FFFDF8]/75 text-[#1F160F] shadow-sm backdrop-blur";
  return <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-black transition hover:-translate-y-0.5 ${className}`}>{children}</button>;
}
