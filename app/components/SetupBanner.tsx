"use client";

export default function SetupBanner() {
  return (
    <div className="
      fixed inset-0 z-50 flex items-center justify-center p-4
      bg-surface/80 backdrop-blur-sm
    ">
      <div className="
        w-full max-w-lg rounded-3xl border border-red-500/30
        bg-surface-card shadow-2xl shadow-black/60
        p-6 space-y-5 animate-fade-up
      ">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-xl">
            🔑
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">API Key Not Configured</h2>
            <p className="text-xs text-text-muted mt-0.5">Turtle.ai needs a Groq API key to work</p>
          </div>
        </div>

        {/* Steps */}
        <ol className="space-y-3">
          {[
            {
              n: "1",
              title: "Get a free API key",
              body: "Go to console.groq.com/keys and create a free account, then generate an API key.",
              link: "https://console.groq.com/keys",
              linkLabel: "Open console.groq.com →",
            },
            {
              n: "2",
              title: 'Create a ".env.local" file',
              body: 'In the root of the project folder, create a file named exactly:',
              code: ".env.local",
            },
            {
              n: "3",
              title: "Add your API key",
              body: "Paste this line inside the file (replace with your actual key):",
              code: "GROQ_API_KEY=gsk_your_key_here",
            },
            {
              n: "4",
              title: "Restart the dev server",
              body: "Stop the terminal and run:",
              code: "npm run dev",
            },
          ].map((step) => (
            <li key={step.n} className="flex gap-3">
              <span className="
                flex-shrink-0 h-6 w-6 rounded-full
                bg-accent/15 border border-accent/40
                flex items-center justify-center
                text-xs font-bold text-accent
              ">
                {step.n}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{step.title}</p>
                <p className="text-xs text-text-secondary mt-0.5">{step.body}</p>
                {step.code && (
                  <code className="
                    inline-block mt-1.5 px-2.5 py-1 rounded-lg
                    bg-surface border border-surface-border
                    text-accent font-mono text-xs
                  ">
                    {step.code}
                  </code>
                )}
                {step.link && (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 text-xs text-accent hover:text-accent-hover transition-colors"
                  >
                    {step.linkLabel}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth={2} className="h-3 w-3">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>

        {/* Footer note */}
        <p className="text-[11px] text-text-muted border-t border-surface-border pt-4">
          The API key is free. Groq offers fast AI inference powered by LPU hardware.
          Your key stays in <code className="text-accent font-mono">.env.local</code> and is never committed to git.
        </p>
      </div>
    </div>
  );
}
