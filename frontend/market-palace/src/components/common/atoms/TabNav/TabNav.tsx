import {
  useEffect,
  useRef,
  useState,
  useCallback,
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
} from "react";
import styles from "./TabNav.module.css";

export type TabKey = string;

export interface TabItem<K extends TabKey> {
  key: K;
  label: string;
}

interface TabNavProps<K extends TabKey> {
  tabs: readonly TabItem<K>[];
  activeTab: K;
  onTabChange: (tab: K) => void;
}

export function TabNav<K extends TabKey>({
  tabs,
  activeTab,
  onTabChange,
}: TabNavProps<K>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const isDragging = useRef(false);
  const isDragAction = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const ticking = useRef(false);
  const DRAG_THRESHOLD = 5;

  // インジケーター再計算をメモ化
  const updateIndicator = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    const btn = nav.querySelector<HTMLButtonElement>(
      `button[data-tab-button="${activeTab}"]`
    );
    if (!btn) return;
    setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [activeTab]);

  // 左右ボタン表示制御
  const updateScrollButtons = () => {
    const sc = scrollRef.current;
    if (!sc) return;
    setShowLeft(sc.scrollLeft > 0);
    setShowRight(sc.scrollLeft + sc.clientWidth < sc.scrollWidth);
  };

  // スクロール＆インジケーター同期（ドラッグ中はインジケーター更新をスキップ）
  const sync = () => {
    updateScrollButtons();
    ticking.current = false;
  };

  // 初期描画／タブ切り替え時
  useEffect(() => {
    updateScrollButtons();
    updateIndicator();
  }, [activeTab, tabs, updateIndicator]);

  // リサイズ時
  useEffect(() => {
    const onResize = () => {
      updateScrollButtons();
      if (!isDragging.current) {
        updateIndicator();
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateIndicator]);

  // 通常スクロール時
  const onScroll = () => {
    updateScrollButtons();
    if (!isDragging.current) {
      updateIndicator();
    }
  };

  // マウスダウン開始
  const onMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    const sc = scrollRef.current;
    if (!sc) return;
    isDragging.current = true;
    isDragAction.current = false;
    startX.current = e.pageX - sc.offsetLeft;
    scrollStart.current = sc.scrollLeft;
    document.body.style.userSelect = "none";
    sc.style.scrollBehavior = "auto";
  };

  // マウス移動中
  const onMouseMove = (e: MouseEvent) => {
    const sc = scrollRef.current;
    if (!isDragging.current || !sc) return;
    const x = e.pageX - sc.offsetLeft;
    const walk = x - startX.current;
    sc.scrollLeft = scrollStart.current - walk;
    if (Math.abs(walk) > DRAG_THRESHOLD) isDragAction.current = true;
    if (!ticking.current) {
      window.requestAnimationFrame(sync);
      ticking.current = true;
    }
  };

  // マウスアップ終了
  const onMouseUp = () => {
    const sc = scrollRef.current;
    isDragging.current = false;
    setTimeout(() => {
      isDragAction.current = false;
    }, 0);
    document.body.style.userSelect = "";
    if (sc) {
      sc.style.scrollBehavior = "smooth";
    }
  };

  // タッチ開始
  const onTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    const sc = scrollRef.current;
    if (!sc) return;
    isDragging.current = true;
    isDragAction.current = false;
    startX.current = e.touches[0].pageX - sc.offsetLeft;
    scrollStart.current = sc.scrollLeft;
    sc.style.scrollBehavior = "auto";
  };

  // タッチ移動中
  const onTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    const sc = scrollRef.current;
    if (!isDragging.current || !sc) return;
    const x = e.touches[0].pageX - sc.offsetLeft;
    const walk = x - startX.current;
    sc.scrollLeft = scrollStart.current - walk;
    if (Math.abs(walk) > DRAG_THRESHOLD) isDragAction.current = true;
    if (!ticking.current) {
      window.requestAnimationFrame(sync);
      ticking.current = true;
    }
  };

  // タッチ終了
  const onTouchEnd = () => {
    const sc = scrollRef.current;
    isDragging.current = false;
    setTimeout(() => {
      isDragAction.current = false;
    }, 0);
    if (sc) {
      sc.style.scrollBehavior = "smooth";
      updateIndicator();
    }
  };

  // ドキュメントにグローバルリスナー
  useEffect(() => {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // タブクリック（ドラッグ中は無効）
  const handleTabClick = (key: K) => {
    if (isDragAction.current) return;
    onTabChange(key);
  };

  // 左右ボタンクリック（ドラッグ中は無効）
  const handleScrollBy = (offset: number) => {
    if (isDragAction.current) return;
    const sc = scrollRef.current;
    if (!sc) return;
    sc.scrollBy({ left: offset, behavior: "smooth" });
    // スムーススクロール完了後に再計算
    setTimeout(() => {
      updateScrollButtons();
      updateIndicator();
    }, 300);
  };

  return (
    <div className={styles.navWrapper}>
      <button
        className={`${styles.scrollBtn} ${styles.left} ${!showLeft ? styles.hidden : ""}`}
        onClick={() => handleScrollBy(-150)}
        aria-label="前のタブ"
      >
        ‹
      </button>

      <div
        className={styles.navScroll}
        ref={scrollRef}
        onScroll={onScroll}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ cursor: isDragging.current ? "grabbing" : "grab" }}
      >
        <nav className={styles.nav} ref={navRef}>
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              data-tab-button={key}
              onClick={() => handleTabClick(key)}
              className={`${styles.button} ${activeTab === key ? styles.active : ""}`}
            >
              {label}
            </button>
          ))}
          <span
            className={styles.indicator}
            style={{ left: indicator.left, width: indicator.width }}
          />
        </nav>
      </div>

      <button
        className={`${styles.scrollBtn} ${styles.right} ${!showRight ? styles.hidden : ""}`}
        onClick={() => handleScrollBy(150)}
        aria-label="次のタブ"
      >
        ›
      </button>
    </div>
  );
}
