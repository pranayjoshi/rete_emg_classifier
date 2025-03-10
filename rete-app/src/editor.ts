import { createRoot } from "react-dom/client";
import { NodeEditor } from "rete";
import { AreaPlugin, AreaExtensions } from "rete-area-plugin";
import {
  ClassicFlow,
  ConnectionPlugin,
  getSourceTarget,
} from "rete-connection-plugin";
import { ReactPlugin, Presets, ReactArea2D } from "rete-react-plugin";
import {
  AutoArrangePlugin,
  Presets as ArrangePresets,
} from "rete-auto-arrange-plugin";
import { DataflowEngine, ControlFlowEngine } from "rete-engine";
import {
  ContextMenuExtra,
  ContextMenuPlugin,
  Presets as ContextMenuPresets,
} from "rete-context-menu-plugin";
import {
  DebugChat,
  Message,
  OnMessage,
  MatchMessage,
  SendMessage,
} from "./chatbot/nodes";
import { ActionSocket, TextSocket } from "./chatbot/sockets";
import { Schemes } from "./chatbot/types";
import { Connection } from "./chatbot/connection";
import { ActionSocketComponent } from "./chatbot/ui/ActionSocket";
import { TextSocketComponent } from "./chatbot/ui/TextSocket";
import { ActionConnectionComponent } from "./chatbot/ui/ActionConnection";
import { TextConnectionComponent } from "./chatbot/ui/TextConnection";
import { ChatNodeComponent } from "./chatbot/ui/Chat";
import { CustomNodeComponent } from "./chatbot/ui/CustomNode";
import { getConnectionSockets } from "./chatbot/utils";
import { addCustomBackground } from "./chatbot/ui/background";
import * as ContextMenuComponents from "./chatbot/ui/context-menu";

type AreaExtra = ReactArea2D<any> | ContextMenuExtra;

