// src/components/Header.tsx
import React, { useState } from "react";
import { Button } from "@/components/shadcn-ui/button";
import { Link, NavLink, useLocation } from "react-router-dom";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useAuth } from "../../../../hooks/useAuth";

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, openLogin, logout } = useAuth();
  const location = useLocation();

  // NavLinkのactive時のクラス
  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "text-black font-bold border-b-2 border-black pb-0.5"
      : "text-sm text-gray-700 hover:text-black";

  return (
    <header className="w-full border-b bg-white/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        {/* ロゴ＋サービス名（クリックでホーム） */}
        <Link to="/" className="flex items-center gap-2 group">
          <img src="/appicon.svg" alt="Logo" className="h-8 w-8" />
          <span className="font-bold text-xl tracking-tight group-hover:opacity-80 transition">
            AudioGen SaaS
          </span>
        </Link>
        {/* PCナビゲーション */}
        <nav className="hidden md:flex items-center gap-4">
          <NavLink to="/" className={navClass} end>
            ホーム
          </NavLink>
          <NavLink to="/docs" className={navClass} end>
            ドキュメント
          </NavLink>
          <NavLink to="/pricing" className={navClass} end>
            価格
          </NavLink>
          {user ? (
            <div className="flex items-center gap-2">
              <NavLink to="/mypage" className={navClass} end>
                <Button variant="outline" size="sm">
                  マイページ
                </Button>
              </NavLink>
              <span className="text-sm text-gray-600">
                {user.display_name || user.username}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                ログアウト
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => openLogin()}
              className={
                location.pathname === "/login"
                  ? "font-bold border-b-2 border-black"
                  : ""
              }
            >
              ログイン
            </Button>
          )}
        </nav>
        {/* モバイルメニュー */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <VisuallyHidden>メニュー</VisuallyHidden>
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
          {menuOpen && (
            <div className="absolute right-4 top-16 bg-white border rounded shadow-md py-2 px-4 flex flex-col gap-2 min-w-[160px] z-50">
              <NavLink to="/" className={navClass} end>
                ホーム
              </NavLink>
              <NavLink to="/docs" className={navClass} end>
                ドキュメント
              </NavLink>
              <NavLink to="/pricing" className={navClass} end>
                価格
              </NavLink>
              {user ? (
                <>
                  <NavLink to="/mypage" className={navClass} end>
                    <Button variant="outline" size="sm" className="w-full">
                      マイページ
                    </Button>
                  </NavLink>
                  <div className="text-sm text-gray-600 py-1 border-t">
                    {user.display_name || user.username}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={logout}
                  >
                    ログアウト
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  className={
                    location.pathname === "/login"
                      ? "font-bold border-b-2 border-black w-full"
                      : "w-full"
                  }
                  onClick={() => openLogin()}
                >
                  ログイン
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
