import { useCallback } from "react";
import { message } from "antd";
import { useRete } from "rete-react-plugin";
import { createEditor } from "./editor";

export default function App() {
  const [messageApi, contextHolder] = message.useMessage();
  const create = useCallback(
    (el: HTMLElement) => {
      return createEditor(el, (text, type) => messageApi[type](text));
    },
    [messageApi]
  );
  const [ref] = useRete(create);

  return (
    <div className="App">
      {contextHolder as React.ReactNode}
      <div ref={ref} style={{ height: "100vh", width: "100vw" }}></div>
    </div>
  );
}
