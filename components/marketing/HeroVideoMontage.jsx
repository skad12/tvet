const clips = [
  {
    label: "Black customer support specialist speaking with a headset",
    poster: "https://assets.mixkit.co/videos/24213/24213-thumb-720-0.jpg",
    src: "https://assets.mixkit.co/videos/24213/24213-720.mp4",
  },
  {
    label: "Black woman on a business support call",
    poster: "https://assets.mixkit.co/videos/24421/24421-thumb-720-0.jpg",
    src: "https://assets.mixkit.co/videos/24421/24421-720.mp4",
  },
  {
    label: "Black professional on a phone call in a data center",
    poster: "https://assets.mixkit.co/videos/23081/23081-thumb-720-0.jpg",
    src: "https://assets.mixkit.co/videos/23081/23081-720.mp4",
  },
  {
    label: "Black professional working with a computer in a server room",
    poster: "https://assets.mixkit.co/videos/23040/23040-thumb-720-0.jpg",
    src: "https://assets.mixkit.co/videos/23040/23040-720.mp4",
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
