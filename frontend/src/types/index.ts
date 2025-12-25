export type Role = 'CANDIDATE' | 'FREELANCER' | 'COMPANY';

export type PostType = 'STATUS' | 'PORTFOLIO' | 'JOB';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE';

export type JobStatus = 'OPEN' | 'CLOSED';

export type ApplicationStatus = 'NEW' | 'VIEWED' | 'INTERVIEW' | 'REJECTED' | 'HIRED';

export type NotificationType = 'JOB_POSTED' | 'COMMENT' | 'MESSAGE' | 'PORTFOLIO_LIKE' | 'APPLICATION_UPDATE' | 'MENTION';

export type Recommendation = 'STRONG_HIRE' | 'HIRE' | 'NEUTRAL' | 'NO_HIRE';

export type CommentAnchorType = 'EXPERIENCE' | 'EDUCATION' | 'SKILL' | 'PROJECT' | 'GENERAL';

export interface User {
  id: string;
  email: string;
  displayName: string;
  headline?: string;
  avatarUrl?: string;
  location?: string;
  roles: Role[];
  isLookingForJob: boolean;
  isOfferingFreelance: boolean;
  templateId: string;
  companyName?: string;
  companySize?: string;
  industry?: string;
  websiteUrl?: string;
  about?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  skills?: UserSkill[];
  languages?: UserLanguage[];
  education?: Education[];
  experience?: Experience[];
  certifications?: Certification[];
  portfolioProjects?: PortfolioProject[];
  services?: FreelancerService[];
}

export interface UserSkill {
  id: string;
  userId: string;
  name: string;
}

export interface UserLanguage {
  id: string;
  userId: string;
  name: string;
  level: string;
}

export interface Education {
  id: string;
  userId: string;
  school: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface Experience {
  id: string;
  userId: string;
  title: string;
  companyName: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
}

export interface Certification {
  id: string;
  userId: string;
  title: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface PortfolioProject {
  id: string;
  userId: string;
  title: string;
  description: string;
  mediaUrls: string[];
  externalUrl?: string;
  createdAt: string;
}

export interface FreelancerService {
  id: string;
  userId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  deliveryTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  author: {
    id: string;
    displayName: string;
    headline?: string;
    avatarUrl?: string;
    roles: Role[];
    companyName?: string;
  };
  type: PostType;
  title?: string;
  content: string;
  mediaUrls: string[];
  tags: string[];
  visibility: string;
  jobId?: string;
  job?: Job;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  companyId: string;
  company?: {
    id: string;
    displayName: string;
    companyName?: string;
    avatarUrl?: string;
    location?: string;
    about?: string;
    websiteUrl?: string;
  };
  title: string;
  description: string;
  employmentType: EmploymentType;
  location: string;
  isRemote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  status: JobStatus;
  skills?: JobSkill[];
  createdAt: string;
  updatedAt: string;
}

export interface JobSkill {
  id: string;
  jobId: string;
  name: string;
}

export interface Application {
  id: string;
  jobId: string;
  job?: Job;
  candidateId: string;
  candidate?: User;
  companyId: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  data: any;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  lastMessageAt: string;
  otherUser?: User;
  lastMessage?: Message;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  text: string;
  createdAt: string;
  readAt?: string;
}

export interface CandidateReview {
  id: string;
  candidateId: string;
  companyId: string;
  jobId?: string;
  authorId: string;
  round: number;
  title: string;
  hardSkills?: number;
  softSkills?: number;
  language?: number;
  cultureFit?: number;
  overallRecommendation: Recommendation;
  summary: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateComment {
  id: string;
  candidateId: string;
  companyId: string;
  jobId?: string;
  authorId: string;
  author?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  anchorType: CommentAnchorType;
  anchorId?: string;
  text: string;
  parentCommentId?: string;
  replies?: CandidateComment[];
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}
