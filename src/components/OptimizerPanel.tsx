export interface OptimizerPanelProps {
  hasImage: boolean;
  onAnalyze: () => void;
  suggestions: string[] | null;
  customEmojiDataUrl: string | null;
  referenceEmojiSrc: string;
}

export function OptimizerPanel({
  hasImage,
  onAnalyze,
  suggestions,
  customEmojiDataUrl,
  referenceEmojiSrc,
}: OptimizerPanelProps) {
  return (
    <div>
      <button disabled={!hasImage} onClick={onAnalyze}>
        Analyze
      </button>

      {suggestions !== null && (
        <div>
          {suggestions.length === 0 ? (
            <p>Looks good!</p>
          ) : (
            <ul>
              {suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          )}

          <div>
            <figure>
              <img
                src={customEmojiDataUrl ?? ""}
                width={64}
                height={64}
                alt="Your emoji"
              />
              <figcaption>Your emoji</figcaption>
            </figure>
            <figure>
              <img
                src={referenceEmojiSrc}
                width={64}
                height={64}
                alt="Reference"
              />
              <figcaption>Reference</figcaption>
            </figure>
          </div>
        </div>
      )}
    </div>
  );
}
