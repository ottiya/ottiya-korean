import feedbackIcon from "@assets/Feedback_1778386741953.png";

const SURVEY_URL = "https://forms.gle/nNmTeWvMabt71ZNX8";

export function FeedbackButton() {
  return (
    <a
      href={SURVEY_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Give feedback"
      style={{
        position: "fixed",
        bottom: 20,
        left: 16,
        zIndex: 9999,
        width: 54,
        height: 54,
        borderRadius: "50%",
        background: "#fff",
        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        textDecoration: "none",
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.12)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 22px rgba(0,0,0,0.24)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.18)";
      }}
    >
      <img
        src={feedbackIcon}
        alt="Feedback"
        style={{ width: 34, height: 34, objectFit: "contain", display: "block" }}
        draggable={false}
      />
    </a>
  );
}