export async function createEditor(
  container: HTMLElement,
  log: (text: string, type: "info" | "error") => void
) {
  const editor = new NodeEditor<Schemes>();
  const area = new AreaPlugin<Schemes, AreaExtra>(container, { scope: 'root' });

  console.log("Initializing AreaPlugin...", area);

  const connection = new ConnectionPlugin<Schemes, AreaExtra>();
  const render = new ReactPlugin<Schemes, AreaExtra>({ createRoot });
  const arrange = new AutoArrangePlugin<Schemes, AreaExtra>();
  const dataflow = new DataflowEngine<Schemes>(({ inputs, outputs }) => {
    return {
      inputs: () =>
        Object.entries(inputs)
          .filter(([_, input]) => input.socket instanceof TextSocket)
          .map(([name]) => name),
      outputs: () =>
        Object.entries(outputs)
          .filter(([_, output]) => output.socket instanceof TextSocket)
          .map(([name]) => name),
    };
  });
  const engine = new ControlFlowEngine<Schemes>(({ inputs, outputs }) => {
    return {
      inputs: () =>
        Object.entries(inputs)
          .filter(([_, input]) => input.socket instanceof ActionSocket)
          .map(([name]) => name),
      outputs: () =>
        Object.entries(outputs)
          .filter(([_, output]) => output.socket instanceof ActionSocket)
          .map(([name]) => name),
    };
  });
  function respond(text: string) {
    setTimeout(() => {
      chat.botSend(text);
    }, 500);
  }
  const contextMenu = new ContextMenuPlugin<Schemes>({
    items: ContextMenuPresets.classic.setup([
      ["On message", () => new OnMessage()],
      ["Message", () => new Message("")],
      ["Match message", () => new MatchMessage("", dataflow)],
      ["Send message", () => new SendMessage(dataflow, respond)],
    ]),
  });
  area.use(contextMenu);

  AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
    accumulating: AreaExtensions.accumulateOnCtrl(),
  });

  render.addPreset(
    Presets.contextMenu.setup({
      customize: {
        main: () => ContextMenuComponents.Menu,
        item: () => ContextMenuComponents.Item,
        common: () => ContextMenuComponents.Common,
        search: () => ContextMenuComponents.Search,
        subitems: () => ContextMenuComponents.Subitems,
      },
    })
  );
  render.addPreset(
    Presets.classic.setup({
      customize: {
        connection(data) {
          const { source, target } = getConnectionSockets(editor, data.payload);

          if (
            source instanceof ActionSocket ||
            target instanceof ActionSocket
          ) {
            return ActionConnectionComponent;
          }
          return TextConnectionComponent;
        },
        socket(data) {
          if (data.payload instanceof ActionSocket) {
            return ActionSocketComponent;
          }
          if (data.payload instanceof TextSocket) {
            return TextSocketComponent;
          }
          return Presets.classic.Socket;
        },
        node(data) {
          if (data.payload instanceof DebugChat) {
            return ChatNodeComponent;
          }
          return CustomNodeComponent;
        },
      },
    })
  );

  arrange.addPreset(ArrangePresets.classic.setup());

  connection.addPreset(
    () =>
      new ClassicFlow({
        canMakeConnection(from, to) {
          // this function checks if the old connection should be removed
          const [source, target] = getSourceTarget(from, to) || [null, null];

          if (!source || !target || from === to) return false;

          const sockets = getConnectionSockets(
            editor,
            new Connection(
              editor.getNode(source.nodeId),
              source.key as never,
              editor.getNode(target.nodeId),
              target.key as never
            )
          );
          console.log(sockets);

          if (!sockets.source.isCompatibleWith(sockets.target)) {
            log("Sockets are not compatible", "error");
            connection.drop();
            return false;
          }

          return Boolean(source && target);
        },
        makeConnection(from, to, context) {
          const [source, target] = getSourceTarget(from, to) || [null, null];
          const { editor } = context;

          if (source && target) {
            editor.addConnection(
              new Connection(
                editor.getNode(source.nodeId),
                source.key as never,
                editor.getNode(target.nodeId),
                target.key as never
              )
            );
            return true;
          }
        },
      })
  );

  editor.use(engine);
  editor.use(dataflow);
  editor.use(area);
  area.use(connection);
  area.use(render);
  area.use(arrange);

  AreaExtensions.simpleNodesOrder(area);
  AreaExtensions.showInputControl(area);

  editor.addPipe((context) => {
    if (context.type === "connectioncreate") {
      const { data } = context;
      const { source, target } = getConnectionSockets(editor, data);

      if (!source.isCompatibleWith(target)) {
        log("Sockets are not compatible", "error");
        return;
      }
    }
    return context;
  });

  addCustomBackground(area);

  const onMessage = new OnMessage();
  const match = new MatchMessage(".*hello.*", dataflow);
  const message1 = new Message("Hello!");
  const message2 = new Message("ッ");
  const send1 = new SendMessage(dataflow, respond);
  const send2 = new SendMessage(dataflow, respond);

  const chat = new DebugChat((message) => {
    area.update("node", chat.id);
    if (message.own) {
      const onMessage = editor
        .getNodes()
        .filter((n): n is OnMessage => n instanceof OnMessage);
      dataflow.reset();

      for (const node of onMessage) {
        node.inputMessage = message.message;
        engine.execute(node.id);
      }
    }
  });

  const con1 = new Connection(onMessage, "exec", match, "exec");
  const con2 = new Connection(onMessage, "text", match, "text");
  const con3 = new Connection(message1, "text", send1, "text");
  const con4 = new Connection(message2, "text", send2, "text");
  const con5 = new Connection(match, "consequent", send1, "exec");
  const con6 = new Connection(match, "alternate", send2, "exec");

  await editor.addNode(onMessage);
  await editor.addNode(match);
  await editor.addNode(message1);
  await editor.addNode(message2);
  await editor.addNode(send1);
  await editor.addNode(send2);
  await editor.addNode(chat);

  await editor.addConnection(con1);
  await editor.addConnection(con2);
  await editor.addConnection(con3);
  await editor.addConnection(con4);
  await editor.addConnection(con5);
  await editor.addConnection(con6);

  await arrange.layout();
  console.log(editor.getNodes());
  await area.translate(chat.id, { x: 1000, y: 500 });

  AreaExtensions.zoomAt(area, editor.getNodes());

  chat.botSend(
    "Hello there! I'm a chatbot based on visual programming and built using the Rete.js framework"
  );
  chat.botSend("btw, check out the [Rete.js website](https://retejs.org)");
  chat.botSend(
    "Additionally, you have the option to back my creator [on Patreon](https://www.patreon.com/bePatron?u=7890937)"
  );

  return {
    destroy: () => area.destroy(),
  };
}
