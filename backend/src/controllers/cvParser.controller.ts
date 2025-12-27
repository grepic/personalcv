import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import prisma from '../utils/prisma';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

// Simple CV parser using regex patterns
// In production, you'd use a more sophisticated library or AI service

/**
 * Extract text from different file formats
 */
async function extractTextFromFile(buffer: Buffer, mimetype: string): Promise<string> {
  try {
    // PDF files
    if (mimetype === 'application/pdf') {
      const data = await pdfParse(buffer);
      return data.text;
    }

    // DOCX files
    if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    // DOC files (older format) - fallback to binary parsing
    if (mimetype === 'application/msword') {
      // Basic text extraction from binary
      const text = buffer.toString('latin1');
      // Remove non-printable characters
      return text.replace(/[^\x20-\x7E\n]/g, ' ');
    }

    // Plain text files
    if (mimetype === 'text/plain') {
      return buffer.toString('utf-8');
    }

    throw new Error(`Unsupported file type: ${mimetype}`);
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw new Error('Failed to parse file. Please ensure it\'s a valid PDF, DOC, or DOCX file.');
  }
}

interface ParsedCV {
  experiences: Array<{
    title: string;
    companyName: string;
    startDate: Date;
    endDate?: Date;
    isCurrent: boolean;
    description?: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field?: string;
    startDate: Date;
    endDate?: Date;
  }>;
  skills: string[];
  email?: string;
  phone?: string;
}

function extractEmail(text: string): string | undefined {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const match = text.match(emailRegex);
  return match ? match[0] : undefined;
}

function extractPhone(text: string): string | undefined {
  const phoneRegex = /(\+?\d{1,4}[-.\s]?)?(\(?\d{1,4}\)?[-.\s]?)?[\d\s.-]{7,}/;
  const match = text.match(phoneRegex);
  return match ? match[0].trim() : undefined;
}

function extractSkills(text: string): string[] {
  const commonSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Rust', 'PHP',
    'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel',
    'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
    'Git', 'CI/CD', 'Agile', 'Scrum', 'REST', 'GraphQL', 'Microservices',
    'HTML', 'CSS', 'Sass', 'Tailwind', 'Bootstrap',
    'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch',
  ];

  const foundSkills = new Set<string>();
  const lowerText = text.toLowerCase();

  for (const skill of commonSkills) {
    if (lowerText.includes(skill.toLowerCase())) {
      foundSkills.add(skill);
    }
  }

  return Array.from(foundSkills);
}

function extractExperiences(text: string): ParsedCV['experiences'] {
  const experiences: ParsedCV['experiences'] = [];

  // Look for patterns like:
  // "Software Engineer at Company Name (2020-2023)"
  // "Senior Developer | Company Inc. | Jan 2020 - Present"

  const lines = text.split('\n');
  let currentExp: Partial<ParsedCV['experiences'][0]> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Try to match job title patterns
    const titlePattern = /(Senior|Junior|Lead|Principal|Staff)?\s*(Software|Frontend|Backend|Full[- ]?Stack|DevOps|Data|Machine Learning|AI|QA|Test|System|Network)?\s*(Engineer|Developer|Analyst|Architect|Manager|Designer|Scientist|Administrator)/i;
    const titleMatch = line.match(titlePattern);

    if (titleMatch) {
      if (currentExp && currentExp.title && currentExp.companyName) {
        experiences.push(currentExp as ParsedCV['experiences'][0]);
      }

      currentExp = {
        title: titleMatch[0],
        companyName: '',
        startDate: new Date(),
        isCurrent: false,
      };

      // Look for company name in same or next line
      const companyPattern = /(?:at|@|,|\|)\s+([A-Z][A-Za-z0-9\s&.-]+(?:Inc\.|Ltd\.|GmbH|s\.r\.o\.|a\.s\.)?)/;
      const companyMatch = line.match(companyPattern);
      if (companyMatch) {
        currentExp.companyName = companyMatch[1].trim();
      } else if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        const nextCompanyMatch = nextLine.match(companyPattern);
        if (nextCompanyMatch) {
          currentExp.companyName = nextCompanyMatch[1].trim();
        }
      }

      // Look for dates
      const datePattern = /(\d{4})\s*[-–]\s*(\d{4}|Present|Current|Now)/i;
      const dateMatch = line.match(datePattern);
      if (dateMatch) {
        currentExp.startDate = new Date(parseInt(dateMatch[1]), 0);
        if (dateMatch[2].match(/Present|Current|Now/i)) {
          currentExp.isCurrent = true;
        } else {
          currentExp.endDate = new Date(parseInt(dateMatch[2]), 11);
        }
      }
    }
  }

  if (currentExp && currentExp.title && currentExp.companyName) {
    experiences.push(currentExp as ParsedCV['experiences'][0]);
  }

  return experiences;
}

