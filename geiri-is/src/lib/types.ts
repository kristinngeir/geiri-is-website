export type ProductArea = "teams" | "intune" | "entra";

export type PostStatus = "draft" | "published";

export type BlogPost = {
  type: "post";
  pk: "post";
  id: string;
  slug: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  tags: string[];
  productArea: ProductArea;
  status: PostStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  linkedInPostUrn?: string | null;
};

export type LinkedInAuthSecret = {
  type: "linkedinAuth";
  pk: "secret";
  id: "linkedinAuth";
  accessToken: string;
  expiresAt: string | null;
  memberId: string;
  createdAt: string;
  updatedAt: string;
};
