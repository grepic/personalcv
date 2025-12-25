import { PrismaClient, Role, PostType, EmploymentType, JobStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create a candidate user
  const candidate = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      passwordHash: hashedPassword,
      displayName: 'John Doe',
      headline: 'Senior Full-Stack Developer',
      location: 'Prague, Czech Republic',
      roles: [Role.CANDIDATE],
      isLookingForJob: true,
      isOfferingFreelance: false,
      templateId: 'minimal_light',
      skills: {
        create: [
          { name: 'React' },
          { name: 'TypeScript' },
          { name: 'Node.js' },
          { name: 'PostgreSQL' },
        ],
      },
      languages: {
        create: [
          { name: 'English', level: 'Fluent' },
          { name: 'Czech', level: 'Native' },
        ],
      },
      experience: {
        create: [
          {
            title: 'Senior Full-Stack Developer',
            companyName: 'Tech Corp',
            location: 'Prague, CZ',
            startDate: new Date('2021-01-01'),
            isCurrent: true,
            description: 'Leading development of web applications using React and Node.js',
          },
          {
            title: 'Full-Stack Developer',
            companyName: 'StartupXYZ',
            location: 'Remote',
            startDate: new Date('2019-03-01'),
            endDate: new Date('2020-12-31'),
            isCurrent: false,
            description: 'Built and maintained e-commerce platform',
          },
        ],
      },
      education: {
        create: [
          {
            school: 'Charles University',
            degree: 'Master of Science',
            field: 'Computer Science',
            startDate: new Date('2015-09-01'),
            endDate: new Date('2017-06-30'),
            description: 'Specialized in software engineering and databases',
          },
        ],
      },
      certifications: {
        create: [
          {
            title: 'AWS Certified Developer',
            issuer: 'Amazon Web Services',
            date: new Date('2022-05-15'),
            url: 'https://aws.amazon.com/certification/',
          },
        ],
      },
      portfolioProjects: {
        create: [
          {
            title: 'E-commerce Platform',
            description: 'Built a full-featured online store with React and Node.js',
            mediaUrls: [],
            externalUrl: 'https://github.com/johndoe/ecommerce',
          },
        ],
      },
      preferences: {
        create: {
          notifyJobsFromFollowedCompanies: true,
          notifyJobsMatchingSkills: true,
        },
      },
    },
  });

  // 2. Create a freelancer user
  const freelancer = await prisma.user.create({
    data: {
      email: 'anna.smith@example.com',
      passwordHash: hashedPassword,
      displayName: 'Anna Smith',
      headline: 'Graphic Designer & Illustrator',
      location: 'Brno, Czech Republic',
      roles: [Role.FREELANCER, Role.CANDIDATE],
      isLookingForJob: true,
      isOfferingFreelance: true,
      templateId: 'modern_dark',
      skills: {
        create: [
          { name: 'Graphic Design' },
          { name: 'Illustration' },
          { name: 'Adobe Photoshop' },
          { name: 'Figma' },
        ],
      },
      services: {
        create: [
          {
            name: 'Logo Design',
            description: 'Professional logo design for your brand',
            price: 200,
            currency: 'USD',
            deliveryTime: '5 days',
          },
          {
            name: 'Social Media Graphics',
            description: 'Custom graphics for Instagram, Facebook, etc.',
            price: 50,
            currency: 'USD',
            deliveryTime: '2 days',
          },
        ],
      },
      experience: {
        create: [
          {
            title: 'Freelance Graphic Designer',
            companyName: 'Self-employed',
            location: 'Remote',
            startDate: new Date('2020-01-01'),
            isCurrent: true,
            description: 'Creating visual content for various clients',
          },
        ],
      },
      preferences: {
        create: {
          notifyJobsFromFollowedCompanies: true,
          notifyJobsMatchingSkills: true,
        },
      },
    },
  });

  // 3. Create a company user
  const company = await prisma.user.create({
    data: {
      email: 'hr@techcompany.com',
      passwordHash: hashedPassword,
      displayName: 'TechCompany s.r.o.',
      headline: 'Leading software development company',
      location: 'Prague, Czech Republic',
      roles: [Role.COMPANY],
      isLookingForJob: false,
      isOfferingFreelance: false,
      companyName: 'TechCompany s.r.o.',
      companySize: 'SIZE_51_200',
      industry: 'Information Technology',
      websiteUrl: 'https://techcompany.com',
      about: 'We are a leading software development company specializing in web and mobile applications.',
    },
  });

  // 4. Create a job
  const job = await prisma.job.create({
    data: {
      companyId: company.id,
      title: 'Senior React Developer',
      description: 'We are looking for an experienced React developer to join our team...',
      employmentType: EmploymentType.FULL_TIME,
      location: 'Prague, Czech Republic',
      isRemote: true,
      salaryMin: 60000,
      salaryMax: 80000,
      currency: 'USD',
      status: JobStatus.OPEN,
      skills: {
        create: [
          { name: 'React' },
          { name: 'TypeScript' },
          { name: 'Node.js' },
        ],
      },
    },
  });

  // 5. Create a job post
  const jobPost = await prisma.post.create({
    data: {
      authorId: company.id,
      type: PostType.JOB,
      title: 'Senior React Developer',
      content: 'We are looking for an experienced React developer to join our team...',
      mediaUrls: [],
      tags: ['React', 'TypeScript', 'Remote'],
      visibility: 'public',
      jobId: job.id,
    },
  });

  // 6. Create a status post from candidate
  await prisma.post.create({
    data: {
      authorId: candidate.id,
      type: PostType.STATUS,
      content: 'Looking for new opportunities as a Full-Stack Developer. Open to remote positions!',
      mediaUrls: [],
      tags: ['LookingForJob', 'FullStack'],
      visibility: 'public',
    },
  });

  // 7. Create a portfolio post from freelancer
  await prisma.post.create({
    data: {
      authorId: freelancer.id,
      type: PostType.PORTFOLIO,
      title: 'Brand Identity for StartupXYZ',
      content: 'Recently completed a full brand identity project including logo, color palette, and marketing materials.',
      mediaUrls: [],
      tags: ['GraphicDesign', 'Branding'],
      visibility: 'public',
    },
  });

  // 8. Create a job application
  const application = await prisma.application.create({
    data: {
      jobId: job.id,
      candidateId: candidate.id,
      companyId: company.id,
      status: 'NEW',
    },
  });

  // 9. Create a candidate review
  const recruiter = await prisma.user.create({
    data: {
      email: 'recruiter@techcompany.com',
      passwordHash: hashedPassword,
      displayName: 'Sarah Johnson',
      headline: 'Senior Technical Recruiter',
      location: 'Prague, Czech Republic',
      roles: [Role.COMPANY],
      isLookingForJob: false,
      isOfferingFreelance: false,
      companyName: 'TechCompany s.r.o.',
    },
  });

  await prisma.candidateReview.create({
    data: {
      candidateId: candidate.id,
      companyId: company.id,
      jobId: job.id,
      authorId: recruiter.id,
      round: 1,
      title: 'HR Screening',
      hardSkills: 4,
      softSkills: 5,
      language: 5,
      cultureFit: 4,
      overallRecommendation: 'HIRE',
      summary: 'Strong candidate with excellent communication skills and relevant experience.',
    },
  });

  // 10. Create candidate comments
  await prisma.candidateComment.create({
    data: {
      candidateId: candidate.id,
      companyId: company.id,
      jobId: job.id,
      authorId: recruiter.id,
      anchorType: 'EXPERIENCE',
      anchorId: candidate.id,
      text: 'Great experience at Tech Corp. Need to verify the timeline in next interview.',
      resolved: false,
    },
  });

  // 11. Create a conversation with messages
  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { userId: candidate.id },
          { userId: recruiter.id },
        ],
      },
      messages: {
        create: [
          {
            senderId: recruiter.id,
            text: 'Hi John, I saw your application for the Senior React Developer position. Would you be available for a call this week?',
          },
          {
            senderId: candidate.id,
            text: 'Hi Sarah, yes I would be happy to talk! I am available on Wednesday or Thursday afternoon.',
          },
          {
            senderId: recruiter.id,
            text: 'Great! Let\'s schedule for Thursday at 2 PM. I\'ll send you a calendar invite.',
          },
        ],
      },
    },
  });

  // 12. Create follow relationships
  await prisma.userFollowCompany.create({
    data: {
      userId: candidate.id,
      companyId: company.id,
    },
  });

  await prisma.userFollowRole.create({
    data: {
      userId: candidate.id,
      roleKeyword: 'Full-Stack Developer',
    },
  });

  // 13. Create notifications
  await prisma.notification.create({
    data: {
      userId: candidate.id,
      type: 'JOB_POSTED',
      data: {
        jobId: job.id,
        companyId: company.id,
        jobTitle: job.title,
      },
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: company.id,
      type: 'APPLICATION_UPDATE',
      data: {
        applicationId: application.id,
        candidateId: candidate.id,
        jobId: job.id,
        status: 'NEW',
      },
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: candidate.id,
      type: 'MESSAGE',
      data: {
        conversationId: conversation.id,
        senderId: recruiter.id,
        senderName: recruiter.displayName,
      },
      isRead: false,
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('Test accounts created:');
  console.log('1. Candidate: john.doe@example.com / password123');
  console.log('2. Freelancer: anna.smith@example.com / password123');
  console.log('3. Company: hr@techcompany.com / password123');
  console.log('4. Recruiter: recruiter@techcompany.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
