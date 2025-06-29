// src/components/ShopRedirect.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import { useAuth } from "../hooks/useAuth";

const ShopRedirect: React.FC = () => {
  //   const { user } = useAuth();
  const navigate = useNavigate();

  //   useEffect(() => {
  //     if (user && user.slug) {
  //       // ログイン中ユーザーの slug がある場合、その slug 付きパスへリダイレクト
  //       navigate(`/shop/${user.slug}`, { replace: true });
  //     } else {
  //       // 未ログインなどで user が取れない場合はトップに戻す、またはログイン画面へ飛ばす
  //       navigate("/", { replace: true });
  //     }
  //   }, [user, navigate]);

  useEffect(() => {
    // トップに戻す、またはログイン画面へ飛ばす
    navigate("/", { replace: true });
  }, [navigate]);

  // 何も描画しない
  return null;
};

export default ShopRedirect;
