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
    <div className="section">
      <span className="section-label">Optimizer</span>

      <button className="btn-primary" disabled={!hasImage} onClick={onAnalyze}>
        Analyze
      </button>

      {suggestions !== null && (
        <div className="suggestions-result">
          {suggestions.length === 0 ? (
            <div className="suggestion-ok">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Looks good — emoji is well composed!
            </div>
          ) : (
            suggestions.map((s, i) => (
              <div className="suggestion-item" key={i}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0, marginTop: 1 }}
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                {s}
              </div>
            ))
          )}

          <div className="emoji-compare">
            <div className="emoji-figure">
              <div className="emoji-frame">
                <img
                  src={customEmojiDataUrl ?? ""}
                  width={64}
                  height={64}
                  alt="Your emoji"
                />
              </div>
              <span className="emoji-caption">Yours</span>
            </div>
            <div className="emoji-figure">
              <div className="emoji-frame">
                <img
                  src={referenceEmojiSrc}
                  width={64}
                  height={64}
                  alt="Reference"
                />
              </div>
              <span className="emoji-caption">Reference</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
