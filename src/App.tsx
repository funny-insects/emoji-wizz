import "./App.css";
import { EmojiCanvas } from "./components/EmojiCanvas";
import { PLATFORM_PRESETS } from "./utils/presets";

const slackPreset = PLATFORM_PRESETS.find((p) => p.id === "slack")!;

function App() {
  return (
    <div className="app">
      <h1>Emoji Wizz</h1>
      <p>Create custom emojis that look great in Slack.</p>
      <EmojiCanvas preset={slackPreset} />
    </div>
  );
}

export default App;
