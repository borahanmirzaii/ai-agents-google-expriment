export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <div className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          Built with Next.js, Firebase, and Google AI. Powered by Gemini.
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <a
            href="#"
            className="hover:text-foreground transition-colors"
          >
            Privacy
          </a>
          <a
            href="#"
            className="hover:text-foreground transition-colors"
          >
            Terms
          </a>
          <a
            href="#"
            className="hover:text-foreground transition-colors"
          >
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}