function extractEducation(text: string): ParsedCV['education'] {
  const education: ParsedCV['education'] = [];

  // Common degree patterns
  const degreePattern = /(Bachelor|Master|PhD|B\.S\.|M\.S\.|B\.A\.|M\.A\.|B\.Sc\.|M\.Sc\.)[\s']?(?:of|in|degree)?\s+([A-Za-z\s]+)/gi;
  const universityPattern = /(University|College|Institute|School)\s+(?:of\s+)?([A-Za-z\s]+)/gi;

  let match;
  while ((match = degreePattern.exec(text)) !== null) {
    const degree = match[0];
    const field = match[2]?.trim();

    // Try to find associated university
    const context = text.substring(Math.max(0, match.index - 200), Math.min(text.length, match.index + 200));
    const uniMatch = universityPattern.exec(context);

    education.push({
      school: uniMatch ? uniMatch[0] : 'Unknown University',
      degree,
      field,
      startDate: new Date(2018, 0), // Default placeholder
    });
  }

  return education;
}

export async function uploadAndParseCV(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Extract text from file based on file type
    let fileText: string;
    try {
      fileText = await extractTextFromFile(req.file.buffer, req.file.mimetype);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Failed to parse CV file' });
    }

    // Parse CV
    const parsedData: ParsedCV = {
      email: extractEmail(fileText),
      phone: extractPhone(fileText),
      skills: extractSkills(fileText),
      experiences: extractExperiences(fileText),
      education: extractEducation(fileText),
    };

    // Update user profile with parsed data
    const updatePromises: Promise<any>[] = [];

    // Add skills
    if (parsedData.skills.length > 0) {
      for (const skillName of parsedData.skills.slice(0, 20)) { // Limit to 20 skills
        updatePromises.push(
          prisma.userSkill.upsert({
            where: {
              userId_name: {
                userId: req.user.userId,
                name: skillName,
              },
            },
            create: {
              userId: req.user.userId,
              name: skillName,
            },
            update: {},
          })
        );
      }
    }

    // Add experiences
    if (parsedData.experiences.length > 0) {
      for (const exp of parsedData.experiences) {
        updatePromises.push(
          prisma.experience.create({
            data: {
              userId: req.user.userId,
              title: exp.title,
              companyName: exp.companyName,
              startDate: exp.startDate,
              endDate: exp.endDate,
              isCurrent: exp.isCurrent,
              description: exp.description,
            },
          })
        );
      }
    }

    // Add education
    if (parsedData.education.length > 0) {
      for (const edu of parsedData.education) {
        updatePromises.push(
          prisma.education.create({
            data: {
              userId: req.user.userId,
              school: edu.school,
              degree: edu.degree,
              field: edu.field,
              startDate: edu.startDate,
              endDate: edu.endDate,
            },
          })
        );
      }
    }

    await Promise.all(updatePromises);

    res.json({
      message: 'CV parsed and profile updated successfully',
      parsedData: {
        skills: parsedData.skills,
        experiences: parsedData.experiences.length,
        education: parsedData.education.length,
      },
    });
  } catch (error) {
    console.error('CV parse error:', error);
    res.status(500).json({ error: 'Failed to parse CV' });
  }
}
