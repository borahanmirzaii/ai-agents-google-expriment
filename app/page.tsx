export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between text-center">
        <h1 className="text-4xl font-bold mb-4">
          AI Life Management
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Your AI-powered personal assistant for holistic life management
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Multi-Format Notes</h2>
            <p className="text-sm text-muted-foreground">
              Capture ideas via text, voice, images, and video
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold mb-2">AI Assistant</h2>
            <p className="text-sm text-muted-foreground">
              Powered by Gemini for smart insights and automation
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold mb-2">8 Pillars System</h2>
            <p className="text-sm text-muted-foreground">
              Track progress across all aspects of life
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Google Integration</h2>
            <p className="text-sm text-muted-foreground">
              Seamless sync with Calendar, Gmail, Drive & more
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
