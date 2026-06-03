const clips = [
  {
    label: "Support agents working at a call center",
    poster: "https://assets.mixkit.co/videos/4610/4610-thumb-720-0.jpg",
    src: "https://assets.mixkit.co/videos/4610/4610-720.mp4",
  },
  {
    label: "Customer support team assisting callers",
    poster: "https://assets.mixkit.co/videos/4603/4603-thumb-720-0.jpg",
    src: "https://assets.mixkit.co/videos/4603/4603-720.mp4",
  },
  {
    label: "Call center team working together",
    poster: "https://assets.mixkit.co/videos/4658/4658-thumb-720-0.jpg",
    src: "https://assets.mixkit.co/videos/4658/4658-720.mp4",
  },
  {
    label: "Support specialist speaking with a customer",
    poster: "https://assets.mixkit.co/videos/42628/42628-thumb-720-0.jpg",
    src: "https://assets.mixkit.co/videos/42628/42628-720.mp4",
  },
];

export default function HeroVideoMontage() {
  return (
    <div className="hero-montage absolute inset-0 overflow-hidden bg-slate-950">
      {clips.map((clip, index) => (
        <video
          key={clip.src}
          aria-label={clip.label}
          className="hero-montage-clip absolute inset-0 h-full w-full object-cover"
          style={{ animationDelay: `${index * 8}s` }}
          src={clip.src}
          poster={clip.poster}
          autoPlay
          muted
          loop
          playsInline
          preload={index === 0 ? "auto" : "metadata"}
        />
      ))}
    </div>
  );
}
