import { lazy, useEffect, useState } from "react";

let Editor = lazy(() =>
  import("../editor").then((mod) => ({ default: mod.Editor })),
);

export default function App() {
  let [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }
  return <Editor />;
}
