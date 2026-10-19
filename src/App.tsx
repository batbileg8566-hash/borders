import { Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import { DataProvider, useData } from "./lib/DataProvider";
import { useRoute } from "./lib/router";
import { Shell, type NavKey } from "./components/Shell";
import { MapView } from "./views/MapView";
import { PortDetail } from "./views/PortDetail";
import { GoodDetail, GoodsMatrix } from "./views/GoodsViews";
import { AboutView, ProposalsView, RegistryView, RegulationDetail, RegulationsList } from "./views/LegalViews";
import { SITE } from "./config/site";

// Ховор ашиглагддаг хэсгүүдийг шаардлагатай үед нь ачаална
const ChatPanel = lazy(() => import("./components/ChatPanel").then((m) => ({ default: m.ChatPanel })));
const AdminImageModal = lazy(() =>
  import("./components/AdminImageModal").then((m) => ({ default: m.AdminImageModal })),
);

function Routes() {
  const { path, query } = useRoute();
  const { ports, refresh } = useData();
  const [chatOpen, setChatOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const [root, id] = path;
  let current: NavKey = "map";
  let view: ReactNode;
  let title = "";
  let fullBleed = false;

  switch (root) {
    case "port": {
      const p = ports.find((x) => x.id === id);
      current = "registry";
      title = p?.name ?? "Нэгж";
      view = <PortDetail id={id} />;
      break;
    }
    case "goods":
      current = "goods";
      title = id ? "Бараа" : "Бараа ба боомт";
      view = id ? <GoodDetail id={id} /> : <GoodsMatrix />;
      break;
    case "acts":
      current = "acts";
      title = id ? "Эрх зүйн акт" : "Эрх зүйн акт";
      view = id ? <RegulationDetail id={id} /> : <RegulationsList />;
      break;
    case "proposals":
      current = "proposals";
      title = "Нэмэх санал";
      view = <ProposalsView />;
      break;
    case "registry":
      current = "registry";
      title = "Нэгдсэн бүртгэл";
      view = <RegistryView />;
      break;
    case "about":
      current = "about";
      title = "Эх сурвалж";
      view = <AboutView />;
      break;
    default:
      fullBleed = true;
      title = "Газрын зураг";
      view = <MapView />;
  }

  useEffect(() => {
    document.title = `${title} | ${SITE.shortSystem}`;
    if (!fullBleed) window.scrollTo(0, 0);
  }, [root, id, title]);

  const focus = root === "port" ? ports.find((p) => p.id === id) ?? null : ports.find((p) => p.id === query.get("sel")) ?? null;

  return (
    <>
      <Shell current={current} fullBleed={fullBleed} onOpenChat={() => setChatOpen(true)} onOpenAdmin={() => setAdminOpen(true)}>
        {view}
      </Shell>
      <Suspense fallback={null}>
        {chatOpen && <ChatPanel focus={focus} onClose={() => setChatOpen(false)} />}
        {adminOpen && (
          <AdminImageModal isOpen onClose={() => setAdminOpen(false)} onUpdate={refresh} currentBorders={ports} />
        )}
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <DataProvider>
      <Routes />
    </DataProvider>
  );
}
