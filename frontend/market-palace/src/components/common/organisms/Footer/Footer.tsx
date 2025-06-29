import React from "react";
import { Button } from "@/components/shadcn-ui/button";
import { Link } from "react-router-dom";
import { 
  Github, 
  Twitter, 
  Mail, 
  ExternalLink
} from "lucide-react";

const Footer: React.FC = () => (
  <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-md py-12">
    <div className="max-w-6xl mx-auto px-4">
      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* ブランド */}
        <div className="space-y-4">
          <Button
            asChild
            variant="link"
            className="p-0 h-auto flex items-center gap-2"
          >
            <Link to="/">
              <img src="/appicon.svg" alt="Logo" className="h-6 w-6" />
              <span className="font-bold text-xl tracking-tight group-hover:opacity-80 transition">
                AudioGen SaaS
              </span>
            </Link>
          </Button>
        </div>

        {/* 製品 */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">製品</h3>
          <nav className="space-y-2">
            <Button asChild variant="link" className="p-0 h-auto justify-start text-sm text-muted-foreground hover:text-gray-900 block mb-2">
              <Link to="/pricing">価格プラン</Link>
            </Button>
            <Button asChild variant="link" className="p-0 h-auto justify-start text-sm text-muted-foreground hover:text-gray-900 block">
              <Link to="/docs">API ドキュメント</Link>
            </Button>
          </nav>
        </div>

        {/* 法的情報 */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">法的情報</h3>
          <nav className="space-y-2">
            <Button asChild variant="link" className="p-0 h-auto justify-start text-sm text-muted-foreground hover:text-gray-900 block mb-2">
              <a href="#privacy">プライバシーポリシー</a>
            </Button>
            <Button asChild variant="link" className="p-0 h-auto justify-start text-sm text-muted-foreground hover:text-gray-900 block">
              <a href="#terms">利用規約</a>
            </Button>
          </nav>
        </div>
      </div>

      {/* ソーシャルメディア */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0"
          >
            <a href="https://github.com/NakazawaTakuma" target="_blank" rel="noopener noreferrer">
              <Github className="h-5 w-5" />
            </a>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0"
          >
            <a href="https://x.com/tzero3_" target="_blank" rel="noopener noreferrer">
              <Twitter className="h-5 w-5" />
            </a>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0"
          >
            <a href="mailto:tzero30208@gmail.com">
              <Mail className="h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>

      {/* 区切り線 */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} AudioGen SaaS. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Powered by</span>
            <a 
              href="https://ui.shadcn.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-gray-900 transition-colors"
            >
              shadcn/ui
              <ExternalLink className="h-3 w-3" />
            </a>
            <span>&</span>
            <a 
              href="https://tailwindcss.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-gray-900 transition-colors"
            >
              Tailwind CSS
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
