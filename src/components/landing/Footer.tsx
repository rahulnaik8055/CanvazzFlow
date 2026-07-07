export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900 text-[8px] font-bold text-white">
              CF
            </div>
            <span className="text-sm font-semibold text-gray-900">CanvasFlow</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-gray-400">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors">
              GitHub
            </a>
            <a href="#" className="hover:text-gray-600 transition-colors">
              Portfolio
            </a>
            <a href="#" className="hover:text-gray-600 transition-colors">
              LinkedIn
            </a>
            <span className="text-gray-200">/</span>
            <span className="text-gray-500">Tech Stack</span>
          </div>

          <p className="text-xs text-gray-400">
            Built with <span className="text-red-400">&hearts;</span> using Next.js and NestJS
          </p>
        </div>
      </div>
    </footer>
  );
}
