export interface QuickLink {
  label: string;
  url: string;
}

export interface LinkGroup {
  slug: string;
  title: string;
  loginUrl?: string;
  links: QuickLink[];
}

/** Platform quick-links — edit here until Notion migration is complete. */
export const LINK_GROUPS: LinkGroup[] = [
  {
    slug: "youtube",
    title: "YouTube Eckstein Podcast",
    loginUrl: "https://studio.youtube.com",
    links: [
      { label: "Kanal", url: "https://www.youtube.com/@EcksteinPodcast" },
      { label: "Studio", url: "https://studio.youtube.com" },
      { label: "Analytics", url: "https://studio.youtube.com/channel/analytics" },
      { label: "Upload", url: "https://www.youtube.com/upload" },
    ],
  },
  {
    slug: "rumble",
    title: "Rumble Eckstein",
    loginUrl: "https://rumble.com/account",
    links: [
      { label: "Kanal", url: "https://rumble.com/c/EcksteinPodcast" },
      { label: "Dashboard", url: "https://rumble.com/account" },
    ],
  },
  {
    slug: "spotify",
    title: "Spotify Podcast",
    loginUrl: "https://podcasters.spotify.com",
    links: [
      { label: "Dashboard", url: "https://podcasters.spotify.com" },
      { label: "Analytics", url: "https://podcasters.spotify.com/analytics" },
    ],
  },
  {
    slug: "instagram",
    title: "Instagram @eckstein_podcast",
    loginUrl: "https://www.instagram.com",
    links: [
      { label: "Profil", url: "https://www.instagram.com/eckstein_podcast/" },
      { label: "Insights", url: "https://www.instagram.com/accounts/insights/" },
      { label: "Creator Studio", url: "https://business.facebook.com" },
    ],
  },
  {
    slug: "tiktok",
    title: "TikTok @eckstein_podcast",
    loginUrl: "https://www.tiktok.com/creator-center",
    links: [
      { label: "Profil", url: "https://www.tiktok.com/@eckstein_podcast" },
      { label: "Creator Center", url: "https://www.tiktok.com/creator-center" },
    ],
  },
  {
    slug: "x",
    title: "X / Twitter @EcksteinPodcast",
    loginUrl: "https://x.com/login",
    links: [
      { label: "Profil", url: "https://x.com/EcksteinPodcast" },
      { label: "Analytics", url: "https://analytics.twitter.com" },
      { label: "Post", url: "https://x.com/compose/tweet" },
    ],
  },
  {
    slug: "substack",
    title: "Substack — Das Fundament",
    loginUrl: "https://substack.com/dashboard",
    links: [
      { label: "Dashboard", url: "https://substack.com/dashboard" },
      { label: "Subscribers", url: "https://substack.com/dashboard/subscribers" },
    ],
  },
];
