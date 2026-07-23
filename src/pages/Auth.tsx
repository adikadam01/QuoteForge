import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, FileText, Send, CheckCircle2, Receipt, ArrowRight } from 'lucide-react';

export default function Auth() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn('', password);
      if (error) {
        toast.error(error.message || 'Invalid password');
      } else {
        toast.success('Welcome back!');
        navigate('/');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const flowSteps = [
    { label: 'Create Quote', icon: FileText },
    { label: 'Send to Client', icon: Send },
    { label: 'Client Approves', icon: CheckCircle2 },
    { label: 'Invoice & Get Paid', icon: Receipt },
  ];

  return (
    <div className="min-h-screen w-full bg-white flex items-stretch">
      <style>{`
        @keyframes qf-dash {
          to { stroke-dashoffset: -24; }
        }
        @keyframes qf-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes qf-pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(0,0,0,0.15); }
          70% { box-shadow: 0 0 0 10px rgba(0,0,0,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
        }
        .qf-dash-line {
          stroke-dasharray: 6 6;
          animation: qf-dash 1.2s linear infinite;
        }
        .qf-float {
          animation: qf-float 3.5s ease-in-out infinite;
        }
        .qf-float-delay-1 { animation-delay: 0.3s; }
        .qf-float-delay-2 { animation-delay: 0.6s; }
        .qf-float-delay-3 { animation-delay: 0.9s; }
        .qf-pulse-ring {
          animation: qf-pulse-ring 2.2s ease-out infinite;
        }
      `}</style>

      {/* Left Panel: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-10">
            {/* Paste your company logo path in the src below */}
            <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center mb-6 overflow-hidden shadow-sm">
              <img
                src="/path-to-your-logo.png"
                alt="Company Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <span className="hidden w-full h-full items-center justify-center text-white font-heading font-bold text-xl">
                Q
              </span>
            </div>

            <h1 className="text-4xl font-heading font-bold text-black tracking-tight">
              Welcome back.
            </h1>
            <p className="text-gray-500 mt-3 text-base">
              Sign in to create, send, and manage your professional quotations.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold tracking-wider uppercase text-gray-500">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="rounded-xl pr-10 h-12 border-gray-300 focus-visible:ring-black/20 focus-visible:border-black"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl h-12 font-heading gap-2 bg-black text-white hover:bg-black/85 transition-all shadow-sm hover:shadow-md"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <p className="text-xs text-gray-400 mt-8 text-center lg:text-left">
            Designed &amp; developed by <span className="font-semibold text-black">Triple S Production</span>
          </p>
        </div>
      </div>

      {/* Right Panel: Project Info + Animated Flowchart */}
      <div className="hidden lg:flex w-1/2 bg-black relative overflow-hidden items-center justify-center p-10">
        {/* subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 w-full max-w-lg animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-white qf-pulse-ring" />
            Quotation Workflow
          </div>

          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white leading-tight">
            Coordinate your entire
            <br />
            <span className="text-white/60">quoting lifecycle.</span>
          </h2>
          <p className="text-white/50 mt-4 mb-10 text-sm leading-relaxed">
            QuoteForge takes you from a first draft to a paid invoice — one connected,
            trackable workflow.
          </p>

          {/* Animated Flowchart */}
          <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 relative">
              {flowSteps.map((step, idx) => (
                <div
                  key={step.label}
                  className={`qf-float qf-float-delay-${idx % 4} flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-lg`}
                >
                  <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center shrink-0">
                    <step.icon className="w-4.5 h-4.5 text-white" strokeWidth={2} />
                  </div>
                  <span className="text-sm font-semibold text-black leading-tight">
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* connecting lines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 400 220"
              preserveAspectRatio="none"
            >
              <line x1="195" y1="45" x2="205" y2="45" className="qf-dash-line" stroke="white" strokeWidth="1.5" opacity="0.35" />
              <line x1="200" y1="55" x2="200" y2="150" className="qf-dash-line" stroke="white" strokeWidth="1.5" opacity="0.35" />
              <line x1="195" y1="175" x2="205" y2="175" className="qf-dash-line" stroke="white" strokeWidth="1.5" opacity="0.35" />
            </svg>

            <div className="flex items-center justify-center gap-2 mt-6 text-white/40 text-xs">
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Every step syncs automatically in real time</span>
            </div>
          </div>

          <p className="text-white/30 text-xs mt-10 text-center">
            Designed &amp; developed by <span className="text-white/60 font-medium">Triple S Production</span>
          </p>
        </div>
      </div>
    </div>
  );
}